import { _decorator, Component, Sprite, SpriteFrame, UITransform } from 'cc';
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
    /** 草地锁墙按宽90、高80设计像素显示，甜品锁墙保留原163×95尺寸。 */
    @property lockPlug = false;
    /** 实例激活或重新进入页面时应用当前有效主题。 */
    onEnable(): void {
        GameTheme.refresh();
        this.target.spriteFrame = GameTheme.active === 1 ? this.fruitFrame : this.dessertFrame;
        if (this.lockPlug) {
            this.target.sizeMode = Sprite.SizeMode.CUSTOM;
            this.target.node.getComponent(UITransform)!.setContentSize(GameTheme.active === 1 ? 90 : 163, GameTheme.active === 1 ? 80 : 95);
        }
        if (this.mouth || this.target.node.name === 'BagBottom') {
            // 草地布袋由同一334×364图片拆层，统一画布保证前后层接缝连续。
            const grass = GameTheme.active === 1;
            this.target.sizeMode = Sprite.SizeMode.CUSTOM;
            this.target.trim = false;
            this.target.node.getComponent(UITransform)!.setContentSize(grass ? 167 : (this.mouth ? 156 : 167), grass ? 182 : (this.mouth ? 46 : 152));
            this.target.node.setPosition(0, grass ? 15 : (this.mouth ? 59 : 0), 0);
        }
    }
}
