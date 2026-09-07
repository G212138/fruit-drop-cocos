import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

/** HUD 只更新预制体绑定的标签，不读取全局状态。 */
@ccclass('GameHud')
export class GameHud extends Component {
    @property(Label)
    status: Label = null!;

    /** 显示剩余数量以及已经完成的消除进度。 */
    render(remaining: number, total: number): void {
        const progress = total > 0 ? Math.round((total - remaining) / total * 100) : 0;
        this.status.string = '剩余 ' + remaining + ' 个 · 进度 ' + progress + '%';
    }
}
