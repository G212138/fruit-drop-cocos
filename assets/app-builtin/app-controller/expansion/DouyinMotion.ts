import { DouyinGameApi, getDouyinGame } from '../../app-model/expansion/platform/DouyinRuntime';

/** 仅抖音使用的手机摇晃输入，不直接操作棋盘或发放道具。 */
export class DouyinMotion {
    /** 当前拥有监听的宿主。 */
    private static api: DouyinGameApi | null = null;
    /** 页面当前允许摇晃时提供的业务入口。 */
    private static request: (() => void) | null = null;
    /** 启动接口尚未返回时禁止重复启动。 */
    private static starting = false;
    /** 本次运行传感器不可用时保留按钮，不逐帧重试。 */
    private static failed = false;
    /** 后台或广告期间由平台生命周期立即阻断。 */
    private static blocked = false;
    /** 上次采样以及明显加速度变化，数值单位为宿主加速度单位。 */
    private static previous: { x: number; y: number; z: number } | null = null;
    private static impulse: { x: number; y: number; z: number; time: number } | null = null;

    /** 与现有玩法可用状态同步，摇晃进行中仍然接收新的手机动作。 */
    static sync(enabled: boolean, request: () => void): void {
        if (!enabled || this.blocked) { this.stop(); return; }
        this.request = request;
        if (this.api || this.starting || this.failed) return;
        const api = getDouyinGame();
        if (!api?.startAccelerometer || !api.stopAccelerometer
            || !api.onAccelerometerChange || !api.offAccelerometerChange) return;
        this.api = api;
        this.starting = true;
        try {
            api.onAccelerometerChange(this.sample);
            api.startAccelerometer({
                success: () => {
                    this.starting = false;
                    if (this.api !== api || !this.request || this.blocked) this.stopApi(api);
                },
                fail: () => {
                    this.starting = false;
                    this.failed = true;
                    this.stop();
                },
            });
        } catch {
            this.starting = false;
            this.failed = true;
            this.stop();
        }
    }

    /** 平台广告及前后台变化即时生效，不依赖已暂停的游戏帧循环。 */
    static setBlocked(blocked: boolean): void {
        this.blocked = blocked;
        if (blocked) this.stop();
    }

    /** 采样差分过滤重力；650毫秒内两次反向明显变化才判定一次主动摇晃。 */
    private static readonly sample = (value: { x: number; y: number; z: number }): void => {
        if (!this.request || this.blocked || ![value.x, value.y, value.z].every(Number.isFinite)) return;
        const previous = this.previous;
        this.previous = { ...value };
        if (!previous) return;
        const delta = { x: value.x - previous.x, y: value.y - previous.y, z: value.z - previous.z };
        // 适配初值：变化幅值1.2，需在真机上结合手感验证，普通小幅手抖不触发。
        if (Math.hypot(delta.x, delta.y, delta.z) < 1.2) return;
        const time = Date.now(), impulse = this.impulse;
        if (impulse && time - impulse.time <= 650
            && delta.x * impulse.x + delta.y * impulse.y + delta.z * impulse.z < 0) {
            const request = this.request;
            this.impulse = null;
            request();
        } else this.impulse = { ...delta, time };
    };

    /** 离开游戏、暂停或执行摇晃后清理采样，不排队补发旧请求。 */
    static stop(): void {
        this.request = null;
        this.previous = null;
        this.impulse = null;
        const api = this.api;
        this.api = null;
        if (api) this.stopApi(api);
    }

    /** 清理自己的监听；宿主异常不影响按钮或游戏继续。 */
    private static stopApi(api: DouyinGameApi): void {
        try { api.offAccelerometerChange?.(this.sample); } catch { /* 兼容宿主退出。 */ }
        try { api.stopAccelerometer?.({}); } catch { /* 保留按钮入口。 */ }
    }
}
