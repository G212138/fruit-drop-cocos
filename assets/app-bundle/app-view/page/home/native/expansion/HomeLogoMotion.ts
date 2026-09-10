import { _decorator, Component, Node, Tween, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/** 首页标志的轻量循环表现，挂在适配容器内部，避免与屏幕适配竞争变换。 */
@ccclass('HomeLogoMotion')
export class HomeLogoMotion extends Component {
    /** 上下浮动半幅，单位设计像素；适配值 7，增大会更明显。 */
    @property({ type: Number }) floatDistance = 7;
    /** 呼吸缩放增量，适配值 0.015 表示最大放大 1.5%。 */
    @property({ type: Number }) scaleAmount = 0.015;
    /** 单程时长，单位秒；适配值 1.8，一轮为其两倍。 */
    @property({ type: Number }) halfCycleSeconds = 1.8;
    /** 初始位置快照，重复显示不累计位移。 */
    private originPosition: Vec3 | null = null;
    /** 初始比例快照。 */
    private originScale: Vec3 | null = null;
    /** 本组件创建的补间，停止时不影响其他组件。 */
    private motion: Tween<Node> | null = null;

    /** 显示时从基准位置启动柔和浮动。 */
    onEnable(): void {
        if (!this.originPosition) this.originPosition = this.node.position.clone();
        if (!this.originScale) this.originScale = this.node.scale.clone();
        this.stopMotion();
        const position = this.originPosition;
        const scale = this.originScale;
        const duration = Math.max(0.1, this.halfCycleSeconds);
        const distance = Math.max(0, this.floatDistance);
        const amount = Math.max(0, Math.min(0.1, this.scaleAmount));
        this.motion = tween(this.node)
            .to(duration, {
                position: new Vec3(position.x, position.y + distance, position.z),
                scale: new Vec3(scale.x * (1 + amount), scale.y * (1 + amount), scale.z),
            }, { easing: 'sineInOut' })
            .to(duration, { position: position.clone(), scale: scale.clone() }, { easing: 'sineInOut' })
            .union().repeatForever().start();
    }

    /** 首页隐藏时停止补间并还原，避免后台持续运行。 */
    onDisable(): void {
        this.stopMotion();
    }

    /** 销毁时释放补间。 */
    onDestroy(): void {
        this.stopMotion();
    }

    /** 停止本组件动画并恢复基准变换。 */
    private stopMotion(): void {
        this.motion?.stop();
        this.motion = null;
        if (this.originPosition) this.node.setPosition(this.originPosition);
        if (this.originScale) this.node.setScale(this.originScale);
    }
}
