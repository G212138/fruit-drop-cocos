import { ERigidBody2DType, Vec2 } from 'cc';
import { FruitItem } from '../fruit/FruitItem';

/** 解卡适配参数；速度单位为物理米/秒，时间单位为秒。 */
export const SHAKE_RULES = {
    /** 免费解卡间隔 3 秒，防止连续冲量改变正常玩法。 */
    cooldown: 3,
    /** 只推动速度不超过 0.6 米/秒的已释放水果，保留正常下落轨迹。 */
    maximumSpeed: 0.6,
    /** 水平速度增量 1 米/秒，左右交替帮助脱离夹缝。 */
    sideways: 1,
    /** 向上速度增量 1.2 米/秒，轻抬水果解除静摩擦。 */
    upward: 1.2,
};

/** 对已下落且近乎静止的单体施加一次有限冲量，不修改坐标、碰撞体或消除规则。 */
export class FruitShake {
    /** 最近成功推动的时间戳，单位秒；空操作不占冷却。 */
    private previous = -Infinity;
    /** 每次成功推动反转水平主方向，避免持续向同一侧堆积。 */
    private direction = 1;

    /** 清局时重置冷却与方向。 */
    reset(): void {
        this.previous = -Infinity;
        this.direction = 1;
    }

    /** @param fruits 当前棋盘单体快照。 @param now 单调递增时间，单位秒。 @returns 实际推动数量。 */
    apply(fruits: FruitItem[], now: number): number {
        if (!Number.isFinite(now) || now - this.previous < SHAKE_RULES.cooldown) return 0;
        let count = 0;
        for (const fruit of fruits) {
            if (fruit.waiting || fruit.removing || fruit.spawning || fruit.iceLayers > 0) continue;
            const body = fruit.body;
            if (!body?.enabled || body.type !== ERigidBody2DType.Dynamic) continue;
            const velocity = body.linearVelocity;
            if (velocity.lengthSqr() > SHAKE_RULES.maximumSpeed ** 2) continue;
            const mass = body.getMass();
            if (!Number.isFinite(mass) || mass <= 0) continue;
            const direction = this.direction * (count % 2 === 0 ? 1 : -1);
            body.applyLinearImpulseToCenter(new Vec2(mass * SHAKE_RULES.sideways * direction, mass * SHAKE_RULES.upward), true);
            count++;
        }
        if (count) {
            this.previous = now;
            this.direction *= -1;
        }
        return count;
    }
}
