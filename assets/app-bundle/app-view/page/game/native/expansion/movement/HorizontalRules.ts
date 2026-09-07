/** 原版每次配对追加的右移距离，单位设计像素。 */
export const HORIZONTAL_PAIR_SHIFT = 15;
/** 原版每秒最大补位距离，单位设计像素。 */
export const HORIZONTAL_SHIFT_SPEED = 500;
/** 原版连续自动下落的最短间隔，单位秒。 */
export const HORIZONTAL_DROP_INTERVAL = 0.1;

/** @param positions 全部初始水果横坐标。 @param lineX 原版右侧线中心横坐标，设计像素。 */
export function initialHorizontalShift(positions: number[], lineX: number): number {
    if (!positions.length) return 0;
    const nearest = Math.max(...positions), farthest = Math.min(...positions);
    const delta = lineX - nearest - 150;
    if (delta <= 0) return delta;
    return Math.max(0, Math.min(delta, lineX - farthest - 500));
}

/** @param positions 未释放水果横坐标。 @param lineX 原版右侧线中心横坐标。 */
export function shiftAfterHorizontalDrop(positions: number[], lineX: number): number {
    if (!positions.length || lineX - Math.min(...positions) < 500) return 0;
    const gap = lineX - Math.max(...positions);
    return gap > 400 ? gap - 150 : 0;
}

/** @param pending 尚未完成的横向位移。 @param allPositions 所有未消除水果横坐标，包含已下落水果。 @param lineX 右侧线中心。 @param dt 当前帧秒数。 */
export function consumeHorizontalShift(pending: number, allPositions: number[], lineX: number, dt: number): { delta: number; remaining: number } {
    let distance = pending;
    if (distance > 0 && allPositions.length) {
        const gap = lineX - Math.min(...allPositions);
        if (gap < 500) distance = 0;
        else if (gap > 500) distance = Math.min(distance, gap - 500);
        // 等于五百时沿用原版不再截断本帧余量的分支。
    }
    const limit = HORIZONTAL_SHIFT_SPEED * (dt > 0 ? dt : 1 / 60);
    const delta = Math.sign(distance) * Math.min(Math.abs(distance), limit);
    return { delta, remaining: distance - delta };
}

/** 自动下落选择只接收可释放水果；圆形范围来自原版图片最大边长。 */
export interface HorizontalCandidate {
    /** 候选横坐标，设计像素。 */
    x: number;
    /** 候选纵坐标，设计像素。 */
    y: number;
    /** 估计半径，设计像素。 */
    radius: number;
}

/** @param candidates 原顺序的可释放水果。 @param x 右侧线中心横坐标。 @param y 线中心纵坐标。 @param width 线宽。 @param height 线高。 */
export function chooseHorizontalDrop(candidates: HorizontalCandidate[], x: number, y: number, width: number, height: number): number {
    let selected = -1, best = Infinity;
    const left = x - (width > 1 ? width / 2 : 0), right = x + (width > 1 ? width / 2 : 0);
    const bottom = height > 10 ? y - height / 2 - 20 : -Infinity;
    const top = height > 10 ? y + height / 2 + 20 : Infinity;
    candidates.forEach((fruit, index) => {
        if (fruit.y + fruit.radius < bottom || fruit.y - fruit.radius > top) return;
        const distance = fruit.x < left ? left - fruit.x : fruit.x > right ? fruit.x - right : 0;
        if (distance <= fruit.radius + 20 && distance < best) { selected = index; best = distance; }
    });
    return selected;
}
