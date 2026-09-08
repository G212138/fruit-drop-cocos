import { _decorator, Component, sp, isValid } from 'cc';
const { ccclass, property } = _decorator;

/** 原版爆炸 Spine 的独立预制体，只负责一次播放和清理。 */
@ccclass('ExplosionView')
export class ExplosionView extends Component {
    /** 编辑器绑定原 baozha 骨骼，动画1、速度1.2均来自原预制体。 */
    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null!;
    /** 爆炸中段的后续表现回调；清局销毁时丢弃，避免操作下一局。 */
    private midpoint: (() => void) | null = null;

    /** @param callback 挂入场景前配置的后续入袋流程；每次爆炸至多执行一次。 */
    setMidpointCallback(callback: () => void): void {
        this.midpoint = callback;
    }

    /** 实例挂入特效层时播放一次，结束后销毁，不修改水果或进度。 */
    onLoad(): void {
        this.skeleton.setCompleteListener(() => this.finish());
        const track = this.skeleton.setAnimation(0, '1', false);
        if (this.midpoint) {
            // 原版使用动画原始时长的一半，限制为0.05～0.5秒，不除以骨骼播放速度。
            const duration = track?.animationEnd || track?.animation?.duration || 1;
            this.scheduleOnce(this.notifyMidpoint, Math.min(0.5, Math.max(0.05, duration * 0.5)));
        }
    }

    /** 爆炸中段释放后续流程，并先清空引用以抵抗回调重入。 */
    private notifyMidpoint(): void {
        if (!isValid(this.node, true)) return;
        const callback = this.midpoint;
        this.midpoint = null;
        callback?.();
    }

    /** 骨骼提前完成时补发尚未执行的入袋通知，再清理实例；重复事件不会重复收集。 */
    private finish(): void {
        if (!isValid(this.node, true)) return;
        this.notifyMidpoint();
        this.skeleton.setCompleteListener(null);
        this.node.destroy();
    }

    /** 清局或退出时解除旧骨骼回调，避免回调访问已销毁的节点。 */
    onDestroy(): void {
        this.unscheduleAllCallbacks();
        this.midpoint = null;
        if (isValid(this.skeleton, true)) this.skeleton.setCompleteListener(null);
    }
}
