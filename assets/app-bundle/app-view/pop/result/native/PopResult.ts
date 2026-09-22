import { ResultOverlay } from './expansion/ResultOverlay';
import { ResultShare } from './expansion/ResultShare';
import { resultText } from './expansion/ResultStrings';
import { GameLanguage } from '../../../../../app-builtin/app-model/expansion/GameLanguage';
import { ThemeProgress } from '../../../../../app-builtin/app-model/expansion/ThemeProgress';
import { ResultPresentation } from './expansion/ResultPresentation';
import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
import { EditorSession } from '../../../../../app-builtin/app-model/expansion/level/EditorSession';
import { _decorator, Label, Node, Sprite, SpriteFrame, sp, Tween, tween, UIOpacity, AudioSource } from 'cc';
import { GameSettings } from '../../../../../app-builtin/app-model/expansion/GameSettings';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass, property } = _decorator;

/** 结算界面只展示结果，不在此处判定胜利或发放广告奖励。 */
@ccclass('PopResult')
export class PopResult extends BaseView {
    /** 无底框结算的多语言文案及主视觉绑定。 */
    @property(ResultOverlay) overlay: ResultOverlay = null!;
    /** 分享回调版本，防止关闭后弹出旧提示。 */
    private shareVersion = 0;
    /** 当前分享界面是否正在打开。 */
    private sharing = false;
    /** 结算装饰动画和状态音效，编辑器绑定。 */
    @property(ResultPresentation) presentation: ResultPresentation = null!;
    /** 可选解锁信息；通关时展示本关对应的新物品。 */
    @property showUnlock = true;

    /** 通过框架关闭独立结算，保持隐藏清理和事件顺序。 */
    closeResult(): void {
        this.hide();
    }

    /** @param next 框架显示许可。 @param data 本局有效性守卫；跨页加载完成时不再显示。 */
    protected beforeShow(next: (error?: string) => void, data?: { isCurrent?: () => boolean }): void {
        next(data?.isCurrent && !data.isCurrent() ? 'Result owner expired' : undefined);
    }

    /** 更新解锁光圈动画，不调整页面布局。@param deltaTime 本帧秒数；光圈每秒顺时针90度旋转。 */
    lateUpdate(deltaTime: number): void {
        if (!this.presentation?.unlockReveal && this.won && this.unlockRoot.active && this.unlockGlow) this.unlockGlow.angle -= 90 * deltaTime;
    }

    /** 预制体中的胜负结果标签。 */
    @property(Label)
    titleLabel: Label = null!;
    /** 原版成功音效，随游戏页面提前加载。 */
    @property(AudioSource) successAudio: AudioSource = null!;

    /** 仅胜利时显示的下一关按钮。 */
    @property(Node)
    nextButton: Node = null!;
    /** 失败时显示的激励复活入口，由独立预制体节点绑定。 */
    @property(Node)
    reviveButton: Node = null!;
    /** 成功与失败两套已有节点，按结果切换。 */
    @property(Node) successRoot: Node = null!;
    /** 原版失败内容容器。 */
    @property(Node) failureRoot: Node = null!;
    /** 原版成功角色动画，先1后循环1.2。 */
    @property(sp.Skeleton) winAnimation: sp.Skeleton = null!;
    /** 原版失败角色动画，片段2。 */
    @property(sp.Skeleton) failAnimation: sp.Skeleton = null!;
    /** 解锁内容容器，超出资源范围隐藏。 */
    @property(Node) unlockRoot: Node = null!;
    /** 当前解锁物图标。 */
    @property(Sprite) unlockIcon: Sprite = null!;
    /** 兼容已有预制体的名称标签；展示时隐藏。 */
    @property(Label) unlockName: Label = null!;
    /** 按原资源31起顺序绑定的图标。 */
    @property([SpriteFrame]) unlockIcons: SpriteFrame[] = [];
    /** 成功试玩的重新挑战入口。 */
    @property(Node) trialButton: Node = null!;

    /** 成功试玩返回编辑器入口，不影响正式关结算布局。 */
    @property(Node) trialReturn: Node = null!;

    /** 解锁物背后的光圈，独立旋转，不改变图标方向。 */
    @property(Node) unlockGlow: Node = null!;
    /** 失败第一层复活提示，关闭后才进入失败结算。 */
    @property(Node) revivePrompt: Node = null!;
    /** 当前失败是否已主动关闭第一层；广告取消时保持所处层级。 */
    private promptDismissed = false;

    /** 点击第一层右上角关闭按钮，显示第二层失败结算。 */
    dismissRevivePrompt(): void {
        if (this.won) return;
        this.promptDismissed = true;
        this.revivePrompt.active = false;
        this.failureRoot.active = true;
        this.failAnimation?.setAnimation(0, '2', true);
        this.presentation?.play(2);
    }

    /** 本次失败所属页面的请求回调，隐藏后清除，避免引用旧局。 */
    private onRevive: (() => void) | null = null;
    /** 当前结算所属关卡，用于原关重开。 */
    private level = 1;
    /** 本次是否胜利，阻止失败局通过隐藏按钮进入下一关。 */
    private won = false;

    /** @param data 页面已确认的胜负结果和原关卡编号。 */
    onShow(data: { won: boolean; level: number; onRevive?: () => void; notice?: string; remaining?: number; category?: 1 | 2; isCurrent?: () => boolean }): void {
        this.hideEvent = 2;
        UiClickSound.bind(this.node);
        this.level = data.level;
        this.won = data.won;
        this.onRevive = data.onRevive ?? null;
        this.titleLabel.string = '';
        if (data.notice) app.manager.ui.showToast(data.notice);
        this.unlockRoot.active = false;
        this.successRoot.active = data.won;
        if (!data.notice) this.promptDismissed = false;
        const showPrompt = !data.won && !!this.onRevive && !this.promptDismissed;
        this.revivePrompt.active = showPrompt;
        this.failureRoot.active = !data.won && !showPrompt;
        this.trialButton.active = data.won && !!EditorSession.trial;
        this.trialReturn.active = this.trialButton.active;
        this.nextButton.active = false;
        if (data.won) {
            if (GameSettings.current.snapshot.sound) this.successAudio?.play();
            if (this.winAnimation) {
                this.winAnimation.setCompleteListener(() => {
                    this.winAnimation.setCompleteListener(null);
                    this.winAnimation.setAnimation(0, '1.2', true);
                });
                this.winAnimation.setAnimation(0, '1', false);
            }
            const index = ThemeProgress.unlockIndex(data.level);
            this.unlockRoot.active = this.showUnlock && !EditorSession.trial && index >= 0 && !!this.unlockIcons[index];
            if (this.unlockName) this.unlockName.node.active = false;
            if (this.unlockRoot.active) {
                this.unlockIcon.spriteFrame = this.unlockIcons[index];
            }
            this.scheduleOnce(() => {
                if (EditorSession.trial) return;
                this.nextButton.active = true;
                const opacity = this.nextButton.getComponent(UIOpacity)!;
                opacity.opacity = 0;
                tween(opacity).to(0.3, { opacity: 255 }).start();
            }, 0.7);
        } else if (!showPrompt && this.failAnimation) this.failAnimation.setAnimation(0, '2', true);
        this.reviveButton.active = !data.won && !!this.onRevive;
        this.overlay?.render(data.level, data.remaining ?? 0, data.won && this.unlockRoot.active, data.category ?? 1);
        this.presentation?.play(data.won ? 0 : showPrompt ? 1 : 2);
    }

    /** 关闭结算遮罩后交给页面请求广告，点击本身不发放奖励。 */
    revive(): void {
        if (this.won || !this.onRevive) return;
        const request = this.onRevive;
        this.onRevive = null;
        this.closeResult();
        request();
    }

    /** 隐藏后不保留旧关卡回调。 */
    onHide(): void {
        this.shareVersion++;
        this.sharing = false;
        this.presentation?.stop();
        this.successAudio?.stop();
        this.unscheduleAllCallbacks();
        this.winAnimation?.setCompleteListener(null);
        const nextOpacity = this.nextButton?.getComponent(UIOpacity);
        if (nextOpacity) Tween.stopAllByTarget(nextOpacity);
        this.onRevive = null;
    }

    /** 由用户点击打开好友分享，不发放奖励或修改本局状态。 */
    share(): void {
        if (this.sharing) return;
        this.sharing = true;
        const version = ++this.shareVersion;
        const title = resultText(GameLanguage.current, this.won ? 'shareWinTitle' : 'shareLoseTitle', { level: this.level });
        ResultShare.open(title, this.level, this.won, result => {
            if (version !== this.shareVersion) return;
            this.sharing = false;
            if (result !== 'opened') app.manager.ui.showToast(resultText(GameLanguage.current, result === 'unavailable' ? 'shareUnavailable' : 'shareFailed'));
        });
    }

    /** 免费重开当前关卡，不改变进度或触发模拟广告。 */
    restart(): void {
        this.closeResult();
        app.manager.ui.show({ name: 'PageGame', data: { level: this.level } });
    }

    /** 已获胜时进入下一累计关卡；超出原配置数量后由加载层按原版规则循环布局。 */
    next(): void {
        if (!this.won || EditorSession.trial) return;
        this.closeResult();
        app.manager.ui.show({ name: 'PageGame', data: { level: this.level + 1 } });
    }

    /** 返回首页，下次开始读取已保存进度。 */
    home(): void {
        this.closeResult();
        app.manager.ui.show({ name: EditorSession.trial ? 'PageEditor' : 'PageHome' });
    }
}



