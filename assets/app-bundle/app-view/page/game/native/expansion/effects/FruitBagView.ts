import { _decorator, Component, Node, UITransform, Vec3, Tween, tween, AudioSource, UIOpacity, isValid } from 'cc';
import { GameSettings } from '../../../../../../../app-builtin/app-model/expansion/GameSettings';
const { ccclass, property } = _decorator;

/** 独立袋子预制体，接收已经退出物理的既有水果并播放原版入袋与回弹。 */
@ccclass('FruitBagView')
export class FruitBagView extends Component {
    /** 预制体内的袋身，压缩时保持下边缘不动。 */
    @property(Node)
    body: Node = null!;
    /** 预制体内的收集点，水果保持世界位置后挂入此节点。 */
    @property(Node)
    target: Node = null!;
    /** 原 Drop.mp3 音源，在一次袋身压缩开始时播放。 */
    @property(AudioSource)
    audio: AudioSource = null!;
    /** 回弹期间不叠加第二套袋身补间。 */
    private bouncing = false;
    /** 清局使待完成的收集回调失效。 */
    private generation = 0;
    /** 本次压缩前位置，清局恢复使用。 */
    private originalPosition: Vec3 | null = null;
    /** 本次压缩前尺寸，清局恢复使用。 */
    private originalScale: Vec3 | null = null;

    /** @param fruits 已匹配并停用刚体的水果。 @param completed 全部入袋后通知业务的回调。 */
    collect(fruits: readonly Node[], completed: () => void): void {
        const generation = this.generation;
        let pending = fruits.length;
        if (!pending) { completed(); return; }
        for (const fruit of fruits) {
            const opacity = fruit.getComponent(UIOpacity);
            const initialOpacity = opacity?.opacity ?? 255;
            const position = this.target.getComponent(UITransform)!.convertToNodeSpaceAR(fruit.worldPosition);
            // 保持世界变换，兼容黑洞容器及屏幕适配带来的父节点缩放差异。
            fruit.setParent(this.target, true);
            fruit.setPosition(position);
            tween(fruit)
                .to(0.25, { position: new Vec3() }, { easing: 'sineInOut' })
                .call(() => {
                    if (generation === this.generation) this.bounce();
                })
                .to(0.1, { scale: new Vec3() }, {
                    easing: 'sineIn',
                    // 与缩小共用同一补间，清局停止水果补间时也会停止渐隐。
                    onUpdate: (_target, ratio) => { if (opacity) opacity.opacity = initialOpacity * (1 - ratio); },
                })
                .call(() => {
                    if (generation !== this.generation) return;
                    fruit.destroy();
                    if (--pending === 0) completed();
                }).start();
        }
    }

    /** 原版0.14秒压至75%，0.26秒 backOut 恢复；尺寸及锚点决定下边缘补偿。 */
    private bounce(): void {
        if (this.bouncing) return;
        this.bouncing = true;
        if (GameSettings.current.snapshot.sound) this.audio.play();
        const transform = this.body.getComponent(UITransform)!;
        const position = this.body.position.clone();
        const scale = this.body.scale.clone();
        this.originalPosition = position;
        this.originalScale = scale;
        tween(this.body)
            .to(0.14, {
                scale: new Vec3(scale.x, scale.y * 0.75, scale.z),
                position: new Vec3(position.x, position.y - transform.height * transform.anchorY * scale.y * 0.25, position.z),
            }, { easing: 'sineOut' })
            .to(0.26, { scale, position }, { easing: 'backOut' })
            .call(() => { this.bouncing = false; }).start();
    }

    /** 清局停止飞行、丢弃待通知结果并恢复袋身，防止旧局影响新局。 */
    clear(): void {
        this.generation++;
        const children = isValid(this.target, true) ? [...this.target.children] : [];
        for (const fruit of children) {
            Tween.stopAllByTarget(fruit);
            fruit.destroy();
        }
        if (isValid(this.body, true)) {
            Tween.stopAllByTarget(this.body);
            if (this.originalPosition) this.body.setPosition(this.originalPosition);
            if (this.originalScale) this.body.setScale(this.originalScale);
        }
        this.bouncing = false;
        if (isValid(this.audio, true)) this.audio.stop();
    }

    /** 实例销毁时取消所有袋内水果补间。 */
    onDestroy(): void {
        this.clear();
    }
}
