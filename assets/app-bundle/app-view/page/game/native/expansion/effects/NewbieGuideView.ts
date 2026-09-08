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
        // 原手指根相对首关右侧水果的偏移，单位设计像素，保持指尖指向果心。
        this.node.setPosition(Vec3.add(position, position, new Vec3(8.703, -16.941, 0)));
    }
}
