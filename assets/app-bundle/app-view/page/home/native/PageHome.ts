import { ScreenLayout } from '../../../../../app-builtin/app-controller/expansion/ScreenLayout';
import { _decorator } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass } = _decorator;

/** 首页由预制体定义外观，脚本只处理入口操作。 */
@ccclass('PageHome')
export class PageHome extends BaseView {
    /** ????????????????????? */
    private readonly screenLayout = new ScreenLayout();

    /** ????????????????????????????? */
    lateUpdate(): void {
        this.screenLayout.apply(this.node);
    }

    /** 打开独立关卡编辑器，不改变玩家通关进度。 */
    openEditor(): void {
        app.manager.ui.show({ name: 'PageEditor' });
    }

    /** 从已保存关卡继续，由预制体按钮事件调用。 */
    startGame(): void {
        app.manager.ui.show({ name: 'PageGame' });
    }
}
