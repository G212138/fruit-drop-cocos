import { _decorator, Component, Node, UIOpacity, Vec3, AudioSource } from 'cc';
import { GameSettings } from '../../../../../../app-builtin/app-model/expansion/GameSettings';
const { ccclass, property } = _decorator;
/** 结算动画使用预制体内切图；时间单位秒，不改变按钮可点击状态。 */
@ccclass('ResultPresentation')
export class ResultPresentation extends Component {
    /** 成功、复活、失败内容容器，保留编辑器布局。 */
    @property([Node]) cards: Node[] = [];
    /** 三种状态的主插画，成功包含可替换的解锁物。 */
    @property([Node]) illustrations: Node[] = [];
    /** 三种英文美术标题，不参与多语言。 */
    @property([Node]) titles: Node[] = [];
    /** 三组有限数量的星光切图节点。 */
    @property([Node]) particleRoots: Node[] = [];
    /** 三组扩散光环；复活组包含两圈心形光。 */
    @property([Node]) haloRoots: Node[] = [];
    /** 三种状态的按钮节点容器，只做轻微缩放入场。 */
    @property([Node]) buttonRoots: Node[] = [];
    /** 成功专用彩带，编辑器绑定48个彩带切图节点，播放一轮后隐藏。 */
    @property(Node) confettiRoot: Node = null!;
    /** 成功标题上掠过的星芒切图。 */
    @property(Node) titleGlint: Node = null!;
    /** 原版失败落点音。 */
    @property(AudioSource) failureAudio: AudioSource = null!;
    /** 原版复活提示音。 */
    @property(AudioSource) reviveAudio: AudioSource = null!;
    /** 本次播放状态；-1表示已清理。 */
    private mode = -1;
    /** 当前播放时间，秒。 */
    private elapsed = 0;
    /** 按钮入场结束后交还缩放控制给点击反馈。 */
    private buttonsSettled = false;
    /** 编辑器原始位置和比例，支持用户微调并避免复用累积偏差。 */
    private readonly origins = new Map<Node, { position: Vec3; scale: Vec3; angle: number }>();
    /** @param mode 0成功、1复活、2失败；切换前恢复所有节点。 */
    play(mode: number): void {
        this.stop();
        this.mode = mode;
        this.elapsed = 0;
        this.buttonsSettled = false;
        for (const node of [...this.titles, ...this.illustrations, ...this.buttonRoots.reduce<Node[]>((all, root) => all.concat(root.children), [])]) this.remember(node);
        if (GameSettings.current.snapshot.sound) {
            if (mode === 1) this.reviveAudio?.play();
            if (mode === 2) this.failureAudio?.play();
        }
        this.draw();
    }
    /** @param dt 本帧秒数；低帧率仍按真实时间收尾。 */
    update(dt: number): void {
        if (this.mode < 0) return;
        this.elapsed += Math.max(0, dt);
        this.draw();
    }
    /** @param node 记录当前预制体布局，首次播放后固定作为恢复基准。 */
    private remember(node: Node): void {
        if (!this.origins.has(node)) this.origins.set(node, { position: node.position.clone(), scale: node.scale.clone(), angle: node.angle });
    }
    /** @param value 归一化进度，限制在0到1。 */
    private clamp(value: number): number {
        return Math.max(0, Math.min(1, value));
    }
    /** @param value 归一化进度，柔和过冲后精确落定。 */
    private pop(value: number): number {
        const t = this.clamp(value) - 1;
        return 1 + 2.4 * t * t * t + 1.4 * t * t;
    }
    /** @param node 动画目标。@param scale 相对缩放。@param dy 相对纵向像素。@param angle 相对旋转角。 */
    private pose(node: Node | undefined, scale: number, dy = 0, angle = 0): void {
        if (!node) return;
        const origin = this.origins.get(node);
        if (!origin) return;
        node.setScale(origin.scale.x * scale, origin.scale.y * scale, origin.scale.z);
        node.setPosition(origin.position.x, origin.position.y + dy, origin.position.z);
        node.angle = origin.angle + angle;
    }
    /** @param node 切图节点。@param value 透明度0到255，仅操作编辑器绑定组件。 */
    private alpha(node: Node, value: number): void {
        const opacity = node.getComponent(UIOpacity);
        if (opacity) opacity.opacity = Math.round(Math.max(0, Math.min(255, value)));
    }
    /** 按时间绘制标题冲击、主视觉入场与粒子；游戏棋盘不震动。 */
    private draw(): void {
        const t = this.elapsed, mode = this.mode;
        const duration = mode === 0 ? 0.24 : mode === 1 ? 0.38 : 0.28;
        const p = this.clamp(t / duration);
        const recoil = t > duration && t < duration + 0.22 ? Math.sin((t - duration) * 48) * (1 - (t - duration) / 0.22) : 0;
        this.pose(this.titles[mode], 1 + (mode === 0 ? 0.55 : 0.20) * Math.pow(1 - p, 3) + recoil * 0.025,
            (1 - p) * (mode === 0 ? 50 : 25) + (mode === 0 ? recoil * 4 : 0), (mode === 0 ? -5 : -2) * (1 - p));
        const artP = this.pop((t - 0.18) / 0.40);
        let artScale = 0.05 + 0.95 * artP;
        if (mode === 1 && t > 0.6) {
            const cycle = (t - 0.6) % 2.4;
            artScale = 1 + (cycle < 0.18 ? Math.sin(cycle / 0.18 * Math.PI) * 0.12 : cycle > 0.25 && cycle < 0.43 ? Math.sin((cycle - 0.25) / 0.18 * Math.PI) * 0.08 : 0);
        }
        this.pose(this.illustrations[mode], artScale, (1 - artP) * -28, mode === 2 ? (1 - artP) * -32 : 0);
        if (!this.buttonsSettled) {
            this.buttonRoots[mode]?.children.forEach((button, i) => this.pose(button, 0.92 + 0.08 * this.pop((t - 0.25 - i * 0.035) / 0.26)));
            this.buttonsSettled = t >= 0.9;
        }
        this.drawHalos(t, mode);
        this.drawParticles(t, mode);
        this.drawConfetti(t, mode);
        if (this.titleGlint) {
            const sweep = (t - 0.45) % 4;
            const active = mode === 0 && sweep >= 0 && sweep < 0.7;
            this.titleGlint.active = active;
            if (active) {
                const u = sweep / 0.7;
                this.titleGlint.setPosition(-230 + 460 * u, 18 + Math.sin(u * Math.PI) * 65);
                this.titleGlint.angle = u * 100;
                this.alpha(this.titleGlint, Math.sin(u * Math.PI) * 245);
            }
        }
    }
    /** @param t 当前秒数。@param mode 当前状态；失败不播放爆光。 */
    private drawHalos(t: number, mode: number): void {
        this.haloRoots.forEach((root, index) => {
            root.active = index === mode && mode !== 2;
            if (!root.active) return;
            root.children.forEach((ring, i) => {
                const start = mode === 0 ? 0.2 + i * 0.12 : 0.6 + i * 0.25;
                const local = mode === 1 ? (t - start) % 2.4 : t - start;
                const u = this.clamp(local / 0.85);
                const visible = t >= start && local >= 0 && local < 0.85;
                ring.setScale(0.65 + u * 0.95, 0.65 + u * 0.95, 1);
                this.alpha(ring, visible ? Math.sin(u * Math.PI) * (mode === 0 ? 155 : 100) : 0);
            });
        });
    }
    /** @param t 当前秒数。@param mode 状态；成功爆发一次，复活少量漂浮心形，失败无粒子。 */
    private drawParticles(t: number, mode: number): void {
        this.particleRoots.forEach((root, index) => {
            root.active = index === mode && mode !== 2;
            if (!root.active) return;
            root.children.forEach((star, i) => {
                const u = this.clamp((t - 0.22 - i * 0.012) / 0.9);
                const angle = i * 2.39996;
                const radius = 80 + u * (140 + i % 3 * 24);
                star.setPosition(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72);
                star.setScale(0.45 + Math.sin(u * Math.PI) * 0.75, 0.45 + Math.sin(u * Math.PI) * 0.75, 1);
                star.angle = u * (i % 2 ? 100 : -100);
                this.alpha(star, Math.sin(u * Math.PI) * (mode === 0 ? 240 : 110));
            });
        });
    }
    /** @param t 当前秒数。@param mode 仅成功播放，彩带从屏幕两侧向中间喷出，交汇后受重力飘落。 */
    private drawConfetti(t: number, mode: number): void {
        const root = this.confettiRoot;
        if (!root) return;
        root.active = mode === 0 && t >= 0.22 && t < 4.2;
        if (!root.active) return;
        root.children.forEach((ribbon, i) => {
            const age = t - 0.22 - (i % 8) * 0.055;
            const side = i % 2 ? 1 : -1;
            const life = 2.8 + (i % 4) * 0.18;
            const visible = age >= 0 && age < life;
            ribbon.active = visible;
            if (!visible) return;
            ribbon.setPosition(side * (390 - (200 + i % 7 * 14) * age) + Math.sin(age * 5 + i) * 26,
                30 + (370 + i % 6 * 28) * age - 200 * age * age);
            ribbon.angle = side * (i * 19 + age * (150 + i % 3 * 45));
            const scale = 0.85 + i % 3 * 0.20;
            ribbon.setScale(scale * (0.25 + Math.abs(Math.cos(age * 7 + i)) * 0.75), scale, 1);
            this.alpha(ribbon, 235 * this.clamp((life - age) / 0.65));
        });
    }
    /** 关闭或切页时恢复布局并清空所有特效，不留下后台循环和迟到回调。 */
    stop(): void {
        this.mode = -1;
        this.failureAudio?.stop();
        this.reviveAudio?.stop();
        for (const [node, origin] of this.origins) {
            node.setPosition(origin.position);
            node.setScale(origin.scale);
            node.angle = origin.angle;
        }
        for (const root of [...this.haloRoots, ...this.particleRoots]) {
            root.active = false;
            for (const child of root.children) this.alpha(child, 0);
        }
        if (this.titleGlint) this.titleGlint.active = false;
        if (this.confettiRoot) this.confettiRoot.active = false;
    }
    /** 组件关闭时恢复静态布局。 */
    onDisable(): void {
        this.stop();
    }
}
