import { _decorator, Component, Node, Sprite, Label, ScrollView, UITransform } from 'cc';
const { ccclass, property } = _decorator;
/** 图鉴可见区域裁剪：遮罩之外不提交绘制，图片文字按层合批。 */
@ccclass('CollectionVisibility')
export class CollectionVisibility extends Component {
    /** 分页容器，用于计算页面是否在横向视口内。 */
    @property(Node) strip: Node = null!;
    /** 两页独立的纵向滚动列表。 */
    @property([ScrollView]) scrolls: ScrollView[] = [];
    /** 60张卡片底框，位置同时作为可见性判断基准。 */
    @property([Sprite]) cards: Sprite[] = [];
    /** 同序物品图标。 */
    @property([Sprite]) icons: Sprite[] = [];
    /** 同序物品名。 */
    @property([Label]) names: Label[] = [];
    /** 同序小锁，仅控制渲染，保留业务解锁设置的节点状态。 */
    @property([Sprite]) locks: Sprite[] = [];
    /** 每帧滚动与分页动画结束后更新，只绘制与视口相交的卡片。 */
    lateUpdate(): void {
        const view = this.node.getComponent(UITransform)!;
        this.scrolls.forEach((scroll, group) => {
            const horizontal = scroll.node.position.x + this.strip.position.x;
            const pageVisible = Math.abs(horizontal) < view.width - 1;
            // 保留触摸目标，避免拖动跨页时停用节点中断后续松手事件。
            if (!scroll.node.active) scroll.node.active = true;
            const list = scroll.content!;
            for (let i = 0; i < 30; i++) {
                const index = group * 30 + i;
                const card = this.cards[index];
                const y = list.position.y + card.node.position.y;
                const height = card.node.getComponent(UITransform)!.height;
                const visible = pageVisible && Math.abs(y) < (view.height + height) / 2 + 2;
                card.enabled = visible;
                this.icons[index].enabled = visible;
                this.names[index].enabled = visible;
                this.locks[index].enabled = visible;
            }
        });
    }
}
