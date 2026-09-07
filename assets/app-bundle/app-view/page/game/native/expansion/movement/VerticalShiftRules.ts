/** 原版纵向补位阈值，单位为设计像素。 */
export const SHIFT_RULES = {
    /** 最上方未点击水果至少达到此高度才需要补位。 */
    topThreshold: 600,
    /** 最下方未点击水果高于此高度才触发补位。 */
    bottomThreshold: 100,
    /** 补位后最低水果的目标高度。 */
    targetBottom: -70,
    /** 用于计算动画时长的距离系数，单位像素每秒；补间为正弦缓出。 */
    speed: 300,
    /** 原版动画最短时间，单位秒。 */
    minDuration: 0.2,
    /** 原版动画最长时间，单位秒。 */
    maxDuration: 1.2,
} as const;

/** 本轮整体移动计划，已经下落的水果不参与。 */
export interface ShiftPlan {
    /** 纵向移动距离，负数向下，单位设计像素。 */
    delta: number;
    /** 动画时长，单位秒。 */
    duration: number;
}

/** @param heights 尚未点击水果的棋盘局部纵坐标，单位设计像素。 */
export function planVerticalShift(heights: number[]): ShiftPlan | null {
    if (!heights.length) return null;
    const bottom = Math.min(...heights);
    if (Math.max(...heights) < SHIFT_RULES.topThreshold || bottom <= SHIFT_RULES.bottomThreshold) return null;
    const delta = SHIFT_RULES.targetBottom - bottom;
    return { delta, duration: Math.max(SHIFT_RULES.minDuration,
        Math.min(SHIFT_RULES.maxDuration, Math.abs(delta) / SHIFT_RULES.speed)) };
}
