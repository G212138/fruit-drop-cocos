import { _decorator, Component, Label, sp, Tween, tween, Vec3, AudioSource, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

/** 独立冰层预制体表现：只接收剩余层数，不负责消除或下落判定。 */
@ccclass('IceFruitView')
export class IceFruitView extends Component {
    /** 原版冰层数字，预制体绑定；字号八十，随整体缩放零点四五倍。 */
    @property(Label)
    countLabel: Label = null!;
    /** 原版 Spine 动画，静态冰层为 1，碎冰为 2。 */
    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null!;
    /** 预制体音源，不在运行时创建组件。 */
    @property(AudioSource)
    audio: AudioSource = null!;
    /** 原版 Ice.mp3 碎冰音效。 */
    @property(AudioClip)
    breakClip: AudioClip = null!;
    /** 是否已播放碎冰，防止多次配对触发重复效果。 */
    private broken = false;
    /** 数字原始缩放，重复更新时始终回到同一尺寸。 */
    private readonly labelScale = new Vec3(1, 1, 1);

    /** @param layers 已校验的初始冰层数，单位层。 */
    initialize(layers: number): void {
        this.broken = false;
        this.countLabel.string = String(layers);
        this.skeleton.setAnimation(0, '1', false);
    }

    /** @param layers 配对完成后的剩余冰层数；零表示立即解除下落限制并播放碎冰。 */
    updateLayers(layers: number): void {
        if (this.broken) return;
        Tween.stopAllByTarget(this.countLabel.node);
        this.countLabel.node.setScale(this.labelScale);
        if (layers === 0) {
            this.broken = true;
            this.countLabel.node.active = false;
            this.skeleton.setAnimation(0, '2', false);
            if (this.breakClip) this.audio.playOneShot(this.breakClip);
            // 沿用原版两秒兜底清理，防止骨骼完成事件丢失。
            this.scheduleOnce(this.hide, 2);
            this.skeleton.setCompleteListener(() => this.hide());
            return;
        }
        // 原版数字先用零点二秒放大至一点四倍，再用零点二秒恢复。
        tween(this.countLabel.node)
            .to(0.2, { scale: new Vec3(1.4, 1.4, 1) })
            .call(() => { this.countLabel.string = String(layers); })
            .to(0.2, { scale: this.labelScale.clone() })
            .start();
    }

    /** 碎冰完成后隐藏表现；不改变水果本身的状态。 */
    private hide(): void {
        this.skeleton.setCompleteListener(null);
        this.unschedule(this.hide);
        this.node.active = false;
    }

    /** 重开、返回主页或单体销毁时取消旧动画与回调。 */
    onDestroy(): void {
        Tween.stopAllByTarget(this.countLabel.node);
        this.skeleton.setCompleteListener(null);
    }
}
