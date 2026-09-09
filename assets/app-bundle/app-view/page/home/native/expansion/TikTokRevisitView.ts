import { _decorator, Component, Label, Node } from 'cc';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { TikTokLogin } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokLogin';
import { TikTokRevisit, TikTokMission } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokRevisit';
import { TikTokMissionRewards } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokMissionRewards';
import { PlatformStorage } from '../../../../../../app-builtin/app-model/expansion/platform/PlatformStorage';
import { getTikTokGame, supportsTikTok } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokRuntime';
import { tikTokText } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokMessages';
const { ccclass, property } = _decorator;

/** 首页原有预制体中的 TikTok 回访入口，不在运行时创建 UI 节点。 */
@ccclass('TikTokRevisitView')
export class TikTokRevisitView extends Component {
    /** 桌面入口按钮。 */
    @property(Node) shortcutButton: Node = null!;
    /** 主页回访入口按钮。 */
    @property(Node) profileButton: Node = null!;
    /** 桌面入口多语言标签。 */
    @property(Label) shortcutLabel: Label = null!;
    /** 主页入口多语言标签。 */
    @property(Label) profileLabel: Label = null!;
    /** 平台操作结果说明。 */
    @property(Label) notice: Label = null!;
    /** 合并点击和回前台查询，防止一次任务并发请求。 */
    private busy = false;
    /** 当前需要显示的消息序号，负数表示不显示。 */
    private message = -1;
    /** 回访接口使用当前有效会话验证登录前提。 */
    private readonly missions = new TikTokRevisit(() => !!TikTokLogin.shared.current);
    /** 存储未结束的任务，以便进程重启后继续领取。 */
    private readonly pendingKey = 'tumble-match.tiktok.pending-mission.v1';
    /** 稳定的语言变化回调。 */
    private readonly refreshText = (): void => {
        this.shortcutLabel.string = tikTokText(GameLanguage.current, 0);
        this.profileLabel.string = tikTokText(GameLanguage.current, 1);
        this.notice.string = this.message < 0 ? '' : tikTokText(GameLanguage.current, this.message);
    };
    /** 回前台仅检查先前由用户启动的任务，不主动弹平台导航。 */
    private readonly returned = (): void => {
        try {
            const mission = PlatformStorage.getItem(this.pendingKey);
            if (mission === 'shortcut' || mission === 'profile') void this.run(mission, true);
        } catch { this.showMessage(3); }
    };

    /** 可见时检查平台能力，普通浏览器隐藏平台入口。 */
    onEnable(): void {
        const api = getTikTokGame();
        this.shortcutButton.active = !!api?.canIUse && supportsTikTok(api, 'addShortcut') && supportsTikTok(api, 'getShortcutMissionReward');
        this.profileButton.active = !!api?.canIUse && supportsTikTok(api, 'startEntranceMission') && supportsTikTok(api, 'getEntranceMissionReward');
        this.refreshText();
        GameLanguage.subscribe(this.refreshText);
        api?.onShow?.(this.returned);
        if (api) this.returned();
    }

    /** 隐藏后解除宿主及语言监听，保留未完成任务供再次入场处理。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.refreshText);
        getTikTokGame()?.offShow?.(this.returned);
    }

    /** @param event 预制体按钮点击事件。 @param mission 预制体保存的任务用途。 */
    request(event: unknown, mission: TikTokMission): void {
        if (mission === 'shortcut' || mission === 'profile') void this.run(mission, false);
    }

    /** @param index 结果词条序号；统一通过语言表显示。 */
    private showMessage(index: number): void {
        this.message = index;
        if (this.isValid) this.refreshText();
    }

    /** @param mission 当前任务。 @param checkOnly 回前台只查询，不再次打开宿主导航。 */
    private async run(mission: TikTokMission, checkOnly: boolean): Promise<void> {
        if (this.busy) return;
        this.busy = true;
        try {
            const session = await TikTokLogin.shared.login();
            if (!session) { this.showMessage(2); return; }
            const result = await this.missions.check(mission);
            if (result === 'eligible') {
                const granted = TikTokMissionRewards.grant(mission, session.playerId);
                this.showMessage(granted === 'granted' ? 5 : granted === 'already' ? 4 : 3);
                if (granted !== 'failed') PlatformStorage.setItem(this.pendingKey, '');
            } else if (result === 'not-eligible' && !checkOnly) {
                PlatformStorage.setItem(this.pendingKey, mission);
                const opened = await this.missions.open(mission);
                this.showMessage(opened === 'opened' ? 6 : 3);
            } else this.showMessage(result === 'not-eligible' ? 6 : 3);
        } catch { this.showMessage(3); }
        finally { this.busy = false; }
    }
}
