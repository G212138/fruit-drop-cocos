import { _decorator } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { ThemePanel } from './expansion/ThemePanel';
import { app } from '../../../../../app/app';
import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
const { ccclass, property } = _decorator;
/** 图鉴独立弹窗，首次打开才加载物品图标。 */
@ccclass('PopCollection')
export class PopCollection extends BaseView {
    /** 编辑器绑定的图鉴内容。 */
    @property(ThemePanel) panel: ThemePanel = null!;
    /** 显示当前进度对应的图鉴状态。 */
    onShow(): void {
        UiClickSound.bind(this.node);
        this.node.targetOff(this);
        this.node.on('panel-close', this.closePop, this);
        this.panel.open(app.controller.game.progress.level);
    }
    /** 通过框架关闭，避免仅隐藏节点而残留弹窗栈。 */
    private closePop(): void { this.hide(); }
    /** 清除本次事件监听。 */
    onHide(): void { this.node.targetOff(this); }
}
