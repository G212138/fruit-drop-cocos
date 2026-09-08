import { Node, UITransform, Vec3, sys, view } from 'cc';

/** 根据页面安全区和HUD实际位置布局已有裁剪节点，保持水果原点与棋盘原点重合。 */
export class FruitViewportLayout {
    /** 最近一次边界，避免每帧改写物理节点的父级变换。 */
    private signature = '';

    /**
     * @param page 全屏页面根节点。
     * @param board 棋盘根节点；仅扩展UI尺寸，不改变缩放和地形坐标。
     * @param fruits 预制体中已有的水果容器，其父节点为裁剪区。
     * @param status 顶部进度标签，裁剪上沿跟随其实际下边缘。
     * @returns 裁剪上沿的棋盘局部高度，单位设计像素。
     */
    apply(page: Node, board: Node, fruits: Node, status: Node): number {
        const pageTransform = page.getComponent(UITransform)!;
        const boardTransform = board.getComponent(UITransform)!;
        const statusTransform = status.getComponent(UITransform)!;
        const safe = sys.getSafeAreaRect(false);
        const visible = view.getVisibleSize();
        const lower = boardTransform.convertToNodeSpaceAR(pageTransform.convertToWorldSpaceAR(
            new Vec3(safe.x - visible.width / 2, safe.y - visible.height / 2)));
        const upper = boardTransform.convertToNodeSpaceAR(pageTransform.convertToWorldSpaceAR(
            new Vec3(safe.x + safe.width - visible.width / 2, safe.y + safe.height - visible.height / 2)));
        const statusBottom = boardTransform.convertToNodeSpaceAR(statusTransform.convertToWorldSpaceAR(
            new Vec3(0, -statusTransform.height * statusTransform.anchorY)));
        // 标签与裁剪上沿间隔16设计像素，适配留白，避免水果碰到进度文字。
        const top = Math.min(upper.y, statusBottom.y - 16);
        const bottom = lower.y;
        const signature = [board.uuid, lower.x, upper.x, bottom, top, upper.y].join(',');
        if (signature === this.signature) return top;
        this.signature = signature;
        const viewport = fruits.parent!;
        const centerX = (lower.x + upper.x) / 2;
        const centerY = (bottom + top) / 2;
        boardTransform.setContentSize(upper.x - lower.x, upper.y - lower.y);
        viewport.getComponent(UITransform)!.setAnchorPoint(0.5, 0.5);
        viewport.getComponent(UITransform)!.setContentSize(upper.x - lower.x, Math.max(1, top - bottom));
        viewport.setPosition(centerX, centerY, 0);
        // 抵消裁剪区中心移动，水果数据坐标、碰撞位置和洞口判断均保持不变。
        fruits.setPosition(-centerX, -centerY, 0);
        return top;
    }
}
