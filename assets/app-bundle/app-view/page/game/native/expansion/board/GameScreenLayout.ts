import { Node, UITransform, Vec3, Widget, sys, view } from 'cc';

/** 游戏专用适配：场地铺到屏幕底部，HUD和袋子保留安全区，玩法保持等比缩放。 */
export class GameScreenLayout {
    /** 最近屏幕尺寸，避免重复修改物理父节点。 */
    private signature = '';
    /** 袋子布局原坐标，防止反复适配累加底部安全区补偿。 */
    private readonly bagOrigins = new Map<Node, Vec3>();

    /**
     * @param page 框架负责铺满屏幕的页面。
     * @param boardRoot 固定棋盘容器，等比缩放以保持碰撞与图片一致。
     * @param hudRoot 固定HUD及动态反馈容器，与棋盘共用缩放，底部保留安全区。
     * @param topBar 独立定位的顶部栏；加载前允许为空。
     * @param background 页面背景，等比覆盖屏幕。
     * @param reserveCapsule TikTok 宿主预留顶部胶囊行，普通浏览器不预留。
     */
    apply(page: Node, boardRoot: Node, hudRoot: Node, topBar: Node | null, background: Node, reserveCapsule = false): void {
        const visible = view.getVisibleSize();
        const safe = sys.getSafeAreaRect(false);
        const signature = [page.uuid, boardRoot.uuid, visible.width, visible.height, safe.x, safe.y, safe.width, safe.height, topBar?.uuid, reserveCapsule].join(',');
        if (signature === this.signature) return;
        this.signature = signature;
        // 原地形宽750设计像素；极短屏至少保留1100设计像素高度，避免洞口与顶部栏重叠。
        const scale = Math.min(safe.width / 750, safe.height / 1100);
        const centerX = safe.x + safe.width / 2 - visible.width / 2;
        // 地形下沿为-733.538；画面贴屏幕底部，HUD仍上移到底部安全区。
        const centerY = -visible.height / 2 + 733.538 * scale;
        for (const root of [boardRoot, hudRoot]) {
            root.setScale(scale, scale, 1);
            root.setPosition(centerX, centerY + (root === hudRoot ? safe.y : 0), 0);
        }
        const bag = boardRoot.getChildByName('GameBoard')?.getChildByName('RemovalEffects')?.getChildByName('BagLayout');
        if (bag) {
            if (!this.bagOrigins.has(bag)) this.bagOrigins.set(bag, bag.position.clone());
            const origin = this.bagOrigins.get(bag)!;
            bag.setPosition(origin.x, origin.y + safe.y / scale, origin.z);
        }
        if (topBar) {
            // 动态布局独占顶部位置，避免Widget在窗口变化后重新顶回胶囊区域。
            const widget = topBar.getComponent(Widget);
            if (widget) widget.enabled = false;
            // 普通顶部留64设计像素；宿主额外预留100设计像素胶囊行（无接口时的保守适配值）。
            const top = safe.y + safe.height - visible.height / 2;
            topBar.setPosition(0, (top - centerY - safe.y) / scale - 64 - (reserveCapsule ? 100 : 0), 0);
        }
        const size = background.getComponent(UITransform)!;
        const cover = Math.max(visible.width / size.width, visible.height / size.height);
        background.setScale(cover, cover, 1);
        background.setPosition(0, 0, 0);
    }
}
