/** 纵向补位阈值，单位设计像素；三个高度均在原版基础上增加140，与等待区上移保持一致。 */
export const SHIFT_RULES = {
    /** 坡面空隙为本批最大水果外接直径的0.8倍；用户手感调整，比初版减少20%。 */
    slopeGapRatio: 0.8,
    /** 最上方未点击水果至少达到此高度才需要补位。 */
    topThreshold: 740,
    /** 等待水果中心的完整可点击上限：裁剪上沿500减去60像素外形余量；适配值，防止尾果卡在裁剪区。 */
    reachableTop: 440,
    /** 最下方未点击水果高于此高度才触发补位。 */
    bottomThreshold: 240,
    /** 补位后最低水果的目标高度。 */
    targetBottom: 70,
    /** 用于计算动画时长的距离系数，单位像素每秒；补间为正弦缓出。 */
    speed: 300,
    /** 原版动画最短时间，单位秒。 */
    minDuration: 0.2,
    /** 原版动画最长时间，单位秒。 */
    maxDuration: 1.2,
} as const;

/** 洞口上沿：地形高度-363.538 + 碰撞偏移0.9 + 左沿197，单位设计像素；调低会延后补位。 */
export const SHIFT_MOUTH_Y = -165.638;

/** 等待本批释放水果到达洞口后，只发出一次补位请求。 */
export class VerticalShiftGate {
    /** 本批尚未经过洞口的水果标识；连续点击继续加入同一批。 */
    private readonly pending = new Set<string>();
    /** 是否存在尚未消费的点击补位请求。 */
    private requested = false;

    /** @param id 本次成功释放的水果唯一标识。 */
    request(id: string): void {
        this.pending.add(id);
        this.requested = true;
    }

    /**
     * 到达洞口或已经消除的水果不再阻挡补位。
     * @param fruits 当前存活水果的标识及棋盘局部高度，单位设计像素。
     * @param busy 当前是否仍在执行上一轮补位动画。
     */
    consume(fruits: ReadonlyArray<{ id: string; y: number }>, busy: boolean): boolean {
        if (!this.requested) return false;
        const heights = new Map(fruits.map(fruit => [fruit.id, fruit.y]));
        for (const id of this.pending) {
            const height = heights.get(id);
            if (height === undefined || height <= SHIFT_MOUTH_Y) this.pending.delete(id);
        }
        if (this.pending.size || busy) return false;
        this.requested = false;
        return true;
    }

    /** 结束、重开及销毁时清空旧局请求。 */
    reset(): void {
        this.pending.clear();
        this.requested = false;
    }
}

/** 本轮整体移动计划，已经下落的水果不参与。 */
export interface ShiftPlan {
    /** 纵向移动距离，负数向下，单位设计像素。 */
    delta: number;
    /** 动画时长，单位秒。 */
    duration: number;
}

/** 计算圆形安全区沿向下方向首次碰到地形线段的距离，单位为同一坐标系像素。
 * @param x 水果中心横坐标。 @param y 水果中心纵坐标。
 * @param clearance 中心到地形的安全距离，水果外接半径加一个完整直径。
 * @param points 闭合地形轮廓顶点，已转换到水果父节点坐标系。
 */
export function safeDownwardDistance(x: number, y: number, clearance: number, points: ReadonlyArray<{ x: number; y: number }>): number {
    let limit = Infinity;
    for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
        const projection = length2 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length2)) : 0;
        if (Math.hypot(x - a.x - projection * dx, y - a.y - projection * dy) <= clearance) return 0;
        for (const end of [a, b]) {
            const horizontal = x - end.x;
            if (Math.abs(horizontal) > clearance) continue;
            const hit = y - end.y - Math.sqrt(Math.max(0, clearance * clearance - horizontal * horizontal));
            if (hit >= 0) limit = Math.min(limit, hit);
        }
        if (!length2 || Math.abs(dx) < 1e-8) continue;
        const length = Math.sqrt(length2);
        for (const side of [-1, 1]) {
            const hit = (dx * (y - a.y) - dy * (x - a.x) - side * clearance * length) / dx;
            const along = ((x - a.x) * dx + (y - hit - a.y) * dy) / length2;
            if (hit >= 0 && along >= 0 && along <= 1) limit = Math.min(limit, hit);
        }
    }
    return limit;
}

/** @param allowed 根据斜坡碰撞轮廓计算的可下移距离；2像素死区避免浮点误差反复触发动画。 */
export function planSlopeShift(allowed: number): ShiftPlan | null {
    if (!Number.isFinite(allowed) || Math.abs(allowed) <= 2) return null;
    return { delta: -allowed, duration: Math.max(SHIFT_RULES.minDuration, Math.min(SHIFT_RULES.maxDuration, Math.abs(allowed) / SHIFT_RULES.speed)) };
}

/** 从轮廓上方求安全停止高度，返回有符号距离；负数表示当前过近，需要上移。
 * @param x 水果世界横坐标。 @param y 水果世界纵坐标。
 * @param clearance 世界像素安全半径。 @param points 当前布局后的世界轮廓。
 */
export function signedSlopeDistance(x: number, y: number, clearance: number, points: ReadonlyArray<{ x: number; y: number }>): number {
    if (!points.length) return Infinity;
    const start = Math.max(y, Math.max(...points.map(point => point.y)) + clearance + 1);
    return safeDownwardDistance(x, start, clearance, points) - (start - y);
}

/** @param heights 尚未点击水果的棋盘局部纵坐标，单位设计像素。 */
export function planVerticalShift(heights: number[], reachableTop: number = SHIFT_RULES.reachableTop): ShiftPlan | null {
    if (!heights.length) return null;
    const bottom = Math.min(...heights);
    if (bottom <= SHIFT_RULES.bottomThreshold) return null;
    // 只剩高处水果时不再要求最高点达到740，否则尾果会卡在500像素裁剪线上。
    if (Math.max(...heights) < SHIFT_RULES.topThreshold && bottom <= reachableTop) return null;
    const delta = SHIFT_RULES.targetBottom - bottom;
    return { delta, duration: Math.max(SHIFT_RULES.minDuration,
        Math.min(SHIFT_RULES.maxDuration, Math.abs(delta) / SHIFT_RULES.speed)) };
}
