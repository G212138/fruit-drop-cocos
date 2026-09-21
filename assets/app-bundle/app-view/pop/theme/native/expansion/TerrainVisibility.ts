import { _decorator, Component, Node, Sprite, Label, ScrollView, UITransform } from 'cc';
const { ccclass, property } = _decorator;
/** 地块卡片可见性优化；保留原始地块图与圆角遮罩。 */
@ccclass('TerrainVisibility')
export class TerrainVisibility extends Component {
    /** 主题纵向列表。 */
    @property(ScrollView) scroll: ScrollView = null!;
    /** 原始卡片位置基准。 */
    @property([Node]) cards: Node[] = [];
    /** 包含圆角遮罩的预览容器。 */
    @property([Node]) previews: Node[] = [];
    /** 选中态，业务决定节点激活状态。 */
    @property([Sprite]) selected: Sprite[] = [];
    /** 卡片名称。 */
    @property([Label]) titles: Label[] = [];
    /** 独立交互按钮。 */
    @property([Node]) actions: Node[] = [];
    /** 同序按钮文字。 */
    @property([Label]) captions: Label[] = [];
    /** 同序广告标识。 */
    @property([Sprite]) ads: Sprite[] = [];
    /** 滚动结束后只激活可见的卡片、按钮和遮罩。 */
    lateUpdate(): void {
        const list = this.scroll.content!;
        const height = list.parent!.getComponent(UITransform)!.height;
        this.cards.forEach((card, i) => {
            const visible = Math.abs(list.position.y + card.position.y) < (height + card.getComponent(UITransform)!.height) / 2 + 2;
            card.active = visible;
            this.previews[i].active = visible;
            this.selected[i].enabled = visible;
            this.titles[i].enabled = visible;
            this.actions[i].active = visible;
            this.captions[i].enabled = visible;
            this.ads[i].enabled = visible;
        });
    }
}
