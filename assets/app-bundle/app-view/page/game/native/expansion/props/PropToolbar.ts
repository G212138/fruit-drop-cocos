import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;
/** 独立道具栏，仅发布意图及展示库存。 */
@ccclass('PropToolbar')
export class PropToolbar extends Component {
    /** 刷新剩余次数标签。 */
    @property(Label) shuffleCount: Label = null!;
    /** 消除剩余次数标签。 */
    @property(Label) eliminateCount: Label = null!;
    /** 发布刷新请求，不在UI中扣次数。 */
    shuffle(): void { this.node.emit('prop-request', 'shuffle'); }
    /** 发布消除请求，不在UI中选择水果。 */
    eliminate(): void { this.node.emit('prop-request', 'eliminate'); }
    /** @param shuffle 刷新剩余次数。 @param eliminate 消除剩余次数。 */
    render(shuffle: number, eliminate: number): void {
        this.shuffleCount.string = shuffle > 0 ? '刷新 ×' + shuffle : '获取刷新';
        this.eliminateCount.string = eliminate > 0 ? '消除 ×' + eliminate : '获取消除';
    }
}
