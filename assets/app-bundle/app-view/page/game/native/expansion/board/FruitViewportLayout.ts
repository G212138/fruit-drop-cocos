import { Node, UITransform, Vec3, Widget, view } from 'cc';

/** 根据全屏边界布局已有裁剪节点，HUD下沿仅决定补位目标，水果原点与棋盘重合。 */
export class FruitViewportLayout {
    /** 最近一次边界，避免每帧改写物理节点的父级变换。 */
    private signature = '';

    /**
     * @param page 全屏页面根节点。
     * @param board 棋盘根节点；仅扩展UI尺寸，不改变缩放和地形坐标。
     * @param fruits 预制体中已有的水果容器，其父节点为裁剪区。
     * @param status 顶部栏下边界，仅用于计算整体下移的目标高度。
     * @returns 整体下移目标的最高局部高度，单位设计像素；与全屏裁剪边缘分开。
     */
    apply(page: Node, board: Node, fruits: Node, status: Node): number {
        // 运行时由动态裁剪独占布局，停用普通Widget，防止覆盖水果坐标补偿。
        const viewportWidget = fruits.parent!.getComponent(Widget);
        if (viewportWidget) viewportWidget.enabled = false;
        const pageTransform = page.getComponent(UITransform)!;
        const boardTransform = board.getComponent(UITransform)!;
        const statusTransform = status.getComponent(UITransform)!;
        const visible = view.getVisibleSize();
        const lower = boardTransform.convertToNodeSpaceAR(pageTransform.convertToWorldSpaceAR(
            new Vec3(-visible.width / 2, -visible.height / 2)));
        const upper = boardTransform.convertToNodeSpaceAR(pageTransform.convertToWorldSpaceAR(
            new Vec3(visible.width / 2, visible.height / 2)));
        const statusBottom = boardTransform.convertToNodeSpaceAR(statusTransform.convertToWorldSpaceAR(
            new Vec3(0, -statusTransform.height * statusTransform.anchorY)));
        // 顶部栏与补位目标上界间隔16设计像素，适配留白，避免水果碰到进度文字。
        const top = Math.min(upper.y, statusBottom.y - 16);
        // 画面覆盖整个屏幕，包括刘海和手势区域；安全区只约束操作控件，不裁切水果。
        const bottom = lower.y;
        const signature = [board.uuid, lower.x, upper.x, bottom, top, upper.y].join(',');
        if (signature === this.signature) return top;
        this.signature = signature;
        const viewport = fruits.parent!;
        const centerX = (lower.x + upper.x) / 2;
        const centerY = (bottom + upper.y) / 2;
        boardTransform.setContentSize(upper.x - lower.x, upper.y - lower.y);
        viewport.getComponent(UITransform)!.setAnchorPoint(0.5, 0.5);
        viewport.getComponent(UITransform)!.setContentSize(upper.x - lower.x, Math.max(1, upper.y - bottom));
        viewport.setPosition(centerX, centerY, 0);
        // 抵消裁剪区中心移动，水果数据坐标、碰撞位置和洞口判断均保持不变。
        fruits.setPosition(-centerX, -centerY, 0);
        return top;
    }
}
