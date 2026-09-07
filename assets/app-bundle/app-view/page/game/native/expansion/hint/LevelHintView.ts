import { _decorator, Component, Node, Sprite, SpriteFrame, Tween, Vec3, tween } from 'cc';
import { HintKind } from './HintRules';
const { ccclass, property } = _decorator;

/** 原版机制提示表现，预制体负责图片、位置和文字，结束后棋盘才入场。 */
@ccclass('LevelHintView')
export class LevelHintView extends Component {
    /** 原版提示主图，尺寸由预制体绑定。 */
    @property(Sprite)
    picture: Sprite = null!;
    /** 按纵向、横向、隐藏、冰层、黑洞顺序绑定的原版图片。 */
    @property([SpriteFrame])
    frames: SpriteFrame[] = [];
    /** 隐藏水果提示专用附加文字；其他提示不显示。 */
    @property(Node)
    hiddenText: Node = null!;
    /** 是否仍在播放提示，棋盘据此阻止输入和入场推进。 */
    private showing = false;

    /** 返回提示是否占用开局流程。 */
    get busy(): boolean {
        return this.showing;
    }

    /** @param kind 由纯规则计算的提示图片下标。 */
    play(kind: HintKind): void {
        this.stop();
        this.picture.spriteFrame = this.frames[kind];
        this.hiddenText.active = kind === 2;
        this.node.active = true;
        this.node.setScale(0, 0, 1);
        this.showing = true;
        // 沿用原版：弹出 0.25 秒，停留 1.5 秒，收起 0.25 秒。
        tween(this.node).to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .delay(1.5).to(0.25, { scale: new Vec3(0, 0, 1) }, { easing: 'sineIn' })
            .call(() => this.stop()).start();
    }

    /** 中断或完成后取消补间，不遗留上一局的可见状态。 */
    stop(): void {
        Tween.stopAllByTarget(this.node);
        this.showing = false;
        this.node.active = false;
    }

    /** 销毁时取消对节点的延迟动画。 */
    onDestroy(): void {
        Tween.stopAllByTarget(this.node);
        this.showing = false;
    }
}
