import { _decorator, Component, Sprite, SpriteFrame, Label, Button, isValid } from 'cc';
import { GameTerrain } from '../../../../../../app-builtin/app-model/expansion/GameTerrain';
import { terrainCatalog } from '../../../../../../app-builtin/app-model/expansion/TerrainProgress';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { TerrainArt } from '../../../game/native/expansion/board/TerrainArt';
const { ccclass, property } = _decorator;
/** 独立地块预览面板；节点和布局全部由首页预制体维护。 */
@ccclass('TerrainPanel')
export class TerrainPanel extends Component {
    /** 单张地块预览，翻页时按需加载。 */
    @property(Sprite) preview: Sprite = null!;
    /** 标题、主题名称、页码和状态。 */
    @property(Label) heading: Label = null!;
    /** 当前地块名称。 */
    @property(Label) title: Label = null!;
    /** 当前页数。 */
    @property(Label) count: Label = null!;
    /** 加载及保存反馈。 */
    @property(Label) status: Label = null!;
    /** 确认使用按钮。 */
    @property(Button) confirmButton: Button = null!;
    /** 确认使用文字。 */
    @property(Label) confirmLabel: Label = null!;
    /** 当前预览页下标，仅确认后保存。 */
    private index = 0;
    /** 请求代次，快速翻页时丢弃过期结果。 */
    private request = 0;
    /** 当前持有的图片。 */
    private held: SpriteFrame | null = null;
    /** 预览是否加载完成。 */
    private ready = false;
    /** 本次错误是否需要重试。 */
    private failed = false;
    /** 稳定语言订阅函数。 */
    private readonly languageChanged = (): void => this.render();
    /** 启用时监听语言。 */
    onEnable(): void { GameLanguage.subscribe(this.languageChanged); }
    /** 退出时清理图片和异步状态。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.languageChanged);
        ++this.request;
        this.preview.spriteFrame = null;
        this.held?.decRef();
        this.held = null;
    }
    /** 从已确认地块打开。 */
    open(): void {
        this.index = Math.max(0, terrainCatalog.findIndex(item => item.id === GameTerrain.current.selected));
        this.node.active = true;
        this.load();
    }
    /** 上一款，首尾循环。 */
    previous(): void {
        this.index = (this.index + terrainCatalog.length - 1) % terrainCatalog.length;
        this.load();
    }
    /** 下一款，首尾循环。 */
    next(): void {
        this.index = (this.index + 1) % terrainCatalog.length;
        this.load();
    }
    /** 关闭预览不修改当前使用项。 */
    close(): void { this.node.active = false; }
    /** 加载当前页并阻止过期回调应用。 */
    private load(): void {
        const ticket = ++this.request;
        this.ready = false;
        this.failed = false;
        this.preview.spriteFrame = null;
        this.held?.decRef();
        this.held = null;
        this.render();
        TerrainArt.load(terrainCatalog[this.index].file, frame => {
            if (!isValid(this) || ticket !== this.request || !this.node.activeInHierarchy) {
                frame?.decRef();
                return;
            }
            this.held = frame;
            this.preview.spriteFrame = frame;
            this.ready = !!frame;
            this.failed = !frame;
            this.render();
        });
    }
    /** 图片确认可用后才保存；加载失败时按钮用于重试。 */
    confirmUse(): void {
        if (this.failed) { this.load(); return; }
        if (!this.ready) return;
        if (!GameTerrain.current.select(terrainCatalog[this.index].id)) {
            this.status.string = GameLanguage.text('themeSaveError');
            return;
        }
        this.render();
    }
    /** 更新独立选择状态和语言。 */
    private render(): void {
        const entry = terrainCatalog[this.index];
        const used = entry.id === GameTerrain.current.selected;
        const zh = GameLanguage.current === 'zh';
        this.heading.string = GameLanguage.text('themes');
        this.title.string = zh ? entry.zh : entry.en;
        this.count.string = (this.index + 1) + ' / ' + terrainCatalog.length;
        this.status.string = this.failed ? (zh ? '图片加载失败，请重试' : 'Could not load. Retry.') : !this.ready ? (zh ? '加载中…' : 'Loading…') : (zh ? '只更换地块，掉落物在图鉴选择' : 'Terrain only. Choose items in Collection.');
        this.confirmButton.interactable = this.failed || (this.ready && !used);
        this.confirmLabel.string = this.failed ? GameLanguage.text('restart') : GameLanguage.text(used ? 'themeInUse' : 'confirmTheme');
    }
}
