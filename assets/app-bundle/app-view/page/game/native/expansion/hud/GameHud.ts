import { _decorator, Component, Label, Node, Color, isValid } from 'cc';
const { ccclass, property } = _decorator;

/** HUD 只展示传入数据，按钮与标签在预制体中制作。 */
@ccclass('GameHud')
export class GameHud extends Component {
    /** 同时抵达的星星共用高亮，最后一组完成后恢复文字颜色。 */
    private pendingFlashes = 0;
    /** 进入高亮前的预制体文字颜色。 */
    private progressColor: Color | null = null;

    /** @param completed 原版0.15秒进度闪烁结束后的业务通知；文字HUD采用高亮避免读数消失。 */
    flashProgress(completed: () => void): void {
        if (this.pendingFlashes++ === 0) this.progressColor = this.status.color.clone();
        this.status.color = new Color(255, 255, 255, 255);
        this.scheduleOnce(() => {
            if (--this.pendingFlashes === 0 && this.progressColor) this.status.color = this.progressColor;
            completed();
        }, 0.15);
    }

    /** 清局取消高亮回调，避免下一局被旧的消除计数影响。 */
    clearFeedback(): void {
        this.unscheduleAllCallbacks();
        this.pendingFlashes = 0;
        if (this.progressColor && isValid(this.status, true)) this.status.color = this.progressColor;
        this.progressColor = null;
    }

    /** 销毁HUD时使所有延迟进度通知失效。 */
    onDestroy(): void {
        this.clearFeedback();
    }
    /** 剩余水果与消除进度标签。 */
    @property(Label)
    status: Label = null!;
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
        const progress = total > 0 ? Math.floor((total - remaining) / total * 100) : 0;
        this.status.string = total ? '剩余 '+remaining+' 个 · 进度 '+progress+'%' : '正在加载关卡…';
        this.hint.string = warning || '点击同类水果；整体移动时请稍候';
        this.replayButton.active = false;
    }

    /** @param level 请求关卡编号。 @param message 阻止开局的具体原因。 */
    showError(level: number, message: string): void {
        this.title.string = '第 '+level+' 关';
        this.status.string = '暂时无法开始';
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
