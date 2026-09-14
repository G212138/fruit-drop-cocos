import { _decorator, Component, Node, UITransform, Vec3, sp } from 'cc';
const { ccclass, property } = _decorator;

/** 原版手指和光圈Spine动画，不拦截水果点击。 */
@ccclass('NewbieGuideView')
export class NewbieGuideView extends Component {
    /** 原shouzhi动画，预制体绑定完整骨骼资源。 */
    @property(sp.Skeleton) skeleton: sp.Skeleton = null!;

    /** @param target 当前可点击的引导水果；空值表示入场中、已经点击或本关不显示引导。 */
    follow(target: Node | null): void {
        const visible = !!target;
        const showing = visible && !this.node.active;
        this.node.active = visible;
        if (showing) this.skeleton.setAnimation(0, '1', true);
        if (!target) return;
        const position = this.node.parent!.getComponent(UITransform)!.convertToNodeSpaceAR(target.worldPosition);
        // 以原动画光圈骨骼为对齐点；同时移动手指，消除旧固定偏移在自适应后的误差。
        const circle = this.skeleton.findBone('love2');
        if (circle) {
            const circleWorld = this.skeleton.node.getComponent(UITransform)!.convertToWorldSpaceAR(
                new Vec3(circle.worldX, circle.worldY, 0));
            const circleLocal = this.node.parent!.getComponent(UITransform)!.convertToNodeSpaceAR(circleWorld);
            position.subtract(circleLocal).add(this.node.position);
        }
        this.node.setPosition(position);
    }
}
