import { ERigidBody2DType, isValid, Node, Vec2, Vec3 } from 'cc';
import { FruitItem } from '../fruit/FruitItem';

/** 水果群摇晃适配参数；像素为设计坐标，物理加速度为米/秒²。 */
export const SHAKE_RULES = {
    /** 两次开始至少间隔 3 秒，不叠加摇晃。 */
    cooldown: 3,
    /** 一次摇晃持续 0.8 秒。 */
    duration: 0.8,
    /** 一次左右往返 3 周，所有水果保持同相位。 */
    cycles: 3,
    /** 最大水平位移 24 设计像素。 */
    horizontalPixels: 24,
    /** 最大竖向颠动 7 设计像素。 */
    verticalPixels: 7,
    /** 动态水果的水平晃动加速度 8 米/秒²。 */
    acceleration: 8,
};

/** 同步晃动已有显示节点并推动动态水果，刚体父节点保持稳定。 */
export class FruitShake {
    /** 最近开始时间，单位秒。 */
    private previous = -Infinity;
    /** 当前动画已运行秒数。 */
    private elapsed = SHAKE_RULES.duration;
    /** 显示节点原始局部位置，结束和中断时恢复。 */
    private readonly origins = new Map<Node, Vec3>();

    /** 当前是否正在摇晃。 */
    get busy(): boolean { return this.elapsed < SHAKE_RULES.duration; }

    /** 停止并复位，保留冷却。 */
    stop(): void {
        for (const [node, position] of this.origins) {
            if (isValid(node, true)) node.setPosition(position);
        }
        this.origins.clear();
        this.elapsed = SHAKE_RULES.duration;
    }

    /** 清局重置位置、动画和冷却。 */
    reset(): void {
        this.stop();
        this.previous = -Infinity;
    }

    /** @param fruits 单体快照，悬停水果也参与。 @param now 本局运行秒数。 @returns 参与显示的水果数。 */
    apply(fruits: FruitItem[], now: number): number {
        if (!Number.isFinite(now) || this.busy || now - this.previous < SHAKE_RULES.cooldown) return 0;
        for (const fruit of fruits) {
            const node = fruit.visual?.node;
            if (fruit.removing || fruit.spawning || !isValid(node, true)) continue;
            this.origins.set(node, node.position.clone());
        }
        if (!this.origins.size) return 0;
        this.elapsed = 0;
        this.previous = now;
        return this.origins.size;
    }

    /** @param fruit 即将消除的水果；先移除摇晃偏移再计算特效位置。 */
    release(fruit: FruitItem): void {
        const node = fruit.visual?.node;
        const position = this.origins.get(node);
        if (position && isValid(node, true)) node.setPosition(position);
        this.origins.delete(node);
    }

    /** @param fruits 当前存活单体。 @param dt 帧间隔，单位秒。 */
    tick(fruits: FruitItem[], dt: number): void {
        if (!this.busy || !Number.isFinite(dt) || dt <= 0) return;
        this.elapsed = Math.min(SHAKE_RULES.duration, this.elapsed + dt);
        if (!this.busy) { this.stop(); return; }
        const progress = this.elapsed / SHAKE_RULES.duration;
        const phase = progress * Math.PI * 2 * SHAKE_RULES.cycles;
        // 平滑首尾，所有水果用同一偏移，形成整群摇摆的观感。
        const envelope = Math.sin(progress * Math.PI);
        const horizontal = Math.sin(phase) * envelope;
        const vertical = Math.sin(phase * 2) * envelope;
        for (const [node, position] of this.origins) {
            if (!isValid(node, true)) { this.origins.delete(node); continue; }
            node.setPosition(position.x + horizontal * SHAKE_RULES.horizontalPixels,
                position.y + vertical * SHAKE_RULES.verticalPixels, position.z);
        }
        for (const fruit of fruits) {
            if (fruit.waiting || fruit.removing || fruit.spawning || fruit.iceLayers > 0) continue;
            const body = fruit.body;
            if (!body?.enabled || body.type !== ERigidBody2DType.Dynamic) continue;
            const mass = body.getMass();
            if (!Number.isFinite(mass) || mass <= 0) continue;
            // 质量乘加速度和时间为冲量；最多积算 0.05 秒，避免卡帧猛推。
            body.applyLinearImpulseToCenter(new Vec2(mass * horizontal * SHAKE_RULES.acceleration * Math.min(dt, 0.05), 0), true);
        }
    }
}
