import { HomeAmbientMotion } from './expansion/HomeAmbientMotion';
import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
import { GameLanguage } from '../../../../../app-builtin/app-model/expansion/GameLanguage';
import { TikTokStartup } from '../../../../../app-builtin/app-controller/expansion/TikTokStartup';
import { _decorator, JsonAsset, Node, Label, EditBox, Sprite, Vec4 } from 'cc';
import { PREVIEW } from 'cc/env';
import { GameTheme } from '../../../../../app-builtin/app-model/expansion/GameTheme';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass, property } = _decorator;

/** 首页由预制体定义外观，脚本只处理入口操作。 */
@ccclass('PageHome')
export class PageHome extends BaseView {
    /** 开始按钮表面扫光，位于文字与图标下方。 */
    @property(Node) playSweep: Node = null!;
    /** 首页可见期间的扫光时钟，秒；隐藏时停止。 */
    private sweepTime = -1;
    /** 每3.8秒扫过一次，保留按钮自身点击动画。@param dt 帧间隔秒数。 */
    update(dt: number): void {
        if (this.sweepTime < 0 || !this.playSweep) return;
        this.sweepTime += Math.max(0, dt);
        const phase = (this.sweepTime - 0.8) % 3.8;
        this.playSweep.active = phase >= 0 && phase < 1.2;
        if (!this.playSweep.active) return;
        const sprite = this.playSweep.getComponent(Sprite), uv = sprite?.spriteFrame?.uv;
        const mat = sprite?.getMaterialInstance(0);
        if (uv && mat) {
            mat.setProperty('sweepX', new Vec4(uv[0], uv[1], uv[2] - uv[0], uv[3] - uv[1]));
            mat.setProperty('sweepY', new Vec4(uv[4] - uv[0], uv[5] - uv[1], -0.25 + 1.7 * phase / 1.2, 0.22));
        }
    }
    /** 开始按钮译文，预制体预留宽度并允许缩小字体。 */
    @property(Label) playLabel: Label = null!;
    /** 主题入口译文。 */
    @property(Label) themesLabel: Label = null!;
    /** 关卡编辑器入口；显示状态由预制体手动设置，代码只刷新译文。 */
    @property(Label) editorLabel: Label = null!;
    /** 首页当前待挑战关卡。 */
    @property(Label) levelLabel: Label = null!;

    /** 网页预览关卡输入框，由首页预制体绑定。 */
    @property(EditBox) levelInput: EditBox = null!;
    /** 预览跳关入口；正式发布隐藏。 */
    @property(Node) levelJumpRoot: Node = null!;

    /** 保持稳定引用，隐藏首页时解除语言监听。 */
    private readonly languageChanged = (): void => this.refreshLanguage();


    /** 首页出现时刷新入口状态；游戏资源已在启动阶段完成加载。 */
    onShow(): void {
        this.sweepTime = 0;
        if (this.playSweep) this.playSweep.active = false;
        UiClickSound.bind(this.node);
        if (this.levelJumpRoot) this.levelJumpRoot.active = PREVIEW;
        app.controller.settings.begin();
        TikTokStartup.enter();
        // XForge 隐藏模式 2：缓存页面，防止卸载分包破坏共享图片；退出仍执行 onHide 清理。
        this.hideEvent = 2;
        GameTheme.refresh();
        this.node.getComponentsInChildren(HomeAmbientMotion).forEach(motion => motion.play());
        this.refreshLanguage();
        GameLanguage.subscribe(this.languageChanged);

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
        this.node.getComponentsInChildren(HomeAmbientMotion).forEach(motion => motion.stop());
        this.sweepTime = -1;
        if (this.playSweep) this.playSweep.active = false;
        // 页面缓存期间保留按钮监听，保证开始游戏等切页点击仍能在业务回调后播放；下次显示先解绑，避免重复。
        app.controller.settings.end();
        GameLanguage.unsubscribe(this.languageChanged);
    }
    /** 打开独立地块主题面板。 */
    openTheme(): void { app.manager.ui.show({ name: 'PopTheme' }); }
    /** 图鉴只选择掉落物，保留已有解锁进度。 */
    openCollection(): void { app.manager.ui.show({ name: 'PopCollection' }); }
    /** 尚未接入的首页功能显示真实状态，不打开空页面。 */
    showComingSoon(): void {
        app.manager.ui.showToast(GameLanguage.text('comingSoon'));
    }
    /** 打开首页设置。 */
    openSettings(): void { app.manager.ui.show({ name: 'PopSettings', data: { mode: 'home' } }); }
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

