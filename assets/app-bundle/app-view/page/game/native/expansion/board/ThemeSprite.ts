import { _decorator, Component, Sprite, SpriteFrame, UITransform, isValid } from 'cc';
import { GameTerrain } from '../../../../../../../app-builtin/app-model/expansion/GameTerrain';
import { TerrainArt } from './TerrainArt';
const { ccclass, property } = _decorator;

/** 锁墙或袋子预制体内部的主题图片，不向页面暴露子组件引用。 */
@ccclass('ThemeSprite')
export class ThemeSprite extends Component {
    /** 同一预制体内已有的图片。 */
    @property(Sprite) target: Sprite = null!;
    /** 原水果主题图片。 */
    @property(SpriteFrame) fruitFrame: SpriteFrame = null!;
    /** 是否为袋口；为真时同步原版82.5/59设计像素的高度。 */
    @property mouth = false;
    /** 所有地块锁墙统一宽90、高80设计像素，碰撞与布局不变。 */
    @property lockPlug = false;
    /** 当前主题独立挡板图片的持有引用。 */
    private held: SpriteFrame | null = null;
    /** 已应用的挡板路径，页面隐藏后继续持有。 */
    private appliedFile = '';
    /** 防止页面关闭后应用过期结果。 */
    private request = 0;
    /** 实例激活或重新进入页面时应用当前有效主题。 */
    onEnable(): void {

        if (!this.lockPlug) this.target.spriteFrame = this.fruitFrame;
        if (this.lockPlug) {
            this.target.sizeMode = Sprite.SizeMode.CUSTOM;
            this.target.trim = false;
            this.target.node.getComponent(UITransform)!.setContentSize(90, 80);
            this.loadBlock();
        }
        if (this.mouth || this.target.node.name === 'BagBottom') {
            // 草地布袋由同一334×364图片拆层，统一画布保证前后层接缝连续。
            const grass = true;
            this.target.sizeMode = Sprite.SizeMode.CUSTOM;
            this.target.trim = false;
            this.target.node.getComponent(UITransform)!.setContentSize(grass ? 167 : (this.mouth ? 156 : 167), grass ? 182 : (this.mouth ? 46 : 152));
            this.target.node.setPosition(0, grass ? 15 : (this.mouth ? 59 : 0), 0);
        }
    }
    /** 加载正面立体挡板；完整保留倒角、接触阴影及90×80一倍画布。 */
    private loadBlock(): void {
        const ticket = ++this.request;
        const file = 'blocks/' + GameTerrain.entry.id;
        if (this.held && isValid(this.held) && this.appliedFile === file) {
            this.target.spriteFrame = this.held;
            this.target.enabled = true;
            return;
        }
        this.target.enabled = false;
        TerrainArt.load(file, frame => {
            if (!isValid(this) || ticket !== this.request || !this.enabledInHierarchy) {
                frame?.decRef();
                return;
            }
            this.target.spriteFrame = frame || this.fruitFrame;
            this.target.enabled = true;
            this.appliedFile = frame ? file : '';
            this.held?.decRef();
            this.held = frame;
        });
    }
    /** 缓存隐藏时只取消请求，挡板图片继续持有。 */
    onDisable(): void {
        ++this.request;
    }
    /** 页面真正销毁时释放挡板图片。 */
    onDestroy(): void {
        ++this.request;
        this.held?.decRef();
        this.held = null;
    }
}
