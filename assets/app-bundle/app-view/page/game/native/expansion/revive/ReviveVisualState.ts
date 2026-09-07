import { Node, Sprite, UIOpacity, Vec3, Color, Tween, isValid } from 'cc';

/** 下落前单个现有节点的视觉快照，不复制节点或重建 UI。 */
interface NodeVisualState {
    /** 预制体实例中原有的节点引用。 */
    node: Node;
    /** 下落前自身显隐状态，不使用父级影响后的 activeInHierarchy。 */
    active: boolean;
    /** 下落前局部缩放；复活时恢复，避免物理旋转和其他反馈影响尺寸。 */
    scale: Vec3;
    /** 下落前局部欧拉角，单位度。 */
    angles: Vec3;
    /** 原有精灵及独立颜色副本，没有精灵时为空。 */
    sprite: { component: Sprite; color: Color } | null;
    /** 原有透明度组件与数值，范围零至二百五十五。 */
    opacity: { component: UIOpacity; value: number } | null;
}

/** 原版下落前外观恢复，位置由独立摆放规则决定，刚体由水果生命周期管理。 */
export class ReviveVisualState {
    /** 最近一次下落前的完整子树快照，每次下落覆盖而非累计。 */
    private states: NodeVisualState[] = [];

    /**
     * 递归记录当前实例外观，包含暂时不可见的花朵遮罩和冰层子节点。
     * @param root 已实例化水果节点，调用前应清理危险闪色，避免保存警示颜色。
     */
    capture(root: Node): void {
        this.states = [];
        const pending = [root];
        while (pending.length) {
            const node = pending.pop()!;
            const sprite = node.getComponent(Sprite);
            const opacity = node.getComponent(UIOpacity);
            this.states.push({
                node, active: node.active, scale: node.scale.clone(), angles: node.eulerAngles.clone(),
                sprite: sprite ? { component: sprite, color: sprite.color.clone() } : null,
                opacity: opacity ? { component: opacity, value: opacity.opacity } : null,
            });
            pending.push(...node.children);
        }
    }

    /**
     * 恢复仍存在的节点；不创建已销毁的节点，不回滚关卡数据、冰层计数或世界位置。
     * @returns 是否存在下落前快照，供流程层判断能否恢复视觉。
     */
    restore(): boolean {
        if (!this.states.length) return false;
        for (const state of this.states) {
            if (!isValid(state.node, true)) continue;
            Tween.stopAllByTarget(state.node);
            state.node.setScale(state.scale);
            state.node.setRotationFromEuler(state.angles);
            if (state.sprite && isValid(state.sprite.component, true)) {
                Tween.stopAllByTarget(state.sprite.component);
                state.sprite.component.color = state.sprite.color.clone();
            }
            if (state.opacity && isValid(state.opacity.component, true)) {
                Tween.stopAllByTarget(state.opacity.component);
                state.opacity.component.opacity = state.opacity.value;
            }
            // 最后激活已有遮罩，让 onEnable 在外观恢复完毕后重新注册触地监听。
            state.node.active = state.active;
        }
        return true;
    }

    /** 清除旧实例引用，重用和销毁时不再持有子树。 */
    clear(): void {
        this.states = [];
    }
}
