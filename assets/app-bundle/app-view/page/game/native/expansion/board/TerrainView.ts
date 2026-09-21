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
    /** 已应用资源路径，缓存页面再次显示时直接复用。 */
    private appliedFile = '';
    /** 异步请求序号，防止离开页面后旧请求覆盖当前外观。 */
    private request = 0;
    /** 页面激活时加载已确认的地块。 */
    onEnable(): void {
        const ticket = ++this.request;
        const file = GameTerrain.entry.file;
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
            this.target.spriteFrame = frame || this.fallback;
            this.target.enabled = true;
            this.appliedFile = frame ? file : '';
            this.held?.decRef();
            this.held = frame;
        });
    }
    /** 缓存页面隐藏时仅取消请求，保留已应用地块，避免再次入场闪回默认图。 */
    onDisable(): void {
        ++this.request;
    }
    /** 页面真正销毁时才释放当前地块引用。 */
    onDestroy(): void {
        ++this.request;
        this.held?.decRef();
        this.held = null;
    }
}
