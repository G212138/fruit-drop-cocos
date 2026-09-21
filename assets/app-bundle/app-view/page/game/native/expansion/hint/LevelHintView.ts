import { _decorator, Component, Label, Sprite, SpriteFrame, Tween, Vec3, tween } from 'cc';
import { HintKind } from './HintRules';
import { GameLanguage } from '../../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { LanguageKey } from '../../../../../../../app-builtin/app-model/expansion/LanguageCatalog';
const { ccclass, property } = _decorator;

/** 机制提示表现，预制体负责图片、位置和文字，与水果入场同时播放。 */
@ccclass('LevelHintView')
export class LevelHintView extends Component {
    /** 无文字提示图，尺寸由预制体绑定。 */
    @property(Sprite)
    picture: Sprite = null!;
    /** 按纵向、横向、隐藏、冰层、黑洞顺序绑定的无字图片。 */
    @property([SpriteFrame])
    frames: SpriteFrame[] = [];
    /** 多语言提示文字，使用预制体内的系统字体标签。 */
    @property(Label)
    caption: Label = null!;
    /** 当前显示的机制，供语言切换时更新同一提示。 */
    private currentKind: HintKind = 0;
    /** 译文键与提示图片顺序保持一致。 */
    private readonly hintKeys: LanguageKey[] = ['hintVertical', 'hintHorizontal', 'hintHidden', 'hintIce', 'hintBlackHole'];
    /** 稳定监听引用，禁用后解除订阅。 */
    private readonly languageChanged = (): void => this.refreshCaption();

    /** 开启提示时同步语言并监听设置变化。 */
    onEnable(): void {
        this.refreshCaption();
        GameLanguage.subscribe(this.languageChanged);
    }

    /** 关闭提示时解除语言监听。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.languageChanged);
    }

    /** 根据当前机制刷新文案，长译文由预制体标签换行和缩放。 */
    private refreshCaption(): void {
        if (this.caption) this.caption.string = GameLanguage.text(this.hintKeys[this.currentKind]);
    }
    /** 是否仍在播放提示，棋盘据此阻止输入，但允许水果入场推进。 */
    private showing = false;

    /** 返回提示是否占用开局流程。 */
    get busy(): boolean {
        return this.showing;
    }

    /** @param kind 由纯规则计算的提示图片下标。 */
    play(kind: HintKind): void {
        this.stop();
        this.picture.spriteFrame = this.frames[kind];
        this.currentKind = kind;
        this.refreshCaption();
        this.node.active = true;
        this.node.setScale(0, 0, 1);
        this.showing = true;
        // 提示与水果同时入场，不再先等待提示播放完才移动水果。
        tween(this.node).to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
    }

    /** 水果到位后停留0.5秒，再用0.15秒收起；时序由真实入场完成通知驱动。 */
    finishEntrance(): void {
        this.scheduleOnce(() => {
            if (!this.showing) return;
            Tween.stopAllByTarget(this.node);
            tween(this.node).to(0.15, { scale: new Vec3(0, 0, 1) }, { easing: 'sineIn' })
                .call(() => this.stop()).start();
        }, 0.5);
    }
    /** 中断或完成后取消补间，不遗留上一局的可见状态。 */
    stop(): void {
        this.unscheduleAllCallbacks();
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
