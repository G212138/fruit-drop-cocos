import { ScreenLayout } from '../../../../../app-builtin/app-controller/expansion/ScreenLayout';
import { EditorSession } from '../../../../../app-builtin/app-model/expansion/level/EditorSession';
import { _decorator, Label, Node, Sprite, SpriteFrame, sp, Tween, tween, UIOpacity, AudioSource } from 'cc';
import { GameSettings } from '../../../../../app-builtin/app-model/expansion/GameSettings';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass, property } = _decorator;

/** 结算界面只展示结果，不在此处判定胜利或发放广告奖励。 */
@ccclass('PopResult')
export class PopResult extends BaseView {
    /** 为真时作为PageGame固定子节点，不使用弹窗管理器显示或关闭。 */
    @property embedded = false;

    /** 直接打开已有结算节点；参数与独立弹窗相同。 */
    showEmbedded(data: { won: boolean; level: number; onRevive?: () => void; notice?: string }): void {
        this.onHide();
        this.node.active = true;
        this.node.setSiblingIndex(this.node.parent!.children.length - 1);
        this.onShow(data);
    }

    /** 清除旧回调并隐藏已有节点，重开后可再次使用。 */
    closeResult(): void {
        if (this.embedded) {
            this.onHide();
            this.node.active = false;
        } else this.hide();
    }

    /** 结算页面按设计尺寸等比适配。 */
    private readonly screenLayout = new ScreenLayout();

    /** 跟随屏幕尺寸变化调整结算页面。@param deltaTime 本帧秒数；光圈按原版每秒顺时针90度旋转。 */
    lateUpdate(deltaTime: number): void {
        this.screenLayout.apply(this.node);
        if (this.won && this.unlockRoot.active && this.unlockGlow) this.unlockGlow.angle -= 90 * deltaTime;
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
    /** 解锁图标及对应中文名称图片。 */
    @property(Sprite) unlockIcon: Sprite = null!;
    /** 当前解锁物名称文字。 */
    @property(Label) unlockName: Label = null!;
    /** 按原资源31起顺序绑定的图标。 */
    @property([SpriteFrame]) unlockIcons: SpriteFrame[] = [];
    /** 原版31至60号解锁物名称，按图片核对；下标对应关卡减一。 */
    private readonly unlockTitles = ['舒芙蕾','樱花布丁','黑糖饼','抹茶卷','草莓芝士','软心甜圈','磅蛋糕','糍粑饼','蓝莓芝士','树莓果冻','焦糖布丁','巧克力甜圈','枣泥糕','马卡龙','蓝莓饼','玛德琳蛋糕','纸杯蛋糕','瑞士卷','提拉米苏','柠檬布丁','黑森林','芝士布丁','抹茶栗子','马卡龙塔','布朗尼','树莓夏洛特','草莓布丁','香蕉蛋糕','草莓蛋糕','蓝莓慕斯'];
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
        this.failAnimation.setAnimation(0, '2', true);
    }

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
        this.titleLabel.string = data.notice || '';
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
            this.winAnimation.setCompleteListener(() => {
                this.winAnimation.setCompleteListener(null);
                this.winAnimation.setAnimation(0, '1.2', true);
            });
            this.winAnimation.setAnimation(0, '1', false);
            const index = data.level - 1;
            this.unlockRoot.active = !!this.unlockIcons[index] && !!this.unlockTitles[index];
            if (this.unlockRoot.active) {
                this.unlockIcon.spriteFrame = this.unlockIcons[index];
                this.unlockName.string = this.unlockTitles[index];
            }
            this.scheduleOnce(() => {
                if (EditorSession.trial) return;
                this.nextButton.active = true;
                const opacity = this.nextButton.getComponent(UIOpacity)!;
                opacity.opacity = 0;
                tween(opacity).to(0.3, { opacity: 255 }).start();
            }, 0.7);
        } else if (!showPrompt) this.failAnimation.setAnimation(0, '2', true);
        this.reviveButton.active = !data.won && !!this.onRevive;
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
        this.successAudio?.stop();
        this.unscheduleAllCallbacks();
        this.winAnimation.setCompleteListener(null);
        Tween.stopAllByTarget(this.nextButton.getComponent(UIOpacity)!);
        this.onRevive = null;
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
