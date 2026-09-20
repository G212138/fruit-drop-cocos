import { _decorator, Component, Sprite, SpriteFrame, isValid } from 'cc';
import { GameTerrain } from '../../../../../../../app-builtin/app-model/expansion/GameTerrain';
import { TerrainArt } from './TerrainArt';
const { ccclass, property } = _decorator;
/** 只替换地块显示图片，保留编辑器维护的坡道碰撞、锚点和挡板位置。 */
@ccclass('TerrainView')
export class TerrainView extends Component {
    /** 当前节点的地块渲染组件。 */
    @property(Sprite) target: Sprite = null!;
    /** 原草坡作为加载失败的安全回退。 */
    @property(SpriteFrame) fallback: SpriteFrame = null!;
    /** 本组件持有的动态资源。 */
    private held: SpriteFrame | null = null;
    /** 异步请求序号，防止离开页面后旧请求覆盖当前外观。 */
    private request = 0;
    /** 页面激活时加载已确认的地块。 */
    onEnable(): void {
        const ticket = ++this.request;
        this.target.spriteFrame = this.fallback;
        TerrainArt.load(GameTerrain.entry.file, frame => {
            if (!isValid(this) || ticket !== this.request || !this.enabledInHierarchy) {
                frame?.decRef();
                return;
            }
            this.target.spriteFrame = frame || this.fallback;
            this.held?.decRef();
            this.held = frame;
        });
    }
    /** 隐藏时解除动态图片引用，取消未完成请求的应用。 */
    onDisable(): void {
        ++this.request;
        if (this.target) this.target.spriteFrame = this.fallback;
        this.held?.decRef();
        this.held = null;
    }
}
