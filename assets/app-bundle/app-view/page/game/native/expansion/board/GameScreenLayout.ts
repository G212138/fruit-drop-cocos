import { Node, UITransform, Vec3, Widget, sys, view } from 'cc';

/** 游戏专用适配：场地铺到屏幕底部，HUD和袋子保留安全区，玩法保持等比缩放。 */
export class GameScreenLayout {
    /** 最近屏幕尺寸，避免重复修改物理父节点。 */
    private signature = '';
    /** 袋子布局原坐标，防止反复适配累加底部安全区补偿。 */
    private readonly bagOrigins = new Map<Node, { position: Vec3; scale: Vec3 }>();

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
        const board = boardRoot.getChildByName('GameBoard');
        // 根容器的上下Widget会再次改写位置，必须交由此适配器独占；页面根Widget仍由框架管理。
        for (const target of [boardRoot, hudRoot, board, background]) {
            const widget = target?.getComponent(Widget);
            if (widget) widget.enabled = false;
        }
        const signature = [page.uuid, boardRoot.uuid, visible.width, visible.height, safe.x, safe.y, safe.width, safe.height, topBar?.uuid, reserveCapsule].join(',');
        if (signature === this.signature) {
            this.alignTopBar(page, hudRoot, topBar, reserveCapsule);
            return;
        }
        this.signature = signature;
        if (board) board.setPosition(0, 0, 0);
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
            if (!this.bagOrigins.has(bag)) this.bagOrigins.set(bag, { position: bag.position.clone(), scale: bag.scale.clone() });
            const origin = this.bagOrigins.get(bag)!;
            const lock = board?.getChildByName('LockWallLayout');
            const lockSize = lock?.getComponent(UITransform);
            const bagSize = bag.getComponent(UITransform)!;
            // 袋子置于锁墙下沿和安全区底边之间；不足时等比缩小，禁止直接上移遮挡锁墙。
            const bottom = -733.538 + safe.y / scale + 8;
            const top = lock && lockSize ? lock.position.y - lockSize.height * lockSize.anchorY - 12 : -525.825;
            const fit = Math.min(1, Math.max(1, top - bottom) / (bagSize.height * origin.scale.y));
            bag.setScale(origin.scale.x * fit, origin.scale.y * fit, origin.scale.z);
            const half = bagSize.height * origin.scale.y * fit / 2;
            const y = Math.max(bottom + half, Math.min(top - half, origin.position.y + safe.y / scale));
            bag.setPosition(origin.position.x, y, origin.position.z);
        }
        this.alignTopBar(page, hudRoot, topBar, reserveCapsule);
        const size = background.getComponent(UITransform)!;
        const cover = Math.max(visible.width / size.width, visible.height / size.height);
        background.setScale(cover, cover, 1);
        background.setPosition(0, 0, 0);
    }

    /**
     * 顶栏实际位于 GameHud 下，必须换算到直接父节点坐标，不能当成 HudRoot 的直接子节点。
     * 每帧只同步顶栏，跟进 SafeArea/Widget 的延迟布局，不移动物理父节点。
     * @param page 全屏页面，提供屏幕到世界坐标换算。
     * @param hudRoot HUD缩放容器。
     * @param topBar 待定位的已有顶栏。
     * @param reserveCapsule 是否额外预留48设计像素宿主胶囊间距。
     */
    private alignTopBar(page: Node, hudRoot: Node, topBar: Node | null, reserveCapsule: boolean): void {
        if (!topBar?.parent) return;
        const widget = topBar.getComponent(Widget);
        if (widget) widget.enabled = false;
        const safe = sys.getSafeAreaRect(false);
        const visible = view.getVisibleSize();
        // 原顶部留64设计像素，加上可选胶囊行；按实际HUD倍率换算屏幕距离。
        const inset = (64 + (reserveCapsule ? 48 : 0)) * hudRoot.scale.y;
        const world = page.getComponent(UITransform)!.convertToWorldSpaceAR(new Vec3(
            safe.x + safe.width / 2 - visible.width / 2,
            safe.y + safe.height - visible.height / 2 - inset, 0));
        const local = topBar.parent.getComponent(UITransform)!.convertToNodeSpaceAR(world);
        topBar.setPosition(local.x, local.y, local.z);
    }
}
