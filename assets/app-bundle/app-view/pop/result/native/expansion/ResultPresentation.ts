import { _decorator, Component, Node, UIOpacity, UITransform, Vec3, AudioSource, Sprite, Vec4, Color } from 'cc';
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
    /** 顶部持续随机飘落的彩带节点，覆盖实际屏幕。 */
    @property(Node) rainRoot: Node = null!;
    /** 成功标题全尺寸字面扫光，使用标题透明度限制光带。 */
    @property(Node) titleGlint: Node = null!;
    /** 复活提示、最终失败标题的扫光节点，由编辑器绑定。 */
    @property([Node]) failureTitleGlints: Node[] = [];
    /** 主按钮独立动效容器，避免覆盖 Button 自身点击缩放。 */
    @property([Node]) primaryMotions: Node[] = [];
    /** 主按钮表面扫光，按下一关、试玩重试、复活、重新挑战排列。 */
    @property([Node]) primaryGlints: Node[] = [];
    /** 新品揭晓物品及特效节点，全部在预制体内制作。 */
    @property(Node) unlockReveal: Node = null!;
    @property(Sprite) revealItem: Sprite = null!;
    @property([Node]) revealRays: Node[] = [];
    @property(Node) revealWave: Node = null!;
    @property(Node) revealStage: Node = null!;
    @property(Node) revealGlint: Node = null!;
    @property([Node]) revealSparks: Node[] = [];
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
    /** 每次入场只采样一次，避免逐帧随机导致彩带抖动；距离为设计像素，时间为秒。 */
    private ribbons: { delay: number; rise: number; life: number; startX: number; startY: number; endX: number; top: number; fall: number; sway: number; frequency: number; phase: number; spin: number; scale: number; roll: number }[] = [];
    /** 当前视口设计宽、高以及内容容器相对屏幕中心偏移，单位像素。 */
    private viewport = { width: 750, height: 1334, offset: 0 };
    /** 顶部彩带各自的出生时刻和周期；只在重生时随机。 */
    private rain: { birth: number; duration: number; x: number; sway: number; phase: number; spin: number; scale: number; roll: number }[] = [];
    /** 编辑器原始位置和比例，支持用户微调并避免复用累积偏差。 */
    private readonly origins = new Map<Node, { position: Vec3; scale: Vec3; angle: number }>();
    /** @param mode 0成功、1复活、2失败；切换前恢复所有节点。 */
    play(mode: number): void {
        this.stop();
        this.mode = mode;
        this.elapsed = 0;
        if (mode === 0) {
            const size = this.node?.getComponent(UITransform);
            this.viewport = { width: size?.width || 750, height: size?.height || 1334, offset: this.cards[0]?.position.y || 0 };
            this.prepareConfetti();
            this.rain = (this.rainRoot?.children || []).map((_, i) => this.newRain(i, true));
        }
        this.buttonsSettled = false;
        if (this.revealItem) {
            this.remember(this.revealItem.node);
            const glint = this.revealGlint?.getComponent(Sprite);
            if (glint) glint.spriteFrame = this.revealItem.spriteFrame;
        }
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
        this.drawUnlock(t, mode);
        this.drawPrimaryButtons(t, mode);
        this.drawHalos(t, mode);
        this.drawParticles(t, mode);
        this.drawConfetti(t, mode);
        this.drawRain(t, mode);
        const titleGlints = [this.titleGlint, ...this.failureTitleGlints];
        titleGlints.forEach((node, index) => { if (node) node.active = index === mode; });
        const glint = titleGlints[mode];
        if (glint) {
            const sweep = (t - 0.65) % 4;
            const active = mode >= 0 && sweep >= 0 && sweep < 1.1;
            glint.active = active;
            if (active) {
                const u = sweep / 1.1;
                glint.setPosition(0, 0);
                glint.angle = 0;
                const sprite = glint.getComponent(Sprite);
                const uv = sprite?.spriteFrame?.uv;
                const material = sprite?.getMaterialInstance?.(0);
                if (uv && material) {
                    // 使用实际图集 UV 基向量，兼容打包旋转及动态合图。
                    material.setProperty('sweepX', new Vec4(uv[0], uv[1], uv[2] - uv[0], uv[3] - uv[1]));
                    material.setProperty('sweepY', new Vec4(uv[4] - uv[0], uv[5] - uv[1], -0.25 + 1.7 * u, 0.18));
                }
                this.alpha(glint, 255);
            }
        }
    }
    /** @param t 播放秒数。@param mode 成功新品专属；1秒揭晓后转为悬浮循环。 */
    private drawUnlock(t: number, mode: number): void {
        if (!this.unlockReveal?.active || !this.revealItem || mode !== 0) return;
        const reveal = this.clamp((t - 0.25) / 0.45);
        const light = Math.round(45 + 210 * reveal);
        this.revealItem.color = new Color(light, light, light, 255);
        this.pose(this.revealItem.node, 0.72 + 0.28 * this.pop((t - 0.25) / 0.55), t > 0.8 ? Math.sin((t - 0.8) * 1.7) * 9 : 0);
        this.revealRays.forEach((ray, i) => {
            ray.angle = (i ? -1 : 1) * t * (i ? 11 : 17);
            ray.setScale(0.75 + 0.25 * reveal + Math.sin(t * 1.8 + i) * 0.04, 0.75 + 0.25 * reveal + Math.sin(t * 1.8 + i) * 0.04, 1);
            this.alpha(ray, reveal * (i ? 145 : 210));
        });
        if (this.revealStage) this.alpha(this.revealStage, reveal * (165 + Math.sin(t * 2) * 20));
        if (this.revealWave) {
            const u = this.clamp((t - 0.45) / 0.75);
            this.revealWave.active = t >= 0.45 && u < 1;
            this.revealWave.setScale(0.25 + u * 1.6, 0.25 + u * 1.6, 1);
            this.alpha(this.revealWave, (1 - u) * 210);
        }
        this.revealSparks.forEach((spark, i) => {
            const a = i * Math.PI * 2 / this.revealSparks.length;
            const u = this.clamp(t / 0.65);
            const radius = t < 0.65 ? 260 - 200 * u : 155 + Math.sin(t * 1.3 + i) * 32;
            spark.setPosition(Math.cos(a + t * 0.12) * radius, Math.sin(a + t * 0.12) * radius);
            spark.angle = t * 40 + i * 30;
            this.alpha(spark, t < 0.65 ? 200 : 65 + 100 * Math.sin(t * 2 + i) ** 2);
        });
        if (this.revealGlint) {
            const phase = (t - 1.15) % 4.6;
            this.revealGlint.active = phase >= 0 && phase < 1.25;
            const sprite = this.revealGlint.getComponent(Sprite);
            const uv = sprite?.spriteFrame?.uv;
            const mat = sprite?.getMaterialInstance?.(0);
            if (this.revealGlint.active && uv && mat) {
                mat.setProperty('sweepX', new Vec4(uv[0], uv[1], uv[2] - uv[0], uv[3] - uv[1]));
                mat.setProperty('sweepY', new Vec4(uv[4] - uv[0], uv[5] - uv[1], -0.25 + 1.7 * phase / 1.25, 0.23));
                this.alpha(this.revealGlint, 180);
            }
        }
    }
    /** @param t 播放秒数。@param mode 结算状态；呼吸幅度2%，扫光与标题错开。 */
    private drawPrimaryButtons(t: number, mode: number): void {
        const modes = [0, 0, 1, 2];
        this.primaryMotions.forEach((motion, i) => {
            const glint = this.primaryGlints[i];
            const visible = modes[i] === mode && motion.children[0]?.active !== false;
            if (t >= 0.9) this.pose(motion, visible ? 1 + 0.02 * Math.sin((t - 0.9) * Math.PI / 2) ** 2 : 1);
            if (!glint) return;
            const sweep = (t - 1.6) % 3.8;
            glint.active = visible && sweep >= 0 && sweep < 1.2;
            if (!glint.active) return;
            const sprite = glint.getComponent(Sprite);
            const uv = sprite?.spriteFrame?.uv;
            const material = sprite?.getMaterialInstance?.(0);
            if (uv && material) {
                material.setProperty('sweepX', new Vec4(uv[0], uv[1], uv[2] - uv[0], uv[3] - uv[1]));
                material.setProperty('sweepY', new Vec4(uv[4] - uv[0], uv[5] - uv[1], -0.25 + 1.7 * sweep / 1.2, 0.22));
            }
            this.alpha(glint, 115);
        });
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
    /** 随机错开左右喷射的落点和物理参数，分层落点覆盖整个750像素设计宽度。 */
    private prepareConfetti(): void {
        const count = this.confettiRoot?.children.length ?? 0;
        const slots = Array.from({ length: count }, (_, i) => i);
        for (let i = count - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [slots[i], slots[j]] = [slots[j], slots[i]];
        }
        this.ribbons = slots.map((slot, i) => ({
            delay: 0.12 + Math.random() * 0.65,
            rise: 0.6 + Math.random() * 0.65,
            life: 4.1 + Math.random() * 1.3,
            startX: (i % 2 ? 1 : -1) * (this.viewport.width / 2 + Math.random() * 35),
            startY: this.viewport.height * (-0.15 + Math.random() * 0.25) - this.viewport.offset,
            endX: this.viewport.width * (-0.5 + (slot + Math.random()) / Math.max(1, count)),
            top: this.viewport.height * (0.12 + Math.random() * 0.36) - this.viewport.offset,
            fall: this.viewport.height * (0.17 + Math.random() * 0.12),
            sway: 25 + Math.random() * 55,
            frequency: 1.3 + Math.random() * 2.5,
            phase: Math.random() * Math.PI * 2,
            spin: (Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 240),
            scale: 0.65 + Math.random() * 0.85,
            roll: 2 + Math.random() * 6,
        }));
    }
    /** @param t 当前秒数。@param mode 先从两侧向内喷散，再按独立速度与侧风飘落。 */
    private drawConfetti(t: number, mode: number): void {
        const root = this.confettiRoot;
        if (!root) return;
        root.active = mode === 0 && this.ribbons.some(p => t >= p.delay && t < p.delay + p.life);
        if (!root.active) return;
        root.children.forEach((ribbon, i) => {
            const p = this.ribbons[i];
            if (!p) { ribbon.active = false; return; }
            const age = t - p.delay;
            ribbon.active = age >= 0 && age < p.life;
            if (!ribbon.active) return;
            const u = this.clamp(age / p.rise);
            const travel = 1 - Math.pow(1 - u, 2);
            const falling = Math.max(0, age - p.rise);
            const drift = p.sway * (Math.sin(falling * p.frequency + p.phase) - Math.sin(p.phase));
            ribbon.setPosition(p.startX + (p.endX - p.startX) * travel + drift,
                p.startY + (p.top - p.startY) * travel - p.fall * Math.pow(falling, 1.12));
            ribbon.angle = p.phase * 180 / Math.PI + age * p.spin;
            ribbon.setScale(p.scale * (0.2 + Math.abs(Math.cos(age * p.roll + p.phase)) * 0.8), p.scale, 1);
            this.alpha(ribbon, 235 * this.clamp(age / 0.08) * this.clamp((p.life - age) / 0.8));
        });
    }
    /** @param index 彩带列号，分层随机覆盖全宽。@param initial 首次分散到不同下落阶段。 */
    private newRain(index: number, initial = false): { birth: number; duration: number; x: number; sway: number; phase: number; spin: number; scale: number; roll: number } {
        const duration = 3.6 + Math.random() * 3.0;
        const count = this.rainRoot?.children.length || 1;
        return {
            birth: initial ? -Math.random() * duration : this.elapsed,
            duration,
            x: this.viewport.width * (-0.5 + (index + Math.random()) / count),
            sway: 15 + Math.random() * 45,
            phase: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 300,
            scale: 0.6 + Math.random() * 0.65,
            roll: 2 + Math.random() * 5,
        };
    }
    /** @param t 当前秒数。@param mode 成功页持续下落，越过屏幕底部后回到顶部重生。 */
    private drawRain(t: number, mode: number): void {
        const root = this.rainRoot;
        if (!root) return;
        root.active = mode === 0;
        if (!root.active) return;
        root.children.forEach((ribbon, i) => {
            let p = this.rain[i];
            if (!p || t >= p.birth + p.duration) p = this.rain[i] = this.newRain(i);
            const age = t - p.birth, u = this.clamp(age / p.duration);
            ribbon.setPosition(p.x + Math.sin(age * 1.8 + p.phase) * p.sway,
                this.viewport.height / 2 + 90 - (this.viewport.height + 180) * u - this.viewport.offset);
            ribbon.angle = p.phase * 180 / Math.PI + age * p.spin;
            ribbon.setScale(p.scale * (0.25 + Math.abs(Math.cos(age * p.roll + p.phase)) * 0.75), p.scale, 1);
            this.alpha(ribbon, 215 * this.clamp((1 - u) / 0.1));
        });
    }
    /** 关闭或切页时恢复布局并清空所有特效，不留下后台循环和迟到回调。 */
    stop(): void {
        this.mode = -1;
        if (this.revealItem) this.revealItem.color = Color.WHITE;
        if (this.revealGlint) this.revealGlint.active = false;
        if (this.revealWave) this.revealWave.active = false;
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
        this.failureTitleGlints.forEach(node => { if (node) node.active = false; });
        this.primaryGlints.forEach(node => { if (node) node.active = false; });
        if (this.confettiRoot) this.confettiRoot.active = false;
        if (this.rainRoot) this.rainRoot.active = false;
    }
    /** 组件关闭时恢复静态布局。 */
    onDisable(): void {
        this.stop();
    }
}
