import { instantiate, Prefab, Node, isValid, UITransform, ERigidBody2DType } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { FruitDefinition } from '../level/LevelDefinition';
import { BlackHoleView } from './BlackHoleView';
import { PIXELS_PER_PHYSICS_METER, DEGREES_PER_RADIAN } from '../physics/PhysicsRules';
import { BLACK_HOLE_SPAWN_DELAY, BLACK_HOLE_GROW_SECONDS, BLACK_HOLE_SETTLE_SECONDS, BLACK_HOLE_COLLISION_TIMEOUT,
    blackHoleAppearanceScale, blocksBlackHoleCollision } from './BlackHoleRules';

/** 一个黑洞只有一颗当前水果，后续成员按原配置顺序保留。 */
interface BlackHoleGroup {
    /** 当前可见或正在出现的水果。 */
    resident: FruitItem;
    /** 还未创建的成员定义，升序排列。 */
    pending: FruitDefinition[];
    /** 独立黑洞表现，跟随当前悬停水果补位。 */
    view: BlackHoleView;
}

/** 黑洞协调器只管理成员生命周期，不决定匹配、胜负或页面导航。 */
export class BlackHoleFlow {
    /** 当前水果到黑洞的映射，释放后立即移除以防重复补出成员。 */
    private readonly groups = new Map<FruitItem, BlackHoleGroup>();
    /** 新成员出现计时，单位秒；存在时禁止点击并关闭其刚体。 */
    private readonly appearing = new Map<FruitItem, number>();
    /** 棋盘停止后不继续恢复碰撞或出现动画。 */
    private stopped = false;

    /** 所有尚未创建的成员数量，必须计入关卡剩余量。 */
    get pendingCount(): number {
        return Array.from(this.groups.values()).reduce((total, group) => total + group.pending.length, 0);
    }

    /** @param host 已生成宿主。 @param members 排序前的完整成员。 @param prefab 编辑器制作的黑洞表现。 @param parent 与水果共用坐标系的容器。 */
    attach(host: FruitItem, members: FruitDefinition[], prefab: Prefab, parent: Node): void {
        const node = instantiate(prefab);
        node.parent = parent;
        node.setPosition(host.node.position);
        const view = node.getComponent(BlackHoleView)!;
        view.arrangeLayers(parent);
        view.setCount(members.length + 1);
        this.groups.set(host, { resident: host, pending: [...members].sort((a, b) => a.sequence! - b.sequence!), view });
    }

    /** @param fruit 即将释放或消除的当前水果。 @param spawn 使用已有单体工厂生成下一成员。 */
    advance(fruit: FruitItem, spawn: (definition: FruitDefinition) => FruitItem): void {
        const group = this.groups.get(fruit);
        if (!group || this.stopped) return;
        // 横向复活可以直接选中新出现成员；旧实例离组后不能再由出现计时恢复刚体。
        this.appearing.delete(fruit);
        fruit.spawning = false;
        this.groups.delete(fruit);
        const definition = group.pending.shift();
        if (!definition) {
            group.view.node.destroy();
            return;
        }
        // 创建不可交互、零缩放的占位实例，使本帧补位也带动黑洞；零点零二秒后才开始出现。
        const next = spawn({ ...definition, x: fruit.node.position.x, y: fruit.node.position.y });
        next.spawning = true;
        next.body.enabled = false;
        next.node.setScale(0, 0, 1);
        group.resident = next;
        group.view.setCount(group.pending.length + 1);
        group.view.node.setSiblingIndex(parentLastIndex(group.view.node));
        this.groups.set(next, group);
        this.appearing.set(next, 0);
    }

    /** @param fruit 待检查水果；延迟出现前不参与本帧的全场减冰。 */
    isPendingAppearance(fruit: FruitItem): boolean {
        const elapsed = this.appearing.get(fruit);
        return elapsed !== undefined && elapsed < BLACK_HOLE_SPAWN_DELAY;
    }

    /** @param dt 距上一帧秒数。 @param live 当前存活水果，碰撞保护仅检查已释放的动态刚体。 */
    tick(dt: number, live: FruitItem[]): void {
        if (this.stopped) return;
        for (const group of this.groups.values()) group.view.moveTo(group.resident.node.position);
        const falling = live.filter(fruit => !fruit.removing && fruit.body.type === ERigidBody2DType.Dynamic).map(fruit => ({
            x: fruit.node.position.x, y: fruit.node.position.y, radius: this.radius(fruit),
            speedSquared: fruit.body.linearVelocity.lengthSqr() * PIXELS_PER_PHYSICS_METER ** 2,
            angularSpeed: Math.abs(fruit.body.angularVelocity) * DEGREES_PER_RADIAN,
        }));
        for (const [fruit, previous] of this.appearing) {
            if (!isValid(fruit.node, true) || fruit.removing) {
                this.appearing.delete(fruit);
                continue;
            }
            const elapsed = previous + dt;
            this.appearing.set(fruit, elapsed);
            const scale = blackHoleAppearanceScale(elapsed);
            fruit.node.setScale(scale, scale, 1);
            const completedAt = BLACK_HOLE_SPAWN_DELAY + BLACK_HOLE_GROW_SECONDS + BLACK_HOLE_SETTLE_SECONDS;
            if (elapsed < completedAt) continue;
            if (elapsed - completedAt < BLACK_HOLE_COLLISION_TIMEOUT
                && blocksBlackHoleCollision(fruit.node.position.x, fruit.node.position.y, this.radius(fruit), falling)) continue;
            fruit.spawning = false;
            fruit.body.enabled = true;
            this.appearing.delete(fruit);
        }
    }

    /** @param fruit 取原版最大图片边长的一半，返回设计像素。 */
    private radius(fruit: FruitItem): number {
        const size = fruit.node.getComponent(UITransform)!.contentSize;
        return Math.max(size.width, size.height) * 0.5;
    }

    /** 停止后保留当前画面，直到清理本局。 */
    stop(): void {
        this.stopped = true;
    }

    /** 复活后继续原出现进度和成员队列，不能重新生成已释放的宿主或重置倒计时。 */
    resume(): void {
        this.stopped = false;
    }

    /** @param fruit 当前实例；为真表示仍占据黑洞的待释放位置。 */
    isResident(fruit: FruitItem): boolean {
        return this.groups.has(fruit);
    }

    /** 返回当前黑洞显示中心的纵坐标，供扁平棋盘的复活抬升计算。 */
    getCenterYs(): number[] {
        return Array.from(this.groups.values()).map(group => group.view.node.position.y);
    }

    /** 清除本局表现与生成状态，重开时重新启用。 */
    clear(): void {
        for (const group of this.groups.values()) if (isValid(group.view.node, true)) group.view.node.destroy();
        this.groups.clear();
        this.appearing.clear();
        this.stopped = false;
    }
}

/** @param node 黑洞表现节点；返回父容器最后一个子节点的位置，保证数量标记在水果前面。 */
function parentLastIndex(node: Node): number {
    return Math.max(0, node.parent!.children.length - 1);
}
