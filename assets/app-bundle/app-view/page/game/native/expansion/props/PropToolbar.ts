import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;
/** 独立道具栏，仅发布意图及展示库存。 */
@ccclass('PropToolbar')
export class PropToolbar extends Component {
    /** 刷新剩余次数标签。 */
    @property(Label) shuffleCount: Label = null!;
    /** 消除剩余次数标签。 */
    @property(Label) eliminateCount: Label = null!;
    /** 库存为零时显示原版广告标记，隐藏数量圆角标。 */
    @property(Node) shuffleAd: Node = null!;
    /** 消除库存为零时的原版广告标记。 */
    @property(Node) eliminateAd: Node = null!;
    /** 发布刷新请求，不在UI中扣次数。 */
    shuffle(): void { this.node.emit('prop-request', 'shuffle'); }
    /** 发布消除请求，不在UI中选择水果。 */
    eliminate(): void { this.node.emit('prop-request', 'eliminate'); }
    /** @param shuffle 刷新剩余次数。 @param eliminate 消除剩余次数。 */
    render(shuffle: number, eliminate: number): void {
        this.shuffleCount.string = String(shuffle);
        this.shuffleCount.node.parent!.active = shuffle > 0;
        this.shuffleAd.active = shuffle <= 0;
        this.eliminateCount.string = String(eliminate);
        this.eliminateCount.node.parent!.active = eliminate > 0;
        this.eliminateAd.active = eliminate <= 0;
    }
}
