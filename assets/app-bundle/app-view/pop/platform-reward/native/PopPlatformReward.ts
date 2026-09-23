import { platformKind } from '../../../../../app-builtin/app-model/expansion/platform/PlatformRuntime';
import { DouyinRevisitView } from './expansion/DouyinRevisitView';
import { _decorator } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { TikTokRevisitView } from './expansion/TikTokRevisitView';
import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
const { ccclass, property } = _decorator;
/** 两种平台任务共用一个按需加载、关闭缓存的弹窗。 */
@ccclass('PopPlatformReward')
export class PopPlatformReward extends BaseView {
    /** 编辑器绑定的任务内容及平台校验逻辑。 */
    @property(TikTokRevisitView) panel: TikTokRevisitView = null!;
    /** 编辑器绑定的抖音独立任务面板。 */
    @property(DouyinRevisitView) douyinPanel: DouyinRevisitView = null!;
    /** 只启用当前平台实现，共用已制作的面板节点。 */
    onLoad(): void {
        const douyin = platformKind() === 'douyin';
        this.panel.node.active = !douyin;
        this.panel.enabled = !douyin;
        if (this.douyinPanel) { this.douyinPanel.enabled = douyin; this.douyinPanel.node.active = douyin; }
    }
    /** 当前平台界面由注册层选择。 */
    private get activePanel(): TikTokRevisitView | DouyinRevisitView {
        return platformKind() === 'douyin' ? this.douyinPanel : this.panel;
    }
    /** 编辑器按钮统一分发，保持用户点击同步调用链。 */
    begin(event: unknown, mission: 'shortcut' | 'profile'): void { this.activePanel.begin(event, mission); }
    /** 编辑器关闭按钮统一分发。 */
    close(): void { this.activePanel.close(); }
    /** 按入口显示任务，保留两种任务各自的领取记录。 */
    onShow(mission: 'shortcut' | 'profile'): void {
        UiClickSound.bind(this.node);
        this.activePanel.node.targetOff(this);
        this.activePanel.node.on('reward-close', this.closePop, this);
        this.activePanel.request(null, mission);
    }
    /** 交给框架清理弹窗栈并隐藏缓存实例。 */
    private closePop(): void { this.hide(); }
    /** 隐藏时解除本次关闭监听。 */
    onHide(): void { this.activePanel.node.targetOff(this); }
}
