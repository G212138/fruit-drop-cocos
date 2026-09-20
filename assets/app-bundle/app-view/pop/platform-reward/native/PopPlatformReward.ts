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
    /** 按入口显示任务，保留两种任务各自的领取记录。 */
    onShow(mission: 'shortcut' | 'profile'): void {
        UiClickSound.bind(this.node);
        this.panel.node.targetOff(this);
        this.panel.node.on('reward-close', this.closePop, this);
        this.panel.request(null, mission);
    }
    /** 交给框架清理弹窗栈并隐藏缓存实例。 */
    private closePop(): void { this.hide(); }
    /** 隐藏时解除本次关闭监听。 */
    onHide(): void { this.panel.node.targetOff(this); }
}
