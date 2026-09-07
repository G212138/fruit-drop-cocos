import { isValid, Tween, tween, Vec3 } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { REVIVE_PLACEMENT } from './RevivePlacement';

/** 一颗已准备回收的水果及抬升后的目标位置。 */
export interface ReviveMotionTarget {
    /** 原棋盘上的水果实例，调用前已经 prepareRevive，不创建替身。 */
    fruit: FruitItem;
    /** 与水果父节点一致的局部横坐标，单位像素。 */
    x: number;
    /** 与水果父节点一致的局部纵坐标，单位像素。 */
    y: number;
}

/** 复活回收动画独立于摆放和奖励规则，退出后旧补间不能重启物理或解锁新局。 */
export class ReviveMotion {
    /** 仍在移动的水果集合，供输入锁和取消使用。 */
    private pending = new Set<FruitItem>();
    /** 当前批次代号，取消和重开后拒绝旧动画回调。 */
    private generation = 0;
    /** 当前批次全部结束后的回调，调用前先清空以防重入。 */
    private completed: (() => void) | null = null;

    /** 是否还有回收动画未结束，期间棋盘不能处理点击和判负。 */
    get busy(): boolean {
        return this.pending.size > 0;
    }

    /**
     * 使用原版半秒 sineOut 移动既有水果；保持原 z 坐标和恢复后的外观。
     * @param targets 已恢复外观和关闭刚体的实例及各自目标，不能包含重复实例。
     * @param completed 所有回收结束后继续棋盘流程的回调。
     */
    begin(targets: readonly ReviveMotionTarget[], completed: () => void): void {
        if (new Set(targets.map(target => target.fruit)).size !== targets.length) {
            throw new Error('复活动画目标不能重复');
        }
        this.cancel();
        const generation = this.generation;
        this.completed = completed;
        this.pending = new Set(targets.map(target => target.fruit));
        if (!targets.length) {
            this.finishBatch();
            return;
        }
        for (const target of targets) {
            if (!isValid(target.fruit.node, true)) {
                this.finish(target.fruit, generation);
                continue;
            }
            const position = new Vec3(target.x, target.y, target.fruit.node.position.z);
            tween(target.fruit.node).to(REVIVE_PLACEMENT.duration, { position }, { easing: 'sineOut' })
                .call(() => this.finish(target.fruit, generation)).start();
        }
    }

    /** @param fruit 完成本次移动的实例。 @param generation 动画开始时的批次号。 */
    private finish(fruit: FruitItem, generation: number): void {
        if (generation !== this.generation || !this.pending.delete(fruit)) return;
        if (isValid(fruit.node, true)) fruit.finishRevive();
        if (!this.pending.size) this.finishBatch();
    }

    /** 清空完成回调后发布一次，允许回调中立即开始另一批或退出页面。 */
    private finishBatch(): void {
        const completed = this.completed;
        this.completed = null;
        completed?.();
    }

    /** 退出、重开或中断时停止移动；不启用旧局刚体，不伪造正常完成通知。 */
    cancel(): void {
        this.generation++;
        this.completed = null;
        for (const fruit of this.pending) {
            if (isValid(fruit.node, true)) Tween.stopAllByTarget(fruit.node);
        }
        this.pending.clear();
    }
}
