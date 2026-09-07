import { _decorator, Component, Sprite, SpriteFrame, Tween, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

/** 单体视觉组件，只控制预制体已有的图片节点。 */
@ccclass('FruitVisual')
export class FruitVisual extends Component {
    @property(Sprite)
    sprite: Sprite = null!;

    /** 绑定原项目复制的水果图片并恢复缩放。 */
    setFrame(frame: SpriteFrame): void {
        this.sprite.spriteFrame = frame;
        this.node.setScale(Vec3.ONE);
    }

    /** 使用引擎补间播放可实际实现的消除反馈。 */
    playRemoval(onComplete: () => void): void {
        tween(this.node)
            .to(0.12, { scale: new Vec3(1.15, 1.15, 1) })
            .to(0.12, { scale: new Vec3(0, 0, 1) })
            .call(onComplete)
            .start();
    }

    /** 节点销毁时终止尚未完成的表现回调。 */
    onDestroy(): void {
        Tween.stopAllByTarget(this.node);
    }
}
