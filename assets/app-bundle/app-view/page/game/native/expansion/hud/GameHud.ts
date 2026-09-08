import { _decorator, Component, Label, Node } from 'cc';
import { FruitProgressView } from './FruitProgressView';
const { ccclass, property } = _decorator;

/** HUD 只展示传入数据，按钮与标签在预制体中制作。 */
@ccclass('GameHud')
export class GameHud extends Component {
    /** 页面传入PageGame内的底部进度节点，HUD不拥有其生命周期。 */
    progressViewRoot: Node = null!;
    /** 顶部水果显示边界，与下方进度位置无关。 */
    @property(Node) fruitTopBoundary: Node = null!;
    /** 读取独立进度视图。 */
    private get progressView(): FruitProgressView {
        return this.progressViewRoot.getComponent(FruitProgressView)!;
    }
    /** 星星飞向右侧进度图中心。 */
    get progressTarget(): Node {
        return this.progressView.progressRoot;
    }
    /** @param completed 进度图全亮反馈结束后的业务通知。 */
    flashProgress(completed: () => void): void {
        this.progressView.flash(completed);
    }
    /** 清局取消旧的进度闪烁回调。 */
    clearFeedback(): void {
        this.progressViewRoot?.getComponent(FruitProgressView)?.clear();
    }
    /** 原版关卡序号标签。 */
    @property(Label)
    title: Label = null!;
    /** 操作提示或资源/存档错误说明。 */
    @property(Label)
    hint: Label = null!;
    /** 未开放关卡的重玩第一关按钮，普通游戏期间隐藏。 */
    @property(Node)
    replayButton: Node = null!;

    /**
     * 显示当前关卡与真实进度。
     * @param level 原始关卡编号。
     * @param remaining 剩余水果，单位个。
     * @param total 本关总数，单位个；零表示正在加载。
     * @param warning 存档不可用时的提示，空字符串表示正常。
     */
    render(level: number, remaining: number, total: number, warning = ''): void {
        this.title.string = '第 ' + level + ' 关';
        this.progressView.render(level, remaining, total);
        this.hint.string = warning || '点击同类水果；整体移动时请稍候';
        this.replayButton.active = false;
    }

    /** @param level 请求关卡编号。 @param message 阻止开局的具体原因。 */
    showError(level: number, message: string): void {
        this.title.string = '第 '+level+' 关';
        this.progressView.render(level, 0, 0);
        this.hint.string = message;
        this.replayButton.active = true;
    }

    /** 预制体首页按钮仅发布意图，由页面负责切换。 */
    home(): void {
        this.node.emit('return-home');
    }

    /** 预制体设置按钮通知页面打开独立设置面板。 */
    settings(): void {
        this.node.emit('open-settings');
    }

    /** @param message 当前操作的真实结果说明，不将取消或失败显示为奖励成功。 */
    showNotice(message: string): void {
        this.hint.string = message;
    }

    /** 预制体重玩按钮发布明确操作，不静默替换未支持关卡。 */
    replay(): void {
        this.node.emit('replay-first');
    }
}
