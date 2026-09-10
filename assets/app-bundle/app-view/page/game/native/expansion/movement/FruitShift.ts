import { isValid, Tween, tween, Vec3, Node, UITransform, PolygonCollider2D } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { planVerticalShift, planSlopeShift, safeDownwardDistance, SHIFT_RULES } from './VerticalShiftRules';

/** 移动协调器只控制已有水果实例，不创建节点。 */
export class FruitShift {
    /** 当前补间尚未结束的水果，用于统一取消和输入锁定。 */
    private moving: FruitItem[] = [];

    /** 当前是否处于原版禁止点击的补位动画期间。 */
    get busy(): boolean {
        return this.moving.length > 0;
    }

    /** @param fruits 未释放水果。 @param reachableTop 可点击上界。 @param floor 当前组件布局后的地形。 @param automatic 第二关起按斜坡间距自动补位。 */
    begin(fruits: FruitItem[], reachableTop?: number, floor?: Node | null, automatic = false): void {
        if (!fruits.length || this.busy) return;
        const allowed = this.safeDrop(fruits, floor);
        const plan = automatic ? planSlopeShift(allowed) : planVerticalShift(fruits.map(fruit => fruit.node.position.y), reachableTop);
        if (!plan || this.busy) return;
        plan.delta = -Math.min(-plan.delta, allowed);
        if (plan.delta >= -0.01) return;
        plan.duration = Math.max(SHIFT_RULES.minDuration, Math.min(SHIFT_RULES.maxDuration, -plan.delta / SHIFT_RULES.speed));
        this.moving = [...fruits];
        for (const fruit of fruits) {
            fruit.setShifting(true);
            const position = fruit.node.position;
            tween(fruit.node).to(plan.duration, {
                position: new Vec3(position.x, position.y + plan.delta, position.z),
            }, { easing: 'sineOut' }).call(() => this.finish(fruit)).start();
        }
    }

    /** 以最大水果外接直径作为整批统一留白，避免小水果旁的间隙显得过窄。
     * @param fruits 未释放水果。 @param floor 已有斜坡节点，不改写其布局或碰撞体。
     */
    private safeDrop(fruits: FruitItem[], floor?: Node | null): number {
        const collider = floor?.getComponent(PolygonCollider2D);
        const terrain = floor?.getComponent(UITransform);
        const root = fruits[0]?.node.parent?.getComponent(UITransform);
        if (!collider || !terrain || !root) return 0;
        const points = collider.points.map(point => root.convertToNodeSpaceAR(terrain.convertToWorldSpaceAR(
            new Vec3(point.x + collider.offset.x, point.y + collider.offset.y, 0))));
        const radii = fruits.map(fruit => {
            const bounds = fruit.collider.worldAABB;
            const a = root.convertToNodeSpaceAR(new Vec3(bounds.xMin, bounds.yMin, 0));
            const b = root.convertToNodeSpaceAR(new Vec3(bounds.xMax, bounds.yMax, 0));
            const center = fruit.node.position;
            return Math.hypot(Math.max(Math.abs(a.x - center.x), Math.abs(b.x - center.x)),
                Math.max(Math.abs(a.y - center.y), Math.abs(b.y - center.y)));
        });
        const gap = Math.max(...radii) * 2;
        return Math.min(...fruits.map((fruit, index) => safeDownwardDistance(
            fruit.node.position.x, fruit.node.position.y, radii[index] + gap, points)));
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
