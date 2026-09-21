import { _decorator, Component, Node, Sprite, SpriteFrame, Label, Color, Tween, tween, Vec3, Button } from 'cc';
import { app } from '../../../../../../app/app';
import { ThemeProgress } from '../../../../../../app-builtin/app-model/expansion/ThemeProgress';
import { GameTheme } from '../../../../../../app-builtin/app-model/expansion/GameTheme';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { CollectionPager } from './CollectionPager';
import { collectionName, collectionText } from './CollectionText';
const { ccclass, property } = _decorator;
/** 双页收藏册；滑动仅浏览，完整解锁后明确确认才更换游戏品类。 */
@ccclass('ThemePanel')
export class ThemePanel extends Component {
    /** 编辑器维护的弹窗内容。 */
    @property(Node) content: Node = null!;
    /** 两组各30个图标，顺序与原素材一致。 */
    @property([Sprite]) icons: Sprite[] = [];
    /** 共60张现有高清物品图。 */
    @property([SpriteFrame]) frames: SpriteFrame[] = [];
    /** 每张卡片的本地化名称。 */
    @property([Label]) names: Label[] = [];
    /** 未解锁时展示的立体小锁。 */
    @property([Node]) locks: Node[] = [];
    /** 全部卡片背景，随解锁状态切换。 */
    @property([Sprite]) cards: Sprite[] = [];
    /** 普通、锁定两张卡片图片。 */
    @property([SpriteFrame]) cardFrames: SpriteFrame[] = [];
    /** 当前分类名。 */
    @property(Label) title: Label = null!;
    /** 图鉴标题。 */
    @property(Label) heading: Label = null!;
    /** 当前分类代表物品。 */
    @property(Sprite) categoryIcon: Sprite = null!;
    /** 两个分页圆点。 */
    @property([Sprite]) dots: Sprite[] = [];
    /** 选中蓝点与未选中米色点。 */
    @property([SpriteFrame]) dotFrames: SpriteFrame[] = [];
    /** 横向分页控制。 */
    @property(CollectionPager) pager: CollectionPager = null!;
    /** 全部解锁后点击使用这组。 */
    @property(Button) confirmButton: Button = null!;
    /** 使用按钮的本地化状态。 */
    @property(Label) confirmLabel: Label = null!;
    /** 已收集数量。 */
    @property(Label) countLabel: Label = null!;
    /** 当前组的黄金进度条，使用水平填充。 */
    @property(Sprite) progress: Sprite = null!;
    /** 当前正式待挑战关卡。 */
    private level = 1;
    /** 当前只浏览的分类。 */
    private browsing: 1 | 2 = 1;
    /** 稳定语言回调。 */
    private readonly languageChanged = (): void => this.render();
    /** 订阅语言与分页变化。 */
    onEnable(): void {
        GameLanguage.subscribe(this.languageChanged);
        this.pager.node.on('collection-page', this.pageChanged, this);
    }
    /** 关闭时释放订阅，停止弹窗动画。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.languageChanged);
        this.pager.node.off('collection-page', this.pageChanged, this);
        Tween.stopAllByTarget(this.content);
    }
    /** @param level 正式待挑战关卡，试玩不增加解锁数量。 */
    open(level: number): void {
        this.level = level;
        this.browsing = GameTheme.current.resolve(level);
        this.node.active = true;
        this.pager.show(this.browsing - 1, false);
        Tween.stopAllByTarget(this.content);
        this.content.setScale(.96, .96, 1);
        tween(this.content).to(.2, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' }).start();
        this.render();
    }
    /** 分页圆点为滑动提供辅助入口，不自动应用选择。 */
    chooseFruit(): void {
        this.pager.show(0);
    }
    /** 浏览甜点，仍需确认使用。 */
    chooseDessert(): void {
        this.pager.show(1);
    }
    /** @param index 滑动完成的零起始页码。 */
    private pageChanged(index: number): void {
        this.browsing = index === 0 ? 1 : 2;
        this.renderHeader();
    }
    /** 完整解锁才能切换；保存失败使用框架提示且回退原选择。 */
    confirmUse(): void {
        const model = GameTheme.current;
        if (this.browsing === model.resolve(this.level) || this.unlockedCount(this.browsing) !== ThemeProgress.itemCount) return;
        const previous = model.selected;
        if (!model.select(this.browsing, this.level) || model.warning) {
            model.selected = previous;
            app.manager.ui.showToast(GameLanguage.text('themeSaveError'));
        } else {
            GameTheme.active = model.resolve(this.level);
        }
        this.renderHeader();
    }
    /** @param theme 统计某一组的实际已解锁数量。 */
    private unlockedCount(theme: 1 | 2): number {
        let count = 0;
        for (let i = 0; i < ThemeProgress.itemCount; i++) {
            if (GameTheme.current.unlocked(theme, i, this.level)) count++;
        }
        return count;
    }
    /** 保持卡片设计尺寸，填充现有两组物品，不在运行时创建节点。 */
    private render(): void {
        this.heading.string = GameLanguage.text('collection');
        this.icons.forEach((icon, index) => {
            const group = index < ThemeProgress.itemCount ? 1 : 2;
            const unlocked = GameTheme.current.unlocked(group, index % ThemeProgress.itemCount, this.level);
            icon.spriteFrame = this.frames[index];
            icon.grayscale = !unlocked;
            icon.color = unlocked ? Color.WHITE : new Color(144, 165, 185, 140);
            this.names[index].string = unlocked ? collectionName(GameLanguage.current, index) : collectionText(GameLanguage.current, 0);
            this.names[index].color = unlocked ? new Color(25, 56, 88) : new Color(96, 116, 134);
            this.locks[index].active = !unlocked;
            this.cards[index].spriteFrame = this.cardFrames[unlocked ? 0 : 1];
        });
        this.renderHeader();
    }
    /** 更新当前组名称、收集数、分页点和使用按钮。 */
    private renderHeader(): void {
        this.title.string = GameLanguage.text(this.browsing === 1 ? 'fruits' : 'sweets');
        this.categoryIcon.spriteFrame = this.frames[this.browsing === 1 ? 1 : 46];
        this.dots.forEach((dot, index) => { dot.spriteFrame = this.dotFrames[index === this.browsing - 1 ? 0 : 1]; });
        const count = this.unlockedCount(this.browsing);
        this.countLabel.string = collectionText(GameLanguage.current, 1, count);
        this.progress.fillRange = count / ThemeProgress.itemCount;
        const inUse = GameTheme.current.resolve(this.level) === this.browsing;
        const locked = count < ThemeProgress.itemCount;
        this.confirmButton.interactable = !inUse && !locked;
        this.confirmButton.getComponent(Sprite)!.grayscale = locked;
        this.confirmLabel.string = inUse ? GameLanguage.text('themeInUse') : collectionText(GameLanguage.current, locked ? 3 : 2);
    }
    /** 浏览不会写存档，关闭后下次按已应用的品类打开。 */
    close(): void {
        Tween.stopAllByTarget(this.content);
        this.node.emit('panel-close');
    }
}
