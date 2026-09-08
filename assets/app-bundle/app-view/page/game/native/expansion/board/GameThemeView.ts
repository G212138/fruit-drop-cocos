import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { GameTheme } from '../../../../../../../app-builtin/app-model/expansion/GameTheme';
const { ccclass, property } = _decorator;

/** 页面内背景和地形主题；嵌套预制体自行绑定主题，避免跨预制体组件引用失效。 */
@ccclass('GameThemeView')
export class GameThemeView extends Component {
    /** 按背景、地形顺序绑定页面内图片。 */
    @property([Sprite]) targets: Sprite[] = [];
    /** 前五张为水果，后五张为甜品，沿用原版主题资源。 */
    @property([SpriteFrame]) frames: SpriteFrame[] = [];
    /** 页面入场及复用时刷新主题。 */
    onEnable(): void {
        GameTheme.refresh();
        this.targets.forEach((sprite, index) => { sprite.spriteFrame = this.frames[(GameTheme.active - 1) * 5 + index]; });
    }
}
