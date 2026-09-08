import { _decorator, Component, Node, Sprite, SpriteFrame, Label, Color, Tween, tween, Vec3 } from 'cc';
import { GameTheme } from '../../../../../../app-builtin/app-model/expansion/GameTheme';
const { ccclass, property } = _decorator;

/** 图鉴只更新编辑器中既有的30个格子，不在运行时创建UI。 */
@ccclass('ThemePanel')
export class ThemePanel extends Component {
    /** 弹出缩放的原版内容根节点。 */
    @property(Node) content: Node = null!;
    /** 原版格子中的图片，按编号排列。 */
    @property([Sprite]) icons: Sprite[] = [];
    /** 水果及甜品图鉴图片，各30张，顺序连续。 */
    @property([SpriteFrame]) frames: SpriteFrame[] = [];
    /** 当前主题名称。 */
    @property(Label) title: Label = null!;
    /** 使用状态、未解锁提示及存储异常。 */
    @property(Label) status: Label = null!;
    /** 水果未选中、选中、甜品未选中、选中的原版按钮外观。 */
    @property([Node]) tabs: Node[] = [];
    /** 打开面板时传入的正式待挑战关卡。 */
    private level = 1;
    /** 当前浏览主题，允许浏览尚未解锁的甜品。 */
    private browsing: 1 | 2 = 1;

    /** @param level 正式关卡进度。 */
    open(level: number): void {
        this.level = level;
        this.browsing = GameTheme.current.resolve(level);
        this.node.active = true;
        Tween.stopAllByTarget(this.content);
        this.content.setScale(0, 0, 1);
        tween(this.content).to(0.3, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'backOut' }).start();
        this.render();
    }
    /** 浏览并使用已解锁的水果主题。 */
    chooseFruit(): void { this.choose(1); }
    /** 浏览甜品图鉴；通关30关后同步启用甜品主题。 */
    chooseDessert(): void { this.choose(2); }
    /** @param theme 用户点击的主题编号。 */
    private choose(theme: 1 | 2): void {
        this.browsing = theme;
        GameTheme.current.select(theme, this.level);
        GameTheme.active = GameTheme.current.resolve(this.level);
        this.render();
    }
    /** 按正式进度显示图鉴的亮色及未解锁剪影。 */
    private render(): void {
        this.title.string = this.browsing === 1 ? '水果' : '甜品';
        this.status.string = GameTheme.current.warning || (GameTheme.current.resolve(this.level) === this.browsing
            ? '已使用' : '通关30关后可使用');
        this.tabs.forEach((node, index) => { node.active = index === (this.browsing === 1 ? 1 : 0) || index === (this.browsing === 2 ? 3 : 2); });
        this.icons.forEach((icon, index) => {
            icon.spriteFrame = this.frames[(this.browsing - 1) * 30 + index];
            icon.color = GameTheme.current.unlocked(this.browsing, index, this.level)
                ? new Color(255, 255, 255, 255) : new Color(0, 0, 0, 90);
        });
    }
    /** 关闭面板并停止弹出动画。 */
    close(): void {
        Tween.stopAllByTarget(this.content);
        this.node.active = false;
    }
    /** 销毁时取消绑定在内容节点上的补间。 */
    onDestroy(): void { Tween.stopAllByTarget(this.content); }
}
