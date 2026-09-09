import { GameLanguage } from '../../../../../app-builtin/app-model/expansion/GameLanguage';
import { ScreenLayout } from '../../../../../app-builtin/app-controller/expansion/ScreenLayout';
import { _decorator, Prefab, JsonAsset, Node, Label } from 'cc';
import { DEV } from 'cc/env';
import { ThemePanel } from './expansion/ThemePanel';
import { GameTheme } from '../../../../../app-builtin/app-model/expansion/GameTheme';
import { GameSettings } from '../../../../../app-builtin/app-model/expansion/GameSettings';
import { PreferencesSnapshot } from '../../../../../app-builtin/app-model/expansion/GamePreferences';
import { SettingsPanel } from '../../game/native/expansion/settings/SettingsPanel';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass, property } = _decorator;

/** 首页由预制体定义外观，脚本只处理入口操作。 */
@ccclass('PageHome')
export class PageHome extends BaseView {
    /** 开始按钮译文，预制体预留宽度并允许缩小字体。 */
    @property(Label) playLabel: Label = null!;
    /** 主题入口译文。 */
    @property(Label) themesLabel: Label = null!;
    /** 开发环境编辑器入口；发布构建隐藏。 */
    @property(Label) editorLabel: Label = null!;
    /** 首页当前待挑战关卡。 */
    @property(Label) levelLabel: Label = null!;
    /** 首页内嵌图鉴与设置面板，打开时无需加载。 */
    @property(ThemePanel) themePanel: ThemePanel = null!;
    /** 原版三项开关面板。 */
    @property(SettingsPanel) settingsPanel: SettingsPanel = null!;

    /** 首页适配器，只改变显示尺寸。 */
    private readonly screenLayout = new ScreenLayout();
    /** 保持稳定引用，隐藏首页时解除语言监听。 */
    private readonly languageChanged = (): void => this.refreshLanguage();

    /** 跟随屏幕尺寸调整首页布局。 */
    lateUpdate(): void {
        this.screenLayout.apply(this.node, -812.5, 812.5);
    }

    /** 首页出现后提前加载游戏及入场必需资源，不显示页面、不启动关卡。 */
    onShow(): void {
        // XForge 隐藏模式 2：缓存页面，防止卸载分包破坏共享图片；退出仍执行 onHide 清理。
        this.hideEvent = 2;
        GameTheme.refresh();
        this.refreshLanguage();
        GameLanguage.subscribe(this.languageChanged);
        this.themePanel.close();
        this.settingsPanel.node.active = false;
        this.settingsPanel.node.on('setting-request', this.changeSetting, this);
        this.settingsPanel.node.on('settings-action', this.closeSettings, this);
        app.manager.ui.load('PageGame');
        const prefabs = ['StarFlightView', 'GroundImpactView', 'NewbieGuideView', 'SettingsPanel'];
        if (DEV) prefabs.push('DevelopmentRewardPanel');
        for (const name of prefabs) {
            app.manager.loader.load({ bundle: 'page-game-res', path: 'prefabs/' + name, type: Prefab });
        }
        app.manager.loader.load({ bundle: 'page-game-res', path: 'levels/original-levels', type: JsonAsset });
    }

    /** 刷新首页译文；切换语言后可直接调用，不重新加载资源。 */
    refreshLanguage(): void {
        const level = app.controller.game.progress.level;
        if (this.playLabel) this.playLabel.string = GameLanguage.text('play');
        if (this.themesLabel) this.themesLabel.string = GameLanguage.text('themes');
        this.levelLabel.string = GameLanguage.text('level', { level });
        if (this.editorLabel) {
            this.editorLabel.string = GameLanguage.text('editor');
            this.editorLabel.node.active = DEV;
        }
    }

    /** 退出首页时解除设置监听并关闭内嵌面板。 */
    onHide(): void {
        GameLanguage.unsubscribe(this.languageChanged);
        this.settingsPanel.node.targetOff(this);
        this.themePanel.close();
        this.settingsPanel.node.active = false;
    }
    /** 打开原版主题图鉴，使用正式进度。 */
    openTheme(): void { this.themePanel.open(app.controller.game.progress.level); }
    /** 打开首页设置。 */
    openSettings(): void { this.settingsPanel.open(GameSettings.current.snapshot); }
    /** @param key 当前点击的开关。 */
    private changeSetting(key: keyof PreferencesSnapshot): void {
        const warning = app.controller.settings.toggle(key);
        this.settingsPanel.render(GameSettings.current.snapshot, warning);
    }
    /** 首页设置的返回操作只关闭面板。 */
    private closeSettings(): void { this.settingsPanel.node.active = false; }

    /** 打开独立关卡编辑器，不改变玩家通关进度。 */
    openEditor(): void {
        app.manager.ui.show({ name: 'PageEditor' });
    }

    /** 从已保存关卡继续，由预制体按钮事件调用。 */
    startGame(): void {
        app.manager.ui.show({ name: 'PageGame' });
    }
}
