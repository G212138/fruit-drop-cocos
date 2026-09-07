/** 入场矩形范围，单位设计像素。 */
export interface EntryBounds {
    /** 屏幕左边界。 */
    left: number;
    /** 屏幕上边界。 */
    top: number;
}

/** @param mode 原版移动模式。 @param bottom 全部水果最低边缘。 @param right 全部水果最右边缘。 @param bounds 屏幕设计边界。 */
export function planEntry(mode: 1 | 2, bottom: number, right: number, bounds: EntryBounds): { x: number; y: number; duration: number } {
    const x = mode === 2 ? Math.min(0, bounds.left - 80 - right) : 0;
    const y = mode === 1 ? Math.max(0, bounds.top + 80 - bottom) : 0;
    // 原版屏幕外留八十像素；距离除以九百，再限制零点二五至一点二秒。
    return { x, y, duration: Math.max(0.25, Math.min(1.2, Math.hypot(x, y) / 900)) };
}
