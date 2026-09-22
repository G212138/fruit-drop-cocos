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
    /** Logo路线左右交替，按钮路线保持原来的三级跳。 */
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
    /** 首页显示时按当前品类开始，避免后台循环。 */
    play(): void {
        this.stop();
        if (!this.jumper || !this.landingButton) return;
        this.baseScale.set(this.landingButton.scale);
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
        const previous = this.elapsed;
        this.elapsed += Math.max(0, dt);
        for (const landing of (this.logoRoute ? [this.logoFromRight ? 1.4 : 1.15] : [1.2, 1.8, 2.25, 2.6])) {
            if (previous < landing && this.elapsed >= landing) this.impact = landing;
        }
        this.draw();
        if (this.elapsed >= 4.35) {
            this.index = (this.index + 1) % 30;
            this.loadItem();
        }
    }
    /** 根据当前按钮和画布尺寸绘制左入、三次落点、右出的轨迹。 */
    private draw(): void {
        if (this.logoRoute) { this.drawLogo(); return; }
        const t = this.elapsed, button = this.landingButton;
        const size = button.getComponent(UITransform)!;
        const canvasWidth = button.parent?.getComponent(UITransform)?.width || 750;
        const x0 = button.position.x - size.width * 0.36;
        const x1 = button.position.x - size.width * 0.01;
        const x2 = button.position.x + size.width * 0.25;
        const x3 = button.position.x + size.width * 0.44;
        const y = button.position.y + size.height / 2 + this.jumper.node.getComponent(UITransform)!.height / 2 - 6;
        let x: number, height: number;
        if (t < 1.2) {
            const u = t / 1.2;
            const start = -canvasWidth / 2 - 50;
            // 横向速度逐渐收敛，靠近按钮左端时接近竖直下落。
            x = start + (x0 - start) * (1 - Math.pow(1 - u, 3));
            height = 730 * (1 - u * u);
        } else if (t < 1.8) {
            const u = (t - 1.2) / 0.6;
            x = x0 + (x1 - x0) * u;
            height = 4 * 225 * u * (1 - u);
        } else if (t < 2.25) {
            const u = (t - 1.8) / 0.45;
            x = x1 + (x2 - x1) * u;
            height = 4 * 78 * u * (1 - u);
        } else if (t < 2.6) {
            const u = (t - 2.25) / 0.35;
            x = x2 + (x3 - x2) * u;
            height = 4 * 36 * u * (1 - u);
        } else {
            const u = Math.min(1, (t - 2.6) / 1.15);
            x = x3 + (canvasWidth / 2 + 70 - x3) * u;
            height = 4 * 32 * u * (1 - u) - 90 * u * u;
        }
        this.jumper.node.setPosition(x, y + height, 0);
        this.jumper.node.angle = -t * 85;
        if (t >= 3.75) this.jumper.node.active = false;
        const age = t - this.impact;
        const pulse = age >= 0 && age < 0.32 ? Math.sin(age / 0.32 * Math.PI * 2) * (1 - age / 0.32) : 0;
        button.setScale(this.baseScale.x * (1 + pulse * 0.035), this.baseScale.y * (1 - pulse * 0.055), this.baseScale.z);
    }
    /** 两侧同时以恒定重力运动，落点反弹损失能量；横向匀速、不缓停。 */
    private drawLogo(): void {
        const t = this.elapsed * 1.35, logo = this.landingButton;
        const size = logo.getComponent(UITransform)!;
        const width = logo.parent?.getComponent(UITransform)?.width || 750;
        const direction = this.logoFromRight ? -1 : 1;
        const duration = this.logoFromRight ? 1.4 : 1.15;
        const initialHeight = this.logoFromRight ? 280 : 220;
        const gravity = 700;
        const edge = width / 2 + 65;
        const landingX = logo.position.x - direction * size.width * 0.22;
        const y = logo.position.y + size.height / 2 + this.jumper.node.getComponent(UITransform)!.height / 2 - 16;
        const vx = (landingX + direction * edge) / duration;
        const vy = (0.5 * gravity * duration * duration - initialHeight) / duration;
        let x: number, height: number;
        if (t < duration) {
            x = -direction * edge + vx * t;
            height = initialHeight + vy * t - 0.5 * gravity * t * t;
        } else {
            let age = t - duration;
            let rebound = (gravity * duration - vy) * 0.8;
            x = landingX + vx * age;
            // 仍在Logo顶面范围时继续衰减反弹，离开边缘后自然下落。
            let contactX = landingX;
            for (let bounce = 0; bounce < 5; bounce++) {
                const flight = 2 * rebound / gravity;
                const nextX = contactX + vx * flight;
                if (age < flight || Math.abs(nextX - logo.position.x) > size.width / 2) break;
                age -= flight;
                contactX = nextX;
                rebound *= 0.72;
            }
            height = rebound * age - 0.5 * gravity * age * age;
        }
        this.jumper.node.active = Math.abs(x) <= edge && height > -size.height - 90 && t < 3.6;
        this.jumper.node.setPosition(x, y + height, 0);
        this.jumper.node.angle = -direction * t * 75;
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
