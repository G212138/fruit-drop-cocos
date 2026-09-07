import { EditorSession } from '../../../../../app-builtin/app-model/expansion/level/EditorSession';
import { _decorator, Label, Node } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass, property } = _decorator;

/** 结算界面只展示结果，不在此处判定胜利或发放广告奖励。 */
@ccclass('PopResult')
export class PopResult extends BaseView {
    /** 预制体中的胜负结果标签。 */
    @property(Label)
    titleLabel: Label = null!;
    /** 仅胜利时显示的下一关按钮。 */
    @property(Node)
    nextButton: Node = null!;
    /** 失败时显示的激励复活入口，由独立预制体节点绑定。 */
    @property(Node)
    reviveButton: Node = null!;
    /** 本次失败所属页面的请求回调，隐藏后清除，避免引用旧局。 */
    private onRevive: (() => void) | null = null;
    /** 当前结算所属关卡，用于原关重开。 */
    private level = 1;
    /** 本次是否胜利，阻止失败局通过隐藏按钮进入下一关。 */
    private won = false;

    /** @param data 页面已确认的胜负结果和原关卡编号。 */
    onShow(data: { won: boolean; level: number; onRevive?: () => void; notice?: string }): void {
        this.level = data.level;
        this.won = data.won;
        this.onRevive = data.onRevive ?? null;
        this.titleLabel.string = data.notice || (data.won ? '第 '+data.level+' 关完成！' : '底部水果堆满了');
        this.nextButton.active = data.won && !EditorSession.trial;
        this.reviveButton.active = !data.won && !!this.onRevive;
    }

    /** 关闭结算遮罩后交给页面请求广告，点击本身不发放奖励。 */
    revive(): void {
        if (this.won || !this.onRevive) return;
        const request = this.onRevive;
        this.onRevive = null;
        this.hide();
        request();
    }

    /** 隐藏后不保留旧关卡回调。 */
    onHide(): void {
        this.onRevive = null;
    }

    /** 免费重开当前关卡，不改变进度或触发模拟广告。 */
    restart(): void {
        this.hide();
        app.manager.ui.show({ name: 'PageGame', data: { level: this.level } });
    }

    /** 已获胜时进入下一累计关卡；超出原配置数量后由加载层按原版规则循环布局。 */
    next(): void {
        if (!this.won || EditorSession.trial) return;
        this.hide();
        app.manager.ui.show({ name: 'PageGame', data: { level: this.level + 1 } });
    }

    /** 返回首页，下次开始读取已保存进度。 */
    home(): void {
        this.hide();
        app.manager.ui.show({ name: EditorSession.trial ? 'PageEditor' : 'PageHome' });
    }
}
