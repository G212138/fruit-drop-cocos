import { ERigidBody2DType, isValid, Node, RigidBody2D, Vec2, Vec3 } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { PIXELS_PER_PHYSICS_METER } from './PhysicsRules';

/** 容器摇晃适配参数，并非原版配置。 */
export const SHAKE_RULES = {
    /** 两次开始间隔 1.6 秒，摇完约 0.2 秒可再触发；手感适配值。 */
    cooldown: 1.6,
    /** 往返过程 1.4 秒，先快后慢收势，首尾位移与速度均为零。 */
    duration: 1.4,
    /** 左右往返 3 周，减轻机械式高频抖动。 */
    cycles: 3,
    /** 衰减包络基准 32 个世界像素，实际峰值约 20 像素。 */
    amplitude: 32,
    /** 背景横向临时扩宽 8%，覆盖摇晃露出的边缘。 */
    backgroundScale: 1.08,
};

/** 随容器移动的刚体，保存原始位置和类型供结束恢复。 */
interface FixedBody {
    /** 既有刚体，不创建新组件。 */
    body: RigidBody2D;
    /** 开始前世界坐标，单位像素。 */
    origin: Vec3;
    /** 原始静态刚体类型。 */
    type: ERigidBody2DType;
}

/** 没有刚体的场地表现；与容器同步，不涉及 HUD。 */
interface Scenery {
    /** 已序列化的场地节点。 */
    node: Node;
    /** 原始世界坐标，单位像素。 */
    origin: Vec3;
    /** 原始缩放，结束时还原。 */
    scale: Vec3;
}

/** 用运动学容器推动动态水果；自由水果的位置和速度由物理引擎决定。 */
export class FruitShake {
    /** 上次开始的本局时间，单位秒。 */
    private previous = -Infinity;
    /** 已运行时间，单位秒。 */
    private elapsed = Infinity;
    /** 已通知的往返周期编号；首周反馈由成功启动时触发。 */
    private feedbackCycle = 0;
    /** 地形、锁墙以及未点击水果的固定刚体。 */
    private readonly fixed = new Map<RigidBody2D, FixedBody>();
    /** 参与本次运动的固定水果，用于屏蔽悬停水果的业务接触。 */
    private readonly held = new Set<FruitItem>();
    /** 背景与袋子等场地表现。 */
    private readonly scenery: Scenery[] = [];

    /** 是否仍在推动容器；最后一帧回位后才解除门禁。 */
    get busy(): boolean {
        return this.elapsed !== Infinity;
    }

    /** 恢复固定部分；不重置任何自由水果的位置、速度或重力。 */
    stop(): void {
        for (const state of this.fixed.values()) {
            if (!isValid(state.body, true) || !isValid(state.body.node, true)) continue;
            state.body.linearVelocity = new Vec2();
            state.body.node.setWorldPosition(state.origin);
            state.body.type = state.type;
        }
        for (const fruit of this.held) fruit.shakingSuspended = false;
        for (const state of this.scenery) {
            if (!isValid(state.node, true)) continue;
            state.node.setWorldPosition(state.origin);
            state.node.setScale(state.scale);
        }
        this.fixed.clear();
        this.held.clear();
        this.scenery.length = 0;
        this.elapsed = Infinity;
    }

    /** 重开或退出时清理运动和冷却。 */
    reset(): void {
        this.stop();
        this.previous = -Infinity;
    }

    /**
     * 开始一次容器运动，不向自由水果施加人为随机推力。
     * @param fruits 当前水果快照。
     * @param now 本局时间，单位秒。
     * @param board 已有棋盘节点，提供地形刚体和背景。
     */
    apply(fruits: FruitItem[], now: number, board: Node): number {
        if (!Number.isFinite(now) || this.busy || now - this.previous < SHAKE_RULES.cooldown) return 0;
        const live = fruits.filter(fruit => isValid(fruit.node, true) && !fruit.removing && !fruit.spawning);
        if (!live.length) return 0;
        // 仅绑定固定部分；动态水果始终保留正常重力和碰撞响应。
        for (const body of board.getComponentsInChildren(RigidBody2D)) {
            if (!body.enabled || !body.node.activeInHierarchy || body.type !== ERigidBody2DType.Static) continue;
            const fruit = fruits.find(item => item.body === body);
            if (fruit && (live.indexOf(fruit) < 0 || !fruit.waiting)) continue;
            this.fixed.set(body, { body, origin: body.node.worldPosition.clone(), type: body.type });
            body.type = ERigidBody2DType.Kinematic;
            body.linearVelocity = new Vec2();
            if (fruit) {
                fruit.shakingSuspended = true;
                this.held.add(fruit);
            }
        }
        for (const name of ['Background', 'RemovalEffects', 'RightLine']) {
            const node = board.getChildByName(name);
            if (!node) continue;
            this.scenery.push({ node, origin: node.worldPosition.clone(), scale: node.scale.clone() });
        }
        this.elapsed = 0;
        this.feedbackCycle = 0;
        this.previous = now;
        return live.length;
    }

    /** @param fruit 点击释放或消除的水果，保留当前世界位置再交还业务流程。 */
    release(fruit: FruitItem): void {
        const state = this.fixed.get(fruit.body);
        if (state && isValid(fruit.body, true)) {
            fruit.body.linearVelocity = new Vec2();
            fruit.body.type = state.type;
        }
        this.fixed.delete(fruit.body);
        this.held.delete(fruit);
        fruit.shakingSuspended = false;
    }

    /**
     * 通过刚体速度驱动碰撞体，不直接平移水果父节点。
     * @param fruits 当前存活水果，用于处理消除和回收。
     * @param dt 当前帧间隔，单位秒。
     * @param onCycle 进入下一往返周期时播放音效和震动；掉帧时不补播过期反馈。
     */
    tick(fruits: FruitItem[], dt: number, onCycle?: () => void): void {
        if (!this.busy || !Number.isFinite(dt) || dt <= 0) return;
        for (const fruit of this.held) {
            if (fruits.indexOf(fruit) < 0 || fruit.removing || !fruit.waiting) this.release(fruit);
        }
        // 表现跟随本次物理步实际完成的容器位移，避免与碰撞体领先一帧。
        const reference = Array.from(this.fixed.values()).find(state => isValid(state.body, true) && state.body.enabled);
        const actual = reference ? reference.body.node.worldPosition.x - reference.origin.x : 0;
        for (const state of this.scenery) {
            if (!isValid(state.node, true)) continue;
            state.node.setWorldPosition(state.origin.x + actual, state.origin.y, state.origin.z);
            if (state.node.name === 'Background') {
                const envelope = Math.sin(Math.min(1, this.elapsed / SHAKE_RULES.duration) * Math.PI) ** 2;
                state.node.setScale(state.scale.x * (1 + (SHAKE_RULES.backgroundScale - 1) * envelope), state.scale.y, state.scale.z);
            }
        }
        if (this.elapsed >= SHAKE_RULES.duration) {
            this.stop();
            return;
        }
        this.elapsed = Math.min(SHAKE_RULES.duration, this.elapsed + dt);
        const progress = this.elapsed / SHAKE_RULES.duration;
        const cycle = Math.min(SHAKE_RULES.cycles - 1, Math.floor(this.phase(progress)));
        if (cycle > this.feedbackCycle && progress < 1) {
            this.feedbackCycle = cycle;
            onCycle?.();
        }
        // 快速建立受力、逐渐卸力，避免中段突然变猛；相位连续减速。
        const envelope = (1 - Math.exp(-18 * progress)) ** 2 * (1 - progress) ** 2;
        const offset = SHAKE_RULES.amplitude * envelope * Math.sin(this.phase(progress) * Math.PI * 2);
        for (const state of this.fixed.values()) {
            const body = state.body;
            if (!isValid(body, true) || !body.enabled) continue;
            const position = body.node.worldPosition;
            body.linearVelocity = new Vec2((state.origin.x + offset - position.x) / (PIXELS_PER_PHYSICS_METER * dt), 0);
            body.wakeUp();
        }
    }
    /** 连续减速的往返相位，开始频率为结束的约 1.67 倍，无分段速度跳变。 */
    private phase(progress: number): number {
        return SHAKE_RULES.cycles * (1.25 * progress - 0.25 * progress * progress);
    }

}
