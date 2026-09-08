/** 纵向补位阈值，单位设计像素；三个高度均在原版基础上增加140，与等待区上移保持一致。 */
export const SHIFT_RULES = {
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
