import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { GameTheme } from '../../../../../../../app-builtin/app-model/expansion/GameTheme';
const { ccclass, property } = _decorator;

/** 锁墙或袋子预制体内部的主题图片，不向页面暴露子组件引用。 */
@ccclass('ThemeSprite')
export class ThemeSprite extends Component {
    /** 同一预制体内已有的图片。 */
    @property(Sprite) target: Sprite = null!;
    /** 原水果主题图片。 */
    @property(SpriteFrame) fruitFrame: SpriteFrame = null!;
    /** 原甜品主题图片。 */
    @property(SpriteFrame) dessertFrame: SpriteFrame = null!;
    /** 是否为袋口；为真时同步原版82.5/59设计像素的高度。 */
    @property mouth = false;
    /** 实例激活或重新进入页面时应用当前有效主题。 */
    onEnable(): void {
        GameTheme.refresh();
        this.target.spriteFrame = GameTheme.active === 1 ? this.fruitFrame : this.dessertFrame;
        if (this.mouth) this.target.node.setPosition(0, GameTheme.active === 1 ? 82.5 : 59, 0);
    }
}
