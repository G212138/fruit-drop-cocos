import { _decorator } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { TerrainPanel } from './expansion/TerrainPanel';
import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
const { ccclass, property } = _decorator;
/** 地块选择弹窗，资源由 XForge 按需加载和释放。 */
@ccclass('PopTheme')
export class PopTheme extends BaseView {
    /** 编辑器绑定的主题内容组件。 */
    @property(TerrainPanel) panel: TerrainPanel = null!;
    /** 显示时读取当前主题，关闭销毁交由框架管理。 */
    onShow(): void {
        UiClickSound.bind(this.node);
        this.node.targetOff(this);
        this.node.on('panel-close', this.closePop, this);
        this.panel.open();
    }
    /** 内容关闭请求使用框架隐藏流程。 */
    private closePop(): void { this.hide(); }
    /** 清除本次监听，组件销毁时取消图片加载意图并释放持有引用。 */
    onHide(): void { this.node.targetOff(this); }
}
