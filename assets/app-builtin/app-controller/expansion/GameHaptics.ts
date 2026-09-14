import { GameSettings } from '../../app-model/expansion/GameSettings';

/** 设备震动边界；无对应能力时返回不支持，不把保存开关当作真实反馈。 */
export class GameHaptics {
    /** 最近一次反馈时间，单位毫秒，防止同帧多颗水果重复震动。 */
    private static previous = -Infinity;
    /** 长震结束时间，单位毫秒；期间忽略碰撞短震，避免打断长震。 */
    private static longUntil = -Infinity;
    /** 原生或小游戏平台注入的震动适配器；尚未配置时使用浏览器能力检测。 */
    private static adapter: ((milliseconds: number) => boolean) | null = null;
    /** @param adapter 已接入平台SDK的调用函数；null解除适配。 */
    static register(adapter: ((milliseconds: number) => boolean) | null): void { this.adapter = adapter; }
    /** 返回当前平台是否暴露震动接口，不承诺设备一定具有震动硬件。 */
    static get supported(): boolean {
        return !!this.adapter || (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function');
    }
    /** 有效点击、配对消除、首次落地或启用设置时短震；适配值20毫秒、最短间隔100毫秒，限制密集反馈。 */
    static impact(): boolean {
        if (!GameSettings.current.snapshot.vibrate || !this.supported) return false;
        const now = Date.now();
        if (now < this.longUntil || now - this.previous < 100) return false;
        try {
            const accepted = this.adapter ? this.adapter(20) : navigator.vibrate(20);
            if (accepted) this.previous = now;
            return accepted;
        } catch { return false; }
    }
    /** 摇晃成功时长震400毫秒，与 TikTok 官方长震时长一致；遵循震动开关。 @param restart 摇晃每周0.35秒主动续震，允许替换尚未结束的400毫秒长震。 */
    static longImpact(restart = false): boolean {
        if (!GameSettings.current.snapshot.vibrate || !this.supported) return false;
        const now = Date.now();
        if (!restart && now < this.longUntil) return false;
        try {
            const accepted = this.adapter ? this.adapter(400) : navigator.vibrate(400);
            if (accepted) {
                this.previous = now;
                this.longUntil = now + 400;
            }
            return accepted;
        } catch { return false; }
    }}
