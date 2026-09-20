import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
import { GameLanguage } from '../../../../../app-builtin/app-model/expansion/GameLanguage';
import { TikTokStartup } from '../../../../../app-builtin/app-controller/expansion/TikTokStartup';
import { _decorator, Prefab, JsonAsset, Node, Label, EditBox, instantiate, isValid } from 'cc';
import { DEV, PREVIEW } from 'cc/env';
import { TerrainPanel } from './expansion/TerrainPanel';
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
    /** 关卡编辑器入口；显示状态由预制体手动设置，代码只刷新译文。 */
    @property(Label) editorLabel: Label = null!;
    /** 首页当前待挑战关卡。 */
    @property(Label) levelLabel: Label = null!;
    /** 按需实例化的图鉴面板，不在首页预制体中绑定。 */
    private themePanel: ThemePanel = null!;
    /** 独立地块主题选择面板。 */
    private terrainPanel: TerrainPanel = null!;
    /** 原版三项开关面板。 */
    private settingsPanel: SettingsPanel = null!;
    /** 尚未开放入口的轻量提示，由首页预制体决定位置。 */
    @property(Label) featureNotice: Label = null!;

    /** 网页预览关卡输入框，由首页预制体绑定。 */
    @property(EditBox) levelInput: EditBox = null!;
    /** 预览跳关入口；正式发布隐藏。 */
    @property(Node) levelJumpRoot: Node = null!;

    /** 首页可见状态，阻止离开后异步弹出面板。 */
    private homeVisible = false;
    /** 最近一次打开意图，连续点击时仅展示最后选择。 */
    private panelRequest = 0;
    /** 合并同一面板的并发请求；实例由缓存首页持有。 */
    private readonly panelLoads = new Map<string, Promise<Node>>();

    /** @param name 对应首页资源包内的独立面板预制体名称。 */
    private loadPanel(name: string): Promise<Node> {
        const pending = this.panelLoads.get(name);
        if (pending) return pending;
        const task = new Promise<Node>((resolve, reject) => {
            this.loadRes('prefabs/' + name, Prefab, prefab => {
                if (!prefab || !isValid(this.node)) {
                    reject(new Error('面板加载失败：' + name));
                    return;
                }
                const node = instantiate(prefab);
                node.active = false;
                node.parent = this.node;
                UiClickSound.bind(node);
                resolve(node);
            });
        });
        this.panelLoads.set(name, task);
        void task.catch(() => this.panelLoads.delete(name));
        return task;
    }

    /** @param name 点击入口后才加载；失败可重试，退出或切换入口后丢弃旧打开意图。 */
    private async openPanel(name: string): Promise<void> {
        const request = ++this.panelRequest;
        this.themePanel?.close();
        this.terrainPanel?.close();
        if (this.settingsPanel) this.settingsPanel.node.active = false;
        try {
            const node = await this.loadPanel(name);
            if (!this.homeVisible || request !== this.panelRequest || !isValid(this.node)) return;
            node.setSiblingIndex(this.node.children.length - 1);
            if (name === 'ThemePanel') {
                this.themePanel = node.getComponent(ThemePanel)!;
                this.themePanel.open(app.controller.game.progress.level);
            } else if (name === 'TerrainPanel') {
                this.terrainPanel = node.getComponent(TerrainPanel)!;
                this.terrainPanel.open();
            } else {
                this.settingsPanel = node.getComponent(SettingsPanel)!;
                node.targetOff(this);
                node.on('setting-request', this.changeSetting, this);
                node.on('settings-action', this.closeSettings, this);
                this.settingsPanel.open(GameSettings.current.snapshot);
            }
        } catch (error) {
            console.warn('[PageHome] 独立面板加载失败', error);
            if (this.homeVisible && request === this.panelRequest) app.manager.ui.showToast('加载失败，请重试');
        }
    }

    /** 保持稳定引用，隐藏首页时解除语言监听。 */
    private readonly languageChanged = (): void => this.refreshLanguage();


    /** 首页出现后提前加载游戏及入场必需资源，不显示页面、不启动关卡。 */
    onShow(): void {
        this.homeVisible = true;
        UiClickSound.bind(this.node);
        if (this.levelJumpRoot) this.levelJumpRoot.active = PREVIEW;
        app.controller.settings.begin();
        TikTokStartup.enter();
        // XForge 隐藏模式 2：缓存页面，防止卸载分包破坏共享图片；退出仍执行 onHide 清理。
        this.hideEvent = 2;
        GameTheme.refresh();
        this.refreshLanguage();
        GameLanguage.subscribe(this.languageChanged);
        this.themePanel?.close();
        this.terrainPanel?.close();
        if (this.settingsPanel) this.settingsPanel.node.active = false;
        if (this.featureNotice) this.featureNotice.node.active = false;
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
        }
    }

    /** 退出首页时解除设置监听并关闭内嵌面板。 */
    onHide(): void {
        this.homeVisible = false;
        ++this.panelRequest;
        // 页面缓存期间保留按钮监听，保证开始游戏等切页点击仍能在业务回调后播放；下次显示先解绑，避免重复。
        app.controller.settings.end();
        GameLanguage.unsubscribe(this.languageChanged);
        this.settingsPanel?.node.targetOff(this);
        this.themePanel?.close();
        this.terrainPanel?.close();
        if (this.settingsPanel) this.settingsPanel.node.active = false;
    }
    /** 打开独立地块主题面板。 */
    openTheme(): void { void this.openPanel('TerrainPanel'); }
    /** 图鉴只选择掉落物，保留已有解锁进度。 */
    openCollection(): void { void this.openPanel('ThemePanel'); }
    /** 尚未接入的首页功能显示真实状态，不打开空页面。 */
    showComingSoon(): void {
        app.manager.ui.showToast(GameLanguage.text('comingSoon'));
    }
    /** 打开首页设置。 */
    openSettings(): void { void this.openPanel('SettingsPanel'); }
    /** @param key 当前点击的开关。 */
    private changeSetting(key: keyof PreferencesSnapshot): void {
        const warning = app.controller.settings.toggle(key);
        this.settingsPanel.render(GameSettings.current.snapshot, warning);
    }
    /** 首页设置的返回操作只关闭面板。 */
    private closeSettings(): void { if (this.settingsPanel) this.settingsPanel.node.active = false; }

    /** 打开独立关卡编辑器，不改变玩家通关进度。 */
    openEditor(): void {
        app.manager.ui.show({ name: 'PageEditor' });
    }

    /** 校验输入并跳转到已有关卡；仅供网页预览使用，不直接改写通关存档。 */
    jumpToLevel(): void {
        if (!PREVIEW || !this.levelInput) return;
        const text = this.levelInput.string.trim();
        const level = Number(text);
        if (!/^[0-9]+$/.test(text) || !Number.isSafeInteger(level) || level < 1) {
            app.manager.ui.showToast("请输入有效的正整数关卡");
            return;
        }
        app.manager.loader.load({ bundle: "page-game-res", path: "levels/original-levels", type: JsonAsset, onComplete: (asset: JsonAsset) => {
            if (!asset || level > asset.json.levels.length) {
                app.manager.ui.showToast("关卡不存在");
                return;
            }
            app.manager.ui.show({ name: "PageGame", data: { level } });
        } });
    }

    /** 从已保存关卡继续，由预制体按钮事件调用。 */
    startGame(): void {
        app.manager.ui.show({ name: 'PageGame' });
    }
}

