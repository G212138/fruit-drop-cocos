import { isValid, Tween, tween, Vec3 } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { planVerticalShift } from './VerticalShiftRules';

/** 移动协调器只控制已有水果实例，不创建节点。 */
export class FruitShift {
    /** 当前补间尚未结束的水果，用于统一取消和输入锁定。 */
    private moving: FruitItem[] = [];

    /** 当前是否处于原版禁止点击的补位动画期间。 */
    get busy(): boolean {
        return this.moving.length > 0;
    }

    /** @param fruits 本次点击后仍未释放的水果实例。 */
    begin(fruits: FruitItem[]): void {
        const plan = planVerticalShift(fruits.map(fruit => fruit.node.position.y));
        if (!plan || this.busy) return;
        this.moving = [...fruits];
        for (const fruit of fruits) {
            fruit.setShifting(true);
            const position = fruit.node.position;
            tween(fruit.node).to(plan.duration, {
                position: new Vec3(position.x, position.y + plan.delta, position.z),
            }, { easing: 'sineOut' }).call(() => this.finish(fruit)).start();
        }
    }

    /** @param fruit 已完成补间、需要恢复静态刚体的水果。 */
    private finish(fruit: FruitItem): void {
        if (isValid(fruit, true)) fruit.setShifting(false);
        this.moving = this.moving.filter(item => item !== fruit);
    }

    /** @param fruit 已配对的水果；移出补位集合，避免已停止的动画永久占用输入锁。 */
    remove(fruit: FruitItem): void {
        Tween.stopAllByTarget(fruit.node);
        this.moving = this.moving.filter(item => item !== fruit);
    }

    /** 停止旧局所有补间，防止切关和重开后收到旧动画回调。 */
    stop(): void {
        for (const fruit of this.moving) {
            if (!isValid(fruit, true)) continue;
            Tween.stopAllByTarget(fruit.node);
            fruit.setShifting(false);
        }
        this.moving = [];
    }
}
