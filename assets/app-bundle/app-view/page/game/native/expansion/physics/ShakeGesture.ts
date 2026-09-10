/** 三轴加速度样本，单位 g；时间由调用方提供，不依赖设备事件时间格式。 */
export interface ShakeSample {
    /** 横向加速度。 */
    x: number;
    /** 纵向加速度。 */
    y: number;
    /** 屏幕法向加速度。 */
    z: number;
}

/** 两次明显加速度变化才识别一次摇晃，过滤静止重力和单次拿起手机。 */
export class ShakeGesture {
    /** 上次有效样本；暂停和返回前台后清空，避免跨时间误判。 */
    private previous: ShakeSample | null = null;
    /** 上次采样时间，单位毫秒。 */
    private sampledAt = 0;
    /** 首次明显变化时间，单位毫秒。 */
    private firstPeak = -Infinity;

    /** 清除旧样本和未完成手势。 */
    reset(): void {
        this.previous = null;
        this.firstPeak = -Infinity;
    }

    /** @param sample 当前加速度，单位 g。 @param now 时间戳，单位毫秒。 */
    accept(sample: ShakeSample, now: number): boolean {
        if (![sample.x, sample.y, sample.z, now].every(Number.isFinite)) return false;
        const previous = this.previous;
        const elapsed = now - this.sampledAt;
        this.previous = { ...sample };
        this.sampledAt = now;
        if (!previous || elapsed <= 0 || elapsed > 500) {
            this.firstPeak = -Infinity;
            return false;
        }
        // 适配阈值 1.2 g；两次变化间隔 60 至 500 毫秒，避免单帧噪声。
        if (Math.hypot(sample.x - previous.x, sample.y - previous.y, sample.z - previous.z) < 1.2) return false;
        const gap = now - this.firstPeak;
        if (gap >= 60 && gap <= 500) {
            this.reset();
            return true;
        }
        if (gap > 500) this.firstPeak = now;
        return false;
    }
}
