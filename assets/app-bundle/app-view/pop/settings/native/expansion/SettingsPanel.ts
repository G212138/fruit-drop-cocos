import { _decorator, Component, Node, Label, UIOpacity, Tween, Vec3, tween, isValid, Layout, UITransform } from 'cc';
import { SettingsToggleView } from './SettingsToggleView';
import type { PreferencesSnapshot } from '../../../../../../app-builtin/app-model/expansion/GamePreferences';
const { ccclass, property } = _decorator;

/** 设置面板只展示状态和发布操作；不持有棋盘、不暂停物理、不直接执行平台调用。 */
@ccclass('SettingsPanel')
export class SettingsPanel extends Component {
    /** 共享内容节点，负责自适应高度和弹出缩放。 */
    @property(Node)
    content: Node = null!;
    /** 面板根节点透明度，关闭时连同遮罩一起淡出。 */
    @property(UIOpacity)
    opacity: UIOpacity = null!;
    /** 独立音乐设置行节点，避免跨预制体组件引用丢失。 */
    @property(Node)
    musicRow: Node = null!;
    /** 独立音效设置行节点。 */
    @property(Node)
    soundRow: Node = null!;
    /** 独立震动设置行节点。 */
    @property(Node)
    vibrateRow: Node = null!;
    /** 存储错误文本；正常时为空，原版布局接入时需预留适配区域。 */
    @property(Label)
    warningLabel: Label = null!;
    /** 只包含功能行的纵向布局，由可见内容计算高度。 */
    @property(Layout) bodyLayout: Layout = null!;
    /** 首页专用语言选择行。 */
    @property(Node) languageRow: Node = null!;
    /** 游戏内专用继续、重开和返回按钮组。 */
    @property(Node) gameActions: Node = null!;
    /** 每次打开重置语言子面板，避免上次选择页面残留。 */
    @property(Node) languageOptions: Node = null!;

    /** 随内容高度同步缩放的九宫格底框。 */
    @property(UITransform) backgroundSize: UITransform = null!;
    /** 顶部标题牌，保持固定一倍尺寸。 */
    @property(Node) titlePlate: Node = null!;
    /** 关闭按钮，始终停留在面板右上角。 */
    @property(Node) closeButton: Node = null!;

    /** 根据入口切换功能区并重排；112设计像素为标题与底部留白。 */
    setMode(mode: 'home' | 'game'): void {
        this.languageOptions.active = false;
        this.languageRow.active = mode === 'home';
        this.gameActions.active = mode === 'game';
        this.bodyLayout.updateLayout();
        const height = this.bodyLayout.node.getComponent(UITransform)!.height + 112;
        this.content.getComponent(UITransform)!.setContentSize(600, height);
        this.backgroundSize.setContentSize(600, height);
        this.titlePlate.setPosition(0, height / 2 - 18, 0);
        this.closeButton.setPosition(248, height / 2 - 36, 0);
    }

    /** 关闭动画期间拒绝重复操作，防止重复重开或返回。 */
    private closing = false;

    /** 连接各独立预制体的请求事件，业务模型仍由页面持有。 */
    onEnable(): void {
        this.musicRow.on('toggle-request', this.toggleMusic, this);
        this.soundRow.on('toggle-request', this.toggleSound, this);
        this.vibrateRow.on('toggle-request', this.toggleVibrate, this);
    }

    /** @param snapshot 当前权威设置。 @param warning 真实存储错误，无错误时为空。 */
    open(snapshot: PreferencesSnapshot, warning = ''): void {
        this.cancelAnimation();
        this.closing = false;
        this.opacity.opacity = 255;
        this.node.active = true;
        this.render(snapshot, warning);
        this.content.setScale(0, 0, 1);
        // 沿用原版 0.3 秒 backOut 弹出；更改时长影响打开反馈。
        tween(this.content).to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
    }

    /** @param snapshot 模型变更后的设置快照。 @param warning 本次保存结果说明。 */
    render(snapshot: PreferencesSnapshot, warning = ''): void {
        this.musicRow.getComponent(SettingsToggleView)!.render(snapshot.music);
        this.soundRow.getComponent(SettingsToggleView)!.render(snapshot.sound);
        this.vibrateRow.getComponent(SettingsToggleView)!.render(snapshot.vibrate);
        this.warningLabel.string = warning;
    }

    /** 音乐行请求只改变音乐开关，不影响音效与震动。 */
    private toggleMusic(): void {
        this.requestSetting('music');
    }

    /** 音效行请求只改变音效开关。 */
    private toggleSound(): void {
        this.requestSetting('sound');
    }

    /** 震动行请求交由平台适配层决定是否执行实际反馈。 */
    private toggleVibrate(): void {
        this.requestSetting('vibrate');
    }

    /** @param key 页面应更新的设置项；关闭过程中不再接受设置变更。 */
    private requestSetting(key: keyof PreferencesSnapshot): void {
        if (!this.closing && this.node.active) this.node.emit('setting-request', key);
    }

    /** 继续按钮只关闭面板；原版设置面板未暂停游戏。 */
    continueGame(): void {
        this.close('continue');
    }

    /** 返回按钮在淡出结束后通知页面，页面负责先清理当前局。 */
    returnHome(): void {
        this.close('home');
    }

    /** 重开按钮在淡出结束后通知页面，试玩应保留原试玩配置。 */
    restartGame(): void {
        this.close('restart');
    }

    /** @param action 关闭后需要页面处理的意图；不会直接切换场景或修改进度。 */
    private close(action: 'continue' | 'home' | 'restart'): void {
        if (this.closing || !this.node.active) return;
        this.closing = true;
        // 沿用原版 0.3 秒 backIn 淡出，不改为缩放收起。
        tween(this.opacity).to(0.3, { opacity: 0 }, { easing: 'backIn' }).call(() => {
            this.node.active = false;
            this.node.emit('settings-action', action);
        }).start();
    }

    /** 清理两个动画目标，防止上次关闭的回调影响再次打开。 */
    private cancelAnimation(): void {
        Tween.stopAllByTarget(this.content);
        Tween.stopAllByTarget(this.opacity);
    }

    /** 页面被外部隐藏时取消未结束动画，不触发旧导航动作。 */
    onDisable(): void {
        this.cancelAnimation();
        for (const row of [this.musicRow, this.soundRow, this.vibrateRow]) {
            if (isValid(row, true)) row.targetOff(this);
        }
    }

    /** 子节点可能先于父组件销毁，此时只清理补间，不再访问子节点事件系统。 */
    onDestroy(): void {
        this.cancelAnimation();
    }
}
