import { _decorator, Component, Sprite, SpriteFrame, UITransform, assetManager, isValid } from 'cc';
const { ccclass, property } = _decorator;
/** 启动阶段尚未加载业务包，独立识别抖音且排除TikTok的tt别名。 */
declare const TTMinis: { game?: unknown } | undefined;
declare const tt: unknown;

/** 抖音图片文字替换；仅加载指定的中文资源，不改其他平台的原图。 */
@ccclass('DouyinArtwork')
export class DouyinArtwork extends Component {
    /** 中文图片所在资源包，由编辑器绑定。 */
    @property bundleName = '';
    /** 中文SpriteFrame在资源包中的路径，由编辑器绑定。 */
    @property framePath = '';
    /** 记录预制体尺寸，按比例适配新图，不改变动画节点位置。 */
    private size = { width: 0, height: 0 };
    /** 记录原组件可见性，保留原有透明或隐藏装饰。 */
    private visible = true;

    /** 抖音加载成功前不显示英文图片；失败后保留重试。 */
    onLoad(): void {
        if ((typeof TTMinis !== 'undefined' && TTMinis.game) || typeof tt === 'undefined') return;
        const sprite = this.getComponent(Sprite), transform = this.getComponent(UITransform);
        if (!sprite || !transform || !this.bundleName || !this.framePath) return;
        this.size = { width: transform.width, height: transform.height };
        this.visible = sprite.enabled;
        sprite.enabled = false;
        this.loadFrame();
    }
    /** 资源可重试加载；只修改预制体已有Sprite，保持扫光材质。 */
    private loadFrame(): void {
        assetManager.loadBundle(this.bundleName, (error, bundle) => {
            if (!isValid(this, true)) return;
            if (error || !bundle) { this.scheduleOnce(() => this.loadFrame(), 1); return; }
            bundle.load(this.framePath, SpriteFrame, (failure, frame) => {
                if (!isValid(this, true)) return;
                if (failure || !frame) { this.scheduleOnce(() => this.loadFrame(), 1); return; }
                const sprite = this.getComponent(Sprite)!;
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                sprite.spriteFrame = frame;
                const ratio = Math.min(this.size.width / frame.rect.width, this.size.height / frame.rect.height);
                this.getComponent(UITransform)!.setContentSize(frame.rect.width * ratio, frame.rect.height * ratio);
                sprite.enabled = this.visible;
            });
        });
    }
}
