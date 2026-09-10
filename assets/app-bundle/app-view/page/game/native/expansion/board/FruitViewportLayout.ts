import { Node, UITransform, Vec3 } from 'cc';

/** 只读取组件布局完成后的补位上界，不修改任何节点或布局组件。 */
export class FruitViewportLayout {
    /**
     * @param _page 保留页面调用参数；布局完全由编辑器组件负责。
     * @param _board 棋盘节点；不改写位置、缩放或尺寸。
     * @param fruits 水果坐标容器，补位规则使用其局部坐标。
     * @param status 编辑器配置的补位上界标记。
     * @returns 标记下缘在水果容器内的高度，单位设计像素。
     */
    apply(_page: Node, _board: Node, fruits: Node, status: Node): number {
        const transform = fruits.getComponent(UITransform)!;
        const marker = status.getComponent(UITransform)!;
        const world = marker.convertToWorldSpaceAR(new Vec3(0, -marker.height * marker.anchorY, 0));
        // 保留原补位16设计像素间距；仅供玩法补位读取，不用于调整UI。
        return transform.convertToNodeSpaceAR(world).y - 16;
    }
}
