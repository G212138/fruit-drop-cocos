import { _decorator, Button, Component, Label, Node } from 'cc';
import { DEV } from 'cc/env';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { TikTokSilentLogin } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokSilentLogin';
import { TikTokRevisit, TikTokMission } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokRevisit';
import { TikTokMissionRewards } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokMissionRewards';
import { PlatformStorage } from '../../../../../../app-builtin/app-model/expansion/platform/PlatformStorage';
import { getTikTokGame, supportsTikTok } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokRuntime';
import { tikTokText } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokMessages';
import { revisitDialogText } from './RevisitDialogText';
const { ccclass, property } = _decorator;

/** 首页回访入口和两个独立弹窗，所有 UI 由编辑器预制体配置。 */
@ccclass('TikTokRevisitView')
export class TikTokRevisitView extends Component {
    /** 桌面入口。 */
    @property(Node) shortcutButton: Node = null!;
    /** 侧边栏入口。 */
    @property(Node) profileButton: Node = null!;
    /** 桌面入口名称。 */
    @property(Label) shortcutLabel: Label = null!;
    /** 侧边栏入口名称。 */
    @property(Label) profileLabel: Label = null!;
    /** 首页任务结果提示。 */
    @property(Label) notice: Label = null!;
    /** 桌面弹窗及全屏遮罩。 */
    @property(Node) shortcutDialog: Node = null!;
    /** 侧边栏弹窗及全屏遮罩。 */
    @property(Node) profileDialog: Node = null!;
    /** 桌面任务说明。 */
    @property(Label) shortcutDescription: Label = null!;
    /** 侧边栏任务说明。 */
    @property(Label) profileDescription: Label = null!;
    /** 桌面奖励说明。 */
    @property(Label) shortcutReward: Label = null!;
    /** 侧边栏奖励说明。 */
    @property(Label) profileReward: Label = null!;
    /** 桌面操作按钮文字。 */
    @property(Label) shortcutAction: Label = null!;
    /** 侧边栏操作按钮文字。 */
    @property(Label) profileAction: Label = null!;
    /** 桌面弹窗提示。 */
    @property(Label) shortcutNotice: Label = null!;
    /** 侧边栏弹窗提示。 */
    @property(Label) profileNotice: Label = null!;
    /** 合并用户点击与返回前台查询。 */
    private busy = false;
    /** 等待当前请求结束后再查询的回前台事件。 */
    private deferredCheck = false;
    /** 当前打开的任务；关闭弹窗时清空。 */
    private selected: TikTokMission | null = null;
    /** 首页结果提示序号。 */
    private message = -1;
    /** 两个任务的独立结果提示，避免互相覆盖。 */
    private readonly messages: Record<TikTokMission, number> = { shortcut: -1, profile: -1 };
    /** 平台登录成功只作为调用任务能力的前置条件。 */
    private readonly missions = new TikTokRevisit(() => TikTokSilentLogin.shared.ready);
    /** 原有任务键继续兼容未完成的回访。 */
    private readonly pendingKey = 'tumble-match.tiktok.pending-mission.v1';

    /** 刷新两种弹窗的多语言内容和按钮状态。 */
    private readonly refreshText = (): void => {
        const text = (index: number): string => revisitDialogText(GameLanguage.current, index);
        this.shortcutLabel.string = text(1);
        this.profileLabel.string = text(0);
        this.notice.string = this.message < 0 ? '' : tikTokText(GameLanguage.current, this.message);
        this.notice.node.active = this.message >= 0 && !this.selected;
        for (const mission of ['shortcut', 'profile'] as TikTokMission[]) {
            const shortcut = mission === 'shortcut';
            const description = shortcut ? this.shortcutDescription : this.profileDescription;
            const reward = shortcut ? this.shortcutReward : this.profileReward;
            const action = shortcut ? this.shortcutAction : this.profileAction;
            const notice = shortcut ? this.shortcutNotice : this.profileNotice;
            if (!description || !reward || !action || !notice) continue;
            description.string = text(shortcut ? 3 : 2);
            reward.string = text(shortcut ? 5 : 4);
            const claimed = TikTokMissionRewards.hasLocalClaim(mission);
            action.string = text(this.busy ? 10 : claimed ? 9 : this.pendingMission() === mission ? 8 : shortcut ? 7 : 6);
            const button = action.node.parent?.getComponent(Button);
            if (button) button.interactable = !this.busy && !claimed;
            const index = this.messages[mission];
            notice.string = index === 11 ? text(11) : index < 0 ? '' : tikTokText(GameLanguage.current, index);
        }
    };

    /** 读取未结束的任务，损坏或不可用存储按无任务处理。 */
    private pendingMission(): TikTokMission | null {
        try {
            const value = PlatformStorage.getItem(this.pendingKey);
            return value === 'shortcut' || value === 'profile' ? value : null;
        } catch {
            return null;
        }
    }

    /** 回前台仅查询用户已启动的任务，不主动再次导航。 */
    private readonly returned = (): void => {
        if (!this.isValid || !this.enabledInHierarchy) return;
        const mission = this.pendingMission();
        if (!mission) return;
        if (this.busy) {
            this.deferredCheck = true;
            return;
        }
        void this.run(mission, true);
    };

    /** 开发预览展示入口供验收；发布版本按真实能力显示。 */
    onEnable(): void {
        const api = getTikTokGame();
        this.shortcutButton.active = DEV || (!!api?.canIUse && supportsTikTok(api, 'addShortcut') && supportsTikTok(api, 'getShortcutMissionReward'));
        this.profileButton.active = DEV || (!!api?.canIUse && supportsTikTok(api, 'startEntranceMission') && supportsTikTok(api, 'getEntranceMissionReward'));
        this.close();
        GameLanguage.subscribe(this.refreshText);
        api?.onShow?.(this.returned);
        if (api) this.returned();
    }

    /** 隐藏首页时关闭弹窗，解除订阅，保留未完成任务。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.refreshText);
        getTikTokGame()?.offShow?.(this.returned);
        this.deferredCheck = false;
        this.close();
    }

    /** @param event 入口按钮事件。 @param mission 编辑器保存的任务用途。 */
    request(event: unknown, mission: TikTokMission): void {
        if (mission !== 'shortcut' && mission !== 'profile') return;
        this.selected = mission;
        if (this.shortcutDialog) this.shortcutDialog.active = mission === 'shortcut';
        if (this.profileDialog) this.profileDialog.active = mission === 'profile';
        this.refreshText();
    }

    /** 关闭按钮和遮罩只关闭弹窗，不发奖。 */
    close(): void {
        this.selected = null;
        if (this.shortcutDialog) this.shortcutDialog.active = false;
        if (this.profileDialog) this.profileDialog.active = false;
        if (this.shortcutLabel && this.profileLabel && this.notice) this.refreshText();
    }

    /** @param event 主按钮事件。 @param mission 当前弹窗任务。 */
    begin(event: unknown, mission: TikTokMission): void {
        if (mission !== this.selected || this.busy) return;
        if (!getTikTokGame()) {
            this.showMessage(mission, 11);
            return;
        }
        void this.run(mission, false);
    }

    /** @param mission 消息对应任务。 @param index 平台结果词条索引。 */
    private showMessage(mission: TikTokMission, index: number): void {
        this.messages[mission] = index;
        this.message = index === 11 ? -1 : index;
        if (this.isValid && this.enabledInHierarchy) this.refreshText();
    }

    /** @param mission 任务用途。 @param checkOnly 返回前台时只查询资格。 */
    private async run(mission: TikTokMission, checkOnly: boolean): Promise<void> {
        if (this.busy) return;
        this.busy = true;
        this.refreshText();
        try {
            if (TikTokMissionRewards.hasLocalClaim(mission)) {
                this.showMessage(mission, 4);
                PlatformStorage.setItem(this.pendingKey, '');
                return;
            }
            if (!await TikTokSilentLogin.shared.login()) {
                this.showMessage(mission, 2);
                return;
            }
            if (!this.isValid || !this.enabledInHierarchy) return;
            const result = await this.missions.check(mission);
            if (result === 'eligible') {
                const granted = TikTokMissionRewards.grantLocal(mission);
                this.showMessage(mission, granted === 'granted' ? 5 : granted === 'already' ? 4 : 3);
                if (granted !== 'failed') PlatformStorage.setItem(this.pendingKey, '');
            } else if (result === 'not-eligible' && !checkOnly) {
                // 关闭弹窗或离开首页后不执行迟到的导航。
                if (!this.isValid || !this.enabledInHierarchy || this.selected !== mission) return;
                PlatformStorage.setItem(this.pendingKey, mission);
                const opened = await this.missions.open(mission);
                this.showMessage(mission, opened === 'opened' ? 6 : 3);
                if (opened === 'opened') this.deferredCheck = true;
            } else {
                this.showMessage(mission, result === 'not-eligible' ? 6 : 3);
            }
        } catch {
            this.showMessage(mission, 3);
        } finally {
            this.busy = false;
            if (this.isValid && this.enabledInHierarchy) {
                this.refreshText();
                if (this.deferredCheck) {
                    this.deferredCheck = false;
                    this.returned();
                }
            }
        }
    }
}
