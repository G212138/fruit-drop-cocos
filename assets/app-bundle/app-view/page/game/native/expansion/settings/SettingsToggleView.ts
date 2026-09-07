import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

/** 独立设置行的开关显示；图标、文字、开关和按钮事件由预制体制作。 */
@ccclass('SettingsToggleView')
export class SettingsToggleView extends Component {
    /** 原版开关图片组件，预制体固定尺寸为 201×75 设计像素。 */
    @property(Sprite)
    switchPicture: Sprite = null!;
    /** 原版 OpenBtn 图片。 */
    @property(SpriteFrame)
    onFrame: SpriteFrame = null!;
    /** 原版 GreyBtn 图片。 */
    @property(SpriteFrame)
    offFrame: SpriteFrame = null!;

    /** @param enabled 权威设置值；仅刷新显示，不反向改写模型。 */
    render(enabled: boolean): void {
        this.switchPicture.spriteFrame = enabled ? this.onFrame : this.offFrame;
    }

    /** 预制体按钮发布切换意图，由父面板识别该行对应的设置项。 */
    requestToggle(): void {
        this.node.emit('toggle-request');
    }
}
