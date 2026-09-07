import { _decorator } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass } = _decorator;

/** 首页由预制体定义外观，脚本只处理入口操作。 */
@ccclass('PageHome')
export class PageHome extends BaseView {
    /** 开始验证关，由预制体按钮事件调用。 */
    startGame(): void {
        app.manager.ui.show({ name: 'PageGame' });
    }
}
