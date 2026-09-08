import { ScreenLayout } from '../../../../../app-builtin/app-controller/expansion/ScreenLayout';
import { _decorator, Prefab, JsonAsset } from 'cc';
import { DEV } from 'cc/env';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass } = _decorator;

/** 首页由预制体定义外观，脚本只处理入口操作。 */
@ccclass('PageHome')
export class PageHome extends BaseView {
    /** 首页适配器，只改变显示尺寸。 */
    private readonly screenLayout = new ScreenLayout();

    /** 跟随屏幕尺寸调整首页布局。 */
    lateUpdate(): void {
        this.screenLayout.apply(this.node);
    }

    /** 首页出现后提前加载游戏及入场必需资源，不显示页面、不启动关卡。 */
    onShow(): void {
        app.manager.ui.load('PageGame');
        const prefabs = ['StarFlightView', 'GroundImpactView', 'NewbieGuideView', 'SettingsPanel'];
        if (DEV) prefabs.push('DevelopmentRewardPanel');
        for (const name of prefabs) {
            app.manager.loader.load({ bundle: 'page-game-res', path: 'prefabs/' + name, type: Prefab });
        }
        app.manager.loader.load({ bundle: 'page-game-res', path: 'levels/original-levels', type: JsonAsset });
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
