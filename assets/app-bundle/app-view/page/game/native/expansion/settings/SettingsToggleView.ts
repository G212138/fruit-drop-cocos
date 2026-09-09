import { _decorator, Component, Sprite, SpriteFrame, Label, Color } from 'cc';
import { GameLanguage } from '../../../../../../../app-builtin/app-model/expansion/GameLanguage';
const { ccclass, property } = _decorator;

/** 独立设置行的开关显示；图标、文字、开关和按钮事件由预制体制作。 */
@ccclass('SettingsToggleView')
export class SettingsToggleView extends Component {
    /** 开关文字由已有 Label 显示，空引用兼容尚未迁移的制作模板。 */
    @property(Label) stateLabel: Label = null!;
    /** 上次状态供语言切换刷新使用。 */
    private currentState = true;
    /** 稳定的语言监听引用。 */
    private readonly languageChanged = (): void => this.render(this.currentState);
    /** 显示时监听语言变化。 */
    onEnable(): void { GameLanguage.subscribe(this.languageChanged); }
    /** 隐藏时解除监听。 */
    onDisable(): void { GameLanguage.unsubscribe(this.languageChanged); }
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
        this.currentState = enabled;
        this.switchPicture.spriteFrame = enabled ? this.onFrame : this.offFrame;
        if (this.stateLabel) {
            this.stateLabel.string = GameLanguage.text(enabled ? 'on' : 'off');
            this.switchPicture.color = enabled ? Color.WHITE : new Color(145, 145, 145, 255);
        }
    }

    /** 预制体按钮发布切换意图，由父面板识别该行对应的设置项。 */
    requestToggle(): void {
        this.node.emit('toggle-request');
    }
}
