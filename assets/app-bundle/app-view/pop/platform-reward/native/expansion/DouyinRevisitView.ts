import { DEV } from 'cc/env';
import { platformKind } from '../../../../../../app-builtin/app-model/expansion/platform/PlatformRuntime';
import { _decorator, Button, Component, Label, Node } from 'cc';
import { app } from '../../../../../../app/app';
import { DouyinRevisit } from '../../../../../../app-builtin/app-model/expansion/platform/DouyinRevisit';
import { DouyinMission, DouyinMissionRewards } from '../../../../../../app-builtin/app-model/expansion/platform/DouyinMissionRewards';
const { ccclass, property } = _decorator;
/** 抖音中文任务弹窗，独立于TikTok任务及翻译。 */
@ccclass('DouyinRevisitView')
export class DouyinRevisitView extends Component {
    /** 编辑器绑定的桌面与侧边栏面板。 */
    @property(Node) shortcutDialog: Node = null!;
    @property(Node) profileDialog: Node = null!;
    /** 原稿中的标题与奖励为静态切图，仅按钮与结果提示动态更新。 */
    @property(Label) shortcutAction: Label = null!;
    @property(Label) profileAction: Label = null!;
    @property(Label) shortcutNotice: Label = null!;
    @property(Label) profileNotice: Label = null!;
    /** 原英文标题和平台示意图，抖音显示独立中文步骤。 */
    @property([Node]) englishArt: Node[] = [];
    @property([Node]) chineseArt: Node[] = [];
    /** 当前任务与操作占用状态。 */
    private selected: DouyinMission | null = null;
    private busy = false;
    /** 保留两种任务独立提示。 */
    private messages = { profile: '', shortcut: '' };
    /** 页面刷新引用稳定，便于离开时注销。 */
    private readonly refresh = (): void => {
        for (const mission of ['profile', 'shortcut'] as DouyinMission[]) {
            const action = mission === 'profile' ? this.profileAction : this.shortcutAction;
            const notice = mission === 'profile' ? this.profileNotice : this.shortcutNotice;
            const claimed = DouyinMissionRewards.claimed(mission);
            const service = DouyinRevisit.shared;
            const supported = mission === 'profile' ? service.sidebarSupported : service.shortcutSupported;
            action.string = this.busy ? '请稍候…' : claimed ? (mission === 'profile' ? '今日已领取' : '已领取')
                : service.eligible(mission) ? '立即领奖' : mission === 'profile' ? '去首页侧边栏' : '添加到桌面';
            const button = action.node.parent?.getComponent(Button);
            if (button) button.interactable = !this.busy && !claimed && supported;
            notice.string = this.messages[mission] || (!supported ? (DEV && platformKind() === 'browser' ? '界面预览，请在抖音客户端完成任务' : '当前设备暂不支持此任务') : '');
        }
    };
    /** 使用编辑器创建的中文标题和步骤，清除英文示意图。 */
    onEnable(): void {
        this.englishArt.forEach(node => node.active = false);
        this.chineseArt.forEach(node => node.active = true);
        DouyinRevisit.shared.install();
        DouyinRevisit.shared.subscribe(this.refresh);
        this.refresh();
    }
    /** 关闭不撤回有效奖励，异步回调不再修改隐藏界面。 */
    onDisable(): void {
        DouyinRevisit.shared.unsubscribe(this.refresh);
        this.selected = null;
    }
    /** 打开任务时查询资格，不进行自动导航或自动发奖。 */
    request(_event: unknown, mission: DouyinMission): void {
        this.selected = mission;
        this.shortcutDialog.active = mission === 'shortcut';
        this.profileDialog.active = mission === 'profile';
        this.refresh();
        void DouyinRevisit.shared.refresh();
    }
    /** 所有关闭入口交给现有独立弹窗管理器。 */
    close(): void { this.node.emit('reward-close'); }
    /** 同步触发用户手势API，禁止在添加桌面前await登录或能力查询。 */
    begin(_event: unknown, mission: DouyinMission): void {
        if (mission !== this.selected || this.busy || DouyinMissionRewards.claimed(mission)) return;
        const service = DouyinRevisit.shared;
        this.busy = true;
        this.refresh();
        if (service.eligible(mission)) {
            void service.claim(mission).then(result => {
                this.messages[mission] = result === 'granted' ? '领取成功，道具已到账' : result === 'already' ? '已领取，请勿重复操作'
                    : result === 'incomplete' ? '任务尚未完成，请按步骤完成后再领取' : '保存失败，请稍后重试';
            }).then(() => this.finish(), () => { this.messages[mission] = '操作失败，请稍后重试'; this.finish(); });
        } else {
            if (mission === 'profile') this.close();
            // open立即调用宿主API，Promise只用于处理后续结果。
            void service.open(mission).then(async opened => {
                if (opened && mission === 'shortcut') await service.refresh();
                this.messages[mission] = opened ? (mission === 'profile' ? '请从首页侧边栏打开“难不到我吧”' : '请确认已添加，再点击领取奖励') : '未完成操作，请重试或检查系统权限';
                if (!opened && mission === 'profile') app.manager.ui.showToast(this.messages[mission]);
            }).then(() => this.finish(), () => { this.messages[mission] = '操作失败，请稍后重试'; this.finish(); });
        }
    }
    /** 结束请求，不向已隐藏弹窗写入节点。 */
    private finish(): void {
        this.busy = false;
        if (this.isValid && this.enabledInHierarchy) this.refresh();
    }
}
