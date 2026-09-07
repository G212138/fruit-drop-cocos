import { _decorator, Component, Sprite, SpriteFrame, Tween, Vec3, tween, Color, isValid } from 'cc';
const { ccclass, property } = _decorator;

/** 单体视觉组件，只控制预制体已有的图片节点。 */
@ccclass('FruitVisual')
export class FruitVisual extends Component {
    /** 预制体内已有的水果图片组件。 */
    @property(Sprite)
    sprite: Sprite = null!;
    /** 危险闪烁前的原色，结束或消除时恢复，不覆盖原素材颜色。 */
    private warningColor: Color | null = null;
    /** 当前是否正在闪烁，防止重复创建颜色补间。 */
    private flashing = false;

    /**
     * 绑定原项目复制的水果图片并恢复缩放。
     * @param frame 从原项目复制并由 Creator 导入的水果图片。
     */
    setFrame(frame: SpriteFrame): void {
        this.clearWarning();
        this.sprite.spriteFrame = frame;
        this.node.setScale(Vec3.ONE);
    }

    /**
     * 使用引擎补间播放消除反馈。迁移适配值：先用 0.12 秒放大到 1.15 倍，再用 0.12 秒缩至零。
     * @param onComplete 消除表现结束后释放水果节点的回调。
     */
    playRemoval(onComplete: () => void): void {
        this.clearWarning();
        tween(this.node)
            .to(0.12, { scale: new Vec3(1.15, 1.15, 1) })
            .to(0.12, { scale: new Vec3(0, 0, 1) })
            .call(onComplete)
            .start();
    }

    /**
     * 原版 popAndDestroy 的复活强制消除：0.25秒 sineOut 放大至原尺寸1.3倍，再0.125秒 sineIn 缩小。
     * @param onComplete 消除结束后销毁既有实例的回调。
     */
    playReviveRemoval(onComplete: () => void): void {
        this.clearWarning();
        // 原版 scale || 1：刚补出的黑洞成员为零缩放时仍能显示这次消除。
        const original = this.node.scale.x || 1;
        tween(this.node)
            .to(0.25, { scale: new Vec3(original * 1.3, original * 1.3, 1) }, { easing: 'sineOut' })
            .to(0.125, { scale: new Vec3(0, 0, 1) }, { easing: 'sineIn' })
            .call(onComplete)
            .start();
    }

    /** 节点销毁时终止尚未完成的表现回调。 */
    onDestroy(): void {
        this.clearWarning();
        Tween.stopAllByTarget(this.node);
    }

    /** 原版用0.5秒变为粉红，再用0.5秒恢复原色，不改变位置、缩放或物理。 */
    flashWarning(): void {
        if (this.flashing) return;
        if (!this.warningColor) this.warningColor = this.sprite.color.clone();
        this.flashing = true;
        tween(this.sprite)
            .to(0.5, { color: new Color(255, 128, 128, 255) }, { easing: 'sineOut' })
            .to(0.5, { color: this.warningColor.clone() }, { easing: 'sineIn' })
            .call(() => { this.flashing = false; })
            .start();
    }

    /** 安全、结算、消除或销毁时停止颜色补间；不取消独立的消除缩放。 */
    clearWarning(): void {
        if (!this.warningColor) return;
        Tween.stopAllByTarget(this.sprite);
        if (isValid(this.sprite)) this.sprite.color = this.warningColor;
        this.warningColor = null;
        this.flashing = false;
    }
}
