import { _decorator, Component, sp, isValid } from 'cc';
const { ccclass, property } = _decorator;

/** 原版爆炸 Spine 的独立预制体，只负责一次播放和清理。 */
@ccclass('ExplosionView')
export class ExplosionView extends Component {
    /** 编辑器绑定原 baozha 骨骼，动画1、速度1.2均来自原预制体。 */
    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null!;

    /** 实例挂入特效层时播放一次，结束后销毁，不修改水果或进度。 */
    onLoad(): void {
        this.skeleton.setCompleteListener(() => this.finish());
        this.skeleton.setAnimation(0, '1', false);
    }

    /** 骨骼完成时清理现有实例，防止重复完成事件触发重复销毁。 */
    private finish(): void {
        if (!isValid(this.node, true)) return;
        this.skeleton.setCompleteListener(null);
        this.node.destroy();
    }

    /** 清局或退出时解除旧骨骼回调，避免回调访问已销毁的节点。 */
    onDestroy(): void {
        if (isValid(this.skeleton, true)) this.skeleton.setCompleteListener(null);
    }
}
