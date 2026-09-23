import { DouyinRevisit } from '../../../../../../app-builtin/app-model/expansion/platform/DouyinRevisit';
import { _decorator, Component, Node, Label } from 'cc';
import { getPlatformGame, platformKind } from '../../../../../../app-builtin/app-model/expansion/platform/PlatformRuntime';
import { DEV } from 'cc/env';
import { app } from '../../../../../../app/app';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { getTikTokGame, supportsTikTok } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokRuntime';
import { revisitDialogText } from '../../../../../../app-builtin/app-model/expansion/platform/RevisitDialogText';
const { ccclass, property } = _decorator;
/** 首页仅保留平台任务入口，弹窗由 XForge 独立加载。 */
@ccclass('HomeRevisitEntry')
export class HomeRevisitEntry extends Component {
    /** 桌面按钮。 */
    @property(Node) shortcutButton: Node = null!;
    /** 侧栏按钮。 */
    @property(Node) profileButton: Node = null!;
    /** 桌面入口文字。 */
    @property(Label) shortcutLabel: Label = null!;
    /** 侧栏入口文字。 */
    @property(Label) profileLabel: Label = null!;
    /** 多语言刷新函数，由编辑器保留入口文本并随语言更新。 */
    private readonly refresh = (): void => {
        this.shortcutLabel.string = revisitDialogText(GameLanguage.current, 1);
        this.profileLabel.string = revisitDialogText(GameLanguage.current, 0);
    };
    /** 按真实平台能力显示入口，开发模式便于验收。 */
    onEnable(): void {
        if (platformKind() === 'douyin') {
            DouyinRevisit.shared.install();
            DouyinRevisit.shared.subscribe(this.refreshDouyin);
            this.refreshDouyin();
            void DouyinRevisit.shared.refresh();
            return;
        }
        const api = getTikTokGame();
        this.shortcutButton.active = (DEV && !getPlatformGame()) || (!!api?.canIUse && supportsTikTok(api,'addShortcut') && supportsTikTok(api,'getShortcutMissionReward'));
        this.profileButton.active = (DEV && !getPlatformGame()) || (!!api?.canIUse && supportsTikTok(api,'startEntranceMission') && supportsTikTok(api,'getEntranceMissionReward'));
        this.refresh();
        GameLanguage.subscribe(this.refresh);
    }
    /** 抖音入口仅依据真实能力显示，标题不复用TikTok说明。 */
    private readonly refreshDouyin = (): void => {
        this.shortcutButton.active = DouyinRevisit.shared.shortcutSupported;
        this.profileButton.active = DouyinRevisit.shared.sidebarSupported;
        this.shortcutLabel.string = '添加到桌面';
        this.profileLabel.string = '侧边栏礼包';
    };
    /** 隐藏首页时解除译文订阅。 */
    onDisable(): void { GameLanguage.unsubscribe(this.refresh); DouyinRevisit.shared.unsubscribe(this.refreshDouyin); }
    /** 根据按钮保存的任务参数打开共享弹窗。 */
    request(event: unknown, mission: 'shortcut' | 'profile'): void {
        if (mission === 'shortcut' || mission === 'profile') app.manager.ui.show({ name: 'PopPlatformReward', data: mission });
    }
}

