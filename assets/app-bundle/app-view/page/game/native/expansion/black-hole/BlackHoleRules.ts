/** 原 GameSc 的成员延迟，单位秒；防止同帧释放与创建碰撞代理。 */
export const BLACK_HOLE_SPAWN_DELAY = 0.02;
/** 原版出现动画先用零点五秒放大至一点二倍，再用零点一秒回到正常大小。 */
export const BLACK_HOLE_GROW_SECONDS = 0.5;
/** 原版出现动画收缩阶段时长，单位秒。 */
export const BLACK_HOLE_SETTLE_SECONDS = 0.1;
/** 原版动画完成后最多等待两秒恢复碰撞，单位秒。 */
export const BLACK_HOLE_COLLISION_TIMEOUT = 2;

/** 下落水果的碰撞保护快照，位置与半径为同一设计坐标系中的像素。 */
export interface FallingFruitSnapshot {
    /** 水平中心坐标。 */
    x: number;
    /** 垂直中心坐标。 */
    y: number;
    /** 原版采用图片最大边长的一半估计半径。 */
    radius: number;
    /** 刚体线速度平方，沿用原版接口单位。 */
    speedSquared: number;
    /** 刚体角速度绝对值，沿用原版接口单位。 */
    angularSpeed: number;
}

/** @param x 新成员横坐标。 @param y 新成员纵坐标。 @param radius 新成员估计半径。 @param falling 当前下落水果快照。 */
export function blocksBlackHoleCollision(x: number, y: number, radius: number, falling: FallingFruitSnapshot[]): boolean {
    return falling.some(item => {
        const distanceSquared = (item.x - x) ** 2 + (item.y - y) ** 2;
        const combined = radius + item.radius;
        // 原版近距离系数零点六；较远的零点九范围仅拦截高速水果。
        return distanceSquared <= (0.6 * combined) ** 2
            || (distanceSquared <= (0.9 * combined) ** 2 && (item.speedSquared > 400 || item.angularSpeed > 10));
    });
}

/** @param elapsed 自生成请求起经过的秒数；复现原版 sineOut 与 sineInOut 缩放曲线。 */
export function blackHoleAppearanceScale(elapsed: number): number {
    const time = Math.max(0, elapsed - BLACK_HOLE_SPAWN_DELAY);
    if (time < BLACK_HOLE_GROW_SECONDS) return 1.2 * Math.sin(time / BLACK_HOLE_GROW_SECONDS * Math.PI / 2);
    const settle = Math.min(1, (time - BLACK_HOLE_GROW_SECONDS) / BLACK_HOLE_SETTLE_SECONDS);
    return 1.2 - 0.2 * (1 - Math.cos(Math.PI * settle)) / 2;
}
