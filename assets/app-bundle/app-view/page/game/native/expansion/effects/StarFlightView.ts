import { _decorator, Component, Node, UITransform, Vec3, Tween, tween, isValid } from 'cc';
const { ccclass } = _decorator;

/** 原版双星预制体的飞行表现；节点和图片均由编辑器制作。 */
@ccclass('StarFlightView')
export class StarFlightView extends Component {
    /** 清理或销毁后拒绝尚未执行的抵达通知。 */
    private cancelled = false;

    /**
     * 原版节奏：0.14秒弹出、0.2秒下沉10设计像素、0.3秒收向进度。
     * @param source 袋口的世界坐标，向上偏移50设计像素作为双星起点。
     * @param target HUD进度节点，跨父节点通过世界坐标换算。
     * @param arrived 飞行完成通知，清局时不会触发。
     */
    play(source: Vec3, target: Node, arrived: () => void): void {
        const parent = this.node.parent!.getComponent(UITransform)!;
        const start = parent.convertToNodeSpaceAR(source);
        start.y += 50;
        this.node.setPosition(start);
        this.node.setScale(0.1, 0.1, 1);
        const dip = start.clone();
        dip.y -= 10;
        tween(this.node)
            .to(0.14, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .to(0.2, { position: dip })
            .call(() => {
                if (this.cancelled) return;
                if (!isValid(target, true)) { this.finish(arrived); return; }
                const end = parent.convertToNodeSpaceAR(target.worldPosition);
                tween(this.node)
                    .to(0.3, { position: end, scale: new Vec3(0, 0, 1) })
                    .call(() => this.finish(arrived)).start();
            }).start();
    }

    /** @param arrived 抵达后只执行一次；调用方可能在回调内退出页面。 */
    private finish(arrived: () => void): void {
        if (this.cancelled) return;
        this.cancelled = true;
        this.node.destroy();
        arrived();
    }

    /** 退出和重开取消飞行，不把旧局的消除通知带入新局。 */
    cancel(): void {
        this.cancelled = true;
        Tween.stopAllByTarget(this.node);
    }

    /** 节点销毁时清理引擎补间。 */
    onDestroy(): void {
        this.cancel();
    }
}
