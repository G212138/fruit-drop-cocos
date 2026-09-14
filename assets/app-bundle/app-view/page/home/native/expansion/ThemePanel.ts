import { _decorator, Component, Node, Sprite, SpriteFrame, Label, Color, Tween, tween, Vec3, Button } from 'cc';
import { ThemeProgress } from '../../../../../../app-builtin/app-model/expansion/ThemeProgress';
import { GameTheme } from '../../../../../../app-builtin/app-model/expansion/GameTheme';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
const { ccclass, property } = _decorator;
/** 主题预览和确认使用；只更新编辑器创建的节点。 */
@ccclass('ThemePanel')
export class ThemePanel extends Component {
    /** 弹窗内容，尺寸由预制体维护。 */
    @property(Node) content: Node = null!;
    /** 当前分类的30个物品图标。 */
    @property([Sprite]) icons: Sprite[] = [];
    /** 水果、甜品各30张图片。 */
    @property([SpriteFrame]) frames: SpriteFrame[] = [];
    /** 当前预览分类名称。 */
    @property(Label) title: Label = null!;
    /** 使用、预览或锁定状态。 */
    @property(Label) status: Label = null!;
    /** 每个分类的普通、选中外观。 */
    @property([Node]) tabs: Node[] = [];
    /** 确认后才修改主题。 */
    @property(Button) confirmButton: Button = null!;
    /** 确认按钮状态文字。 */
    @property(Label) confirmLabel: Label = null!;
    /** 解锁数量。 */
    @property(Label) countLabel: Label = null!;
    /** 当前使用主题的标记。 */
    @property([Node]) equippedChecks: Node[] = [];
    /** 当前正式待挑战关卡。 */
    private level = 1;
    /** 只浏览尚未应用的选择。 */
    private browsing: 1 | 2 = 1;
    /** 稳定译文订阅引用。 */
    private readonly languageChanged = (): void => this.render();
    /** 启用时订阅语言变化。 */
    onEnable(): void { GameLanguage.subscribe(this.languageChanged); }
    /** 禁用时解除订阅。 */
    onDisable(): void { GameLanguage.unsubscribe(this.languageChanged); }
    /** @param level 正式待挑战关卡；打开时恢复正在使用的分类。 */
    open(level: number): void {
        this.level = level;
        this.browsing = GameTheme.current.resolve(level);
        this.node.active = true;
        Tween.stopAllByTarget(this.content);
        this.content.setScale(0.94, 0.94, 1);
        tween(this.content).to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
        this.render();
    }
    /** 预览水果，不写入存档。 */
    chooseFruit(): void { this.choose(1); }
    /** 预览甜品，不写入存档。 */
    chooseDessert(): void { this.choose(2); }
    /** @param theme 要预览的分类编号。 */
    private choose(theme: 1 | 2): void {
        this.browsing = theme;
        this.render();
    }
    /** 确认后保存并应用；失败时保留原使用主题。 */
    confirmUse(): void {
        const model = GameTheme.current;
        if (this.browsing === model.resolve(this.level) || (this.browsing === 2 && this.level <= ThemeProgress.itemCount)) return;
        const previous = model.selected;
        const saved = model.select(this.browsing, this.level);
        if (!saved || model.warning) {
            model.selected = previous;
            this.render();
            this.status.string = GameLanguage.text('themeSaveError');
            return;
        }
        GameTheme.active = model.resolve(this.level);
        this.render();
    }
    /** 刷新图标、预览状态和确认门槛。 */
    private render(): void {
        this.title.string = GameLanguage.text(this.browsing === 1 ? 'fruits' : 'sweets');
        const equipped = GameTheme.current.resolve(this.level);
        const inUse = equipped === this.browsing;
        const locked = this.browsing === 2 && this.level <= ThemeProgress.itemCount;
        this.status.string = GameLanguage.text(inUse ? 'themeInUse' : locked ? 'themeLocked' : 'themePreview');
        if (this.confirmButton) this.confirmButton.interactable = !inUse && !locked;
        if (this.confirmLabel) this.confirmLabel.string = GameLanguage.text(inUse ? 'themeInUse' : locked ? 'themeLocked' : 'confirmTheme');
        this.equippedChecks.forEach((node, index) => { node.active = index + 1 === equipped; });
        let count = 0;
        for (let index = 0; index < ThemeProgress.itemCount; index++) if (GameTheme.current.unlocked(this.browsing, index, this.level)) count++;
        if (this.countLabel) this.countLabel.string = GameLanguage.text('themeCount', {count, total: ThemeProgress.itemCount});
        this.tabs.forEach((node, index) => { node.active = index === (this.browsing === 1 ? 1 : 0) || index === (this.browsing === 2 ? 3 : 2); });
        this.icons.forEach((icon, index) => {
            icon.spriteFrame = this.frames[(this.browsing - 1) * ThemeProgress.itemCount + index];
            icon.color = GameTheme.current.unlocked(this.browsing, index, this.level)
                ? new Color(255, 255, 255, 255) : new Color(0, 0, 0, 90);
        });
    }
    /** 关闭只丢弃预览，下次打开重新读取使用项。 */
    close(): void {
        Tween.stopAllByTarget(this.content);
        this.node.active = false;
    }
    /** 销毁时停止内容动画。 */
    onDestroy(): void { Tween.stopAllByTarget(this.content); }
}
