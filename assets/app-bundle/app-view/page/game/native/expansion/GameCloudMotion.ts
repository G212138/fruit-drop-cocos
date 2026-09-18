import { _decorator, CCFloat, Component, UITransform, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;
/** 背景云的风向漂移及缓慢舒展，保持自然低幅度变化。 */
@ccclass('GameCloudMotion')
export class GameCloudMotion extends Component {
    /** 设计像素/秒；适配默认值 4，较远云层更慢。 */
    @property({ type: CCFloat }) speed = 4;
    /** 弧度；编辑器为每朵云分配不同相位，避免同步变化。 */
    @property({ type: CCFloat }) phase = 0;
    /** 秒；适配默认周期 28，避免快速呼吸感。 */
    @property({ type: CCFloat }) period = 28;
    /** 已运行秒数，单帧增量限制为 0.1 秒。 */
    private elapsed = 0;
    /** 初始横向缩放，保留编辑器设置的镜像方向。 */
    private baseX = 1;
    /** 初始纵向缩放。 */
    private baseY = 1;
    /** 初始透明度，范围 0～255。 */
    private baseOpacity = 255;
    /** 缓存已有透明度组件，不在运行时创建组件。 */
    private opacity: UIOpacity | null = null;
    /** 记录编辑器初始状态，启停不累积缩放误差。 */
    onLoad(): void {
        this.baseX = this.node.scale.x;
        this.baseY = this.node.scale.y;
        this.opacity = this.getComponent(UIOpacity);
        this.baseOpacity = this.opacity?.opacity ?? 255;
    }
    /** 按秒更新：横向舒展 2.5%、纵向 1.5%、透明度 6%，均为适配值。 */
    update(dt: number): void {
        const parent = this.node.parent?.getComponent(UITransform);
        const own = this.node.getComponent(UITransform);
        if (!parent || !own || parent.width <= 0) return;
        const step = Math.min(Math.max(dt, 0), 0.1);
        this.elapsed += step;
        const angle = this.elapsed * Math.PI * 2 / Math.max(this.period, 12) + this.phase;
        this.node.setScale(this.baseX * (1 + Math.sin(angle) * 0.025), this.baseY * (1 + Math.sin(angle * 0.73 + 1.2) * 0.015), 1);
        if (this.opacity) this.opacity.opacity = Math.round(this.baseOpacity * (0.94 + 0.06 * Math.sin(angle * 0.61)));
        const bound = (parent.width + own.width * Math.abs(this.baseX) * 1.025) / 2 + 20;
        const p = this.node.position;
        let x = p.x + this.speed * step;
        if (x > bound) x = -bound;
        if (x < -bound) x = bound;
        this.node.setPosition(x, p.y, p.z);
    }
}
