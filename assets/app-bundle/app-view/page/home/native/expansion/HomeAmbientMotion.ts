import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, assetManager, isValid } from 'cc';
import { GameTheme } from '../../../../../../app-builtin/app-model/expansion/GameTheme';
const { ccclass, property } = _decorator;
/** 首页单个物品沿按钮跳跃，不参与游戏物理和输入。 */
@ccclass('HomeAmbientMotion')
export class HomeAmbientMotion extends Component {
    /** 保留旧文字绑定，只用于恢复正常比例。 */
    @property(Node) playLabel: Node = null!;
    /** 编辑器制作的独立装饰物品。 */
    @property(Sprite) jumper: Sprite = null!;
    /** 按钮外层回弹容器，不覆盖按钮内部点击反馈。 */
    @property(Node) landingButton: Node = null!;
    /** Logo 双侧并行，按钮单侧进入，均采用衰减弹跳。 */
    @property({ type: Boolean }) logoRoute = false;
    /** Logo右侧并行轨迹，独立落点和起始物品避免重叠。 */
    @property({ type: Boolean }) logoFromRight = false;
    /** 当前物品循环时间，秒。 */
    private elapsed = 0;
    /** 页面显隐及异步请求版本。 */
    private running = false;
    /** 图片请求完成前暂停时间轴。 */
    private loading = false;
    private request = 0;
    /** 当前品类和零起始物品序号。 */
    private category = 1;
    private index = 0;
    /** 当前图片持有引用，切换或关闭时释放。 */
    private held: SpriteFrame | null = null;
    /** 按钮原始比例，回弹结束精确恢复。 */
    private baseScale = new Vec3(1, 1, 1);
    /** 最近一次落点的时间，秒。 */
    private impact = -10;
    /** 共用 Logo 表现组件，避免左右同时改写比例。 */
    private logoMotion: (Component & { useImpactMotion(): void; bounce(): void }) | null = null;
    /** 当前路线周期，含离屏后 0.18 秒的衔接间隔。 */
    private cycleDuration = 4.35;
    /** 首页显示时按当前品类开始，避免后台循环。 */
    play(): void {
        this.stop();
        if (!this.jumper || !this.landingButton) return;
        this.baseScale.set(this.landingButton.scale);
        if (this.logoRoute) {
            this.logoMotion = this.landingButton.getComponentInChildren('HomeLogoMotion') as typeof this.logoMotion;
            this.logoMotion?.useImpactMotion();
        }
        this.running = true;
        this.category = GameTheme.active;
        this.index = this.logoRoute && this.logoFromRight ? 15 : 0;
        this.loadItem();
    }
    /** 加载单个共享图片，过期回调不会应用到关闭后的首页。 */
    private loadItem(): void {
        const ticket = ++this.request;
        this.loading = true;
        this.elapsed = 0;
        this.impact = -10;
        this.cycleDuration = 4.35;
        this.jumper.node.active = false;
        const kind = this.category === 2 ? 'dessert' : 'fruit';
        const bundle = assetManager.getBundle('shared-items');
        if (!bundle) { this.loading = false; this.elapsed = 4.35; return; }
        bundle.load(`${kind}/${kind}-${this.index + 1}/spriteFrame`, SpriteFrame, (error, frame: SpriteFrame) => {
            if (!this.running || !isValid(this) || ticket !== this.request) return;
            this.loading = false;
            if (error || !frame) { this.elapsed = 4.35; return; }
            frame.addRef();
            this.held?.decRef();
            this.held = frame;
            this.jumper.spriteFrame = frame;
            this.jumper.sizeMode = Sprite.SizeMode.CUSTOM;
            const size = frame.originalSize;
            const scale = (this.logoRoute ? 58 : 68) / Math.max(size.width, size.height);
            this.jumper.node.getComponent(UITransform)!.setContentSize(size.width * scale, size.height * scale);
            this.jumper.node.active = true;
            this.draw();
        });
    }
    /** @param dt 帧间隔秒数，按实际时间推进并跨帧检测落点。 */
    update(dt: number): void {
        if (!this.running) return;
        if (this.category !== GameTheme.active) {
            this.category = GameTheme.active;
            this.index = 0;
            this.landingButton.setScale(this.baseScale);
            this.loadItem();
            return;
        }
        if (this.loading) return;
        this.elapsed += Math.max(0, dt);
        this.draw();
        if (this.elapsed >= this.cycleDuration) {
            this.index = (this.index + 1) % 30;
            this.loadItem();
        }
    }
    /** 恒定横向速度与重力弹道；只有顶面内的落点反弹，出界自然下落。 */
    private draw(): void {
        const surface = this.landingButton;
        const size = surface.getComponent(UITransform)!;
        const width = surface.parent?.getComponent(UITransform)?.width || 750;
        const direction = this.logoRoute && this.logoFromRight ? -1 : 1;
        const edge = width / 2 + 65;
        // 设计分辨率下每秒 440/400 像素；整条路线保持横向速度，不在落点换挡。
        const speed = (this.logoRoute ? 440 : 400) * width / 750;
        const vx = direction * speed;
        const startX = -direction * edge;
        const firstX = surface.position.x - direction * size.width * 0.4;
        const firstTime = Math.abs(firstX - startX) / speed;
        // 重力单位为设计像素/秒²；每跳保留 64% 竖直速度，跳高自然衰减。
        const gravity = this.logoRoute ? 1800 : 1600;
        const restitution = 0.64;
        const t = this.elapsed;
        const x = startX + vx * t;
        const baseline = surface.position.y + size.height / 2 + this.jumper.node.getComponent(UITransform)!.height / 2 - (this.logoRoute ? 16 : 6);
        let height: number;
        let contact = -10;
        if (t < firstTime) {
            height = 0.5 * gravity * (firstTime * firstTime - t * t);
        } else {
            contact = firstTime;
            let age = t - firstTime;
            let rebound = gravity * firstTime * restitution;
            // 每次求解完整飞行时间；即使低帧率跨过落点也不会穿过顶面。
            for (let bounce = 0; bounce < 12; bounce++) {
                const flight = 2 * rebound / gravity;
                const nextTime = contact + flight;
                const nextX = startX + vx * nextTime;
                if (age < flight || Math.abs(nextX - surface.position.x) > size.width * 0.47) break;
                age -= flight;
                contact = nextTime;
                rebound *= restitution;
            }
            height = rebound * age - 0.5 * gravity * age * age;
        }
        if (contact > this.impact) {
            this.impact = contact;
            if (this.logoRoute) this.logoMotion?.bounce();
        }
        // 所有路线离屏后只留短间隔，下一件物品接续，不再长时间空等。
        const exitTime = 2 * edge / speed;
        this.cycleDuration = exitTime + 0.18;
        this.jumper.node.active = t < exitTime;
        this.jumper.node.setPosition(x, baseline + height, 0);
        this.jumper.node.angle = -direction * t * 110;
        if (!this.logoRoute) {
            const age = t - this.impact;
            const pulse = age >= 0 && age < 0.32 ? Math.sin(age / 0.32 * Math.PI * 2) * (1 - age / 0.32) : 0;
            surface.setScale(this.baseScale.x * (1 + pulse * 0.035), this.baseScale.y * (1 - pulse * 0.055), this.baseScale.z);
        }
    }
    /** 停止循环，取消迟到请求并恢复按钮。 */
    stop(): void {
        this.running = false;
        ++this.request;
        if (this.jumper) { this.jumper.node.active = false; this.jumper.spriteFrame = null; }
        if (this.landingButton) this.landingButton.setScale(this.baseScale);
        this.held?.decRef();
        this.held = null;
    }
    /** 节点关闭时停止装饰动画。 */
    onDisable(): void { this.stop(); }
    /** 销毁时释放当前图片。 */
    onDestroy(): void { this.stop(); }
}
