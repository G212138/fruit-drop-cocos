import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

/** HUD 只展示传入数据，按钮与标签在预制体中制作。 */
@ccclass('GameHud')
export class GameHud extends Component {
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

    /** 预制体重玩按钮发布明确操作，不静默替换未支持关卡。 */
    replay(): void {
        this.node.emit('replay-first');
    }
}
