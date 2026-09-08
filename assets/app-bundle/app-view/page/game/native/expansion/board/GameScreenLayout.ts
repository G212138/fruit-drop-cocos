import { Node, UITransform, sys, view } from 'cc';

/** 游戏专用适配：棋盘与底部HUD保持同一坐标系，顶部栏贴安全区。 */
export class GameScreenLayout {
    /** 最近屏幕尺寸，避免重复修改物理父节点。 */
    private signature = '';

    /**
     * @param page 框架负责铺满屏幕的页面。
     * @param boardRoot 固定棋盘容器，等比缩放以保持碰撞与图片一致。
     * @param hudRoot 固定HUD及动态反馈容器，与棋盘共用变换。
     * @param topBar 独立定位的顶部栏；加载前允许为空。
     * @param background 页面背景，等比覆盖屏幕。
     */
    apply(page: Node, boardRoot: Node, hudRoot: Node, topBar: Node | null, background: Node): void {
        const visible = view.getVisibleSize();
        const safe = sys.getSafeAreaRect(false);
        const signature = [visible.width, visible.height, safe.x, safe.y, safe.width, safe.height, topBar?.uuid].join(',');
        if (signature === this.signature) return;
        this.signature = signature;
        // 原地形宽750设计像素；极短屏至少保留1100设计像素高度，避免洞口与顶部栏重叠。
        const scale = Math.min(safe.width / 750, safe.height / 1100);
        const centerX = safe.x + safe.width / 2 - visible.width / 2;
        // 原地形中心-363.538、高740，下沿为-733.538；底部贴合安全区。
        const centerY = safe.y - visible.height / 2 + 733.538 * scale;
        for (const root of [boardRoot, hudRoot]) {
            root.setScale(scale, scale, 1);
            root.setPosition(centerX, centerY, 0);
        }
        if (topBar) {
            // 顶部栏中心距安全区顶部64设计像素，容纳原版99像素高设置按钮。
            const top = safe.y + safe.height - visible.height / 2;
            topBar.setPosition(0, (top - centerY) / scale - 64, 0);
        }
        const size = background.getComponent(UITransform)!;
        const cover = Math.max(visible.width / size.width, visible.height / size.height);
        background.setScale(cover, cover, 1);
        background.setPosition(0, 0, 0);
    }
}
