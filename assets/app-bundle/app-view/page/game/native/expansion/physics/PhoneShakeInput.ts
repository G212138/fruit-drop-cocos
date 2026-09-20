import { EventAcceleration, game, Game, input, Input, sys } from 'cc';
import { getTikTokGame } from '../../../../../../../app-builtin/app-model/expansion/platform/TikTokRuntime';
import { ShakeGesture } from './ShakeGesture';

/** 手机摇晃输入边界；能力缺失时保留按钮，退出页面和后台时解除传感器。 */
export class PhoneShakeInput {
    /** 独立手势识别器，暂停时不积累样本。 */
    private readonly gesture = new ShakeGesture();
    /** 当前页面允许处理传感器的条件。 */
    private allowed: (() => boolean) | null = null;
    /** 识别后仅排队意图，不在传感器回调中改变物理。 */
    private requested: (() => void) | null = null;
    /** 是否已由本实例打开传感器监听。 */
    private listening = false;
    /** 当前宿主采样的清理函数；只解除自己的回调。 */
    private cleanup: (() => void) | null = null;
    /** 生命周期代次，忽略退出页面后的异步回调。 */
    private generation = 0;
    /** 传感器触发冷却截止时间，适配为1600毫秒。 */
    private nextShakeAt = 0;

    /** @param allowed 当前页面可操作条件。 @param requested 有效摇晃时排队的回调。 */
    start(allowed: () => boolean, requested: () => void): void {
        this.stop();
        this.allowed = allowed;
        this.requested = requested;
        game.on(Game.EVENT_HIDE, this.suspend, this);
        game.on(Game.EVENT_SHOW, this.resume, this);
        this.resume();
    }

    /** 只启用真实可用的加速度接口；不把其他平台的 API 当作 TikTok 必备能力。 */
    private resume(): void {
        if (!this.allowed || this.listening) return;
        const host = getTikTokGame() as unknown as Record<string, unknown> | null;
        const tt = (globalThis as any).tt;
        const hosts = [...new Set([host, tt].filter(Boolean))];
        if (hosts.length) {
            const candidates = hosts.flatMap(api => ['Accelerometer', 'Gyroscope'].map(kind => ({ api, kind })))
                .filter(({ api, kind }) => [`start${kind}`, `stop${kind}`, `on${kind}Change`, `off${kind}Change`]
                    .every(name => typeof api[name] === 'function'));
            this.tryHost(candidates, ++this.generation);
            return;
        }
        if (!sys.isMobile) return;
        this.gesture.reset();
        try {
            input.on(Input.EventType.DEVICEMOTION, this.onMotion, this);
            this.listening = true;
            input.setAccelerometerEnabled(true);
        } catch {
            this.suspend();
        }
    }

    /** 依次尝试宿主实际暴露的接口；失败仅降级，不假定海外端支持抖音 API。 */
    private tryHost(candidates: Array<{ api: any; kind: string }>, generation: number): void {
        if (generation !== this.generation || !this.allowed) return;
        const candidate = candidates.shift();
        if (!candidate) {
            console.warn('[PhoneShake] 无可用传感器接口，请使用晃一晃按钮');
            return;
        }
        const { api, kind } = candidate;
        let active = true;
        let received = false;
        let peak: { x: number; y: number; z: number; time: number } | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const callback = (sample: { x: number; y: number; z: number }) => {
            if (!active || generation !== this.generation) return;
            if (![sample.x, sample.y, sample.z].every(Number.isFinite)) return;
            if (!received) {
                received = true;
                clearTimeout(timer);
                console.info(`[PhoneShake] ${kind} 已收到真实传感器数据`);
            }
            const now = Date.now();
            if (game.isPaused() || !this.allowed?.() || now < this.nextShakeAt) {
                this.gesture.reset();
                peak = null;
                return;
            }
            if (kind === 'Accelerometer') {
                if (this.gesture.accept(sample, now)) this.trigger(now);
                return;
            }
            // 陀螺仪适配阈值2.5 rad/s，60至500毫秒内反向旋转才判为摇晃。
            if (Math.hypot(sample.x, sample.y, sample.z) < 2.5) return;
            if (peak && now - peak.time >= 60 && now - peak.time <= 500
                && sample.x * peak.x + sample.y * peak.y + sample.z * peak.z < 0) {
                this.trigger(now);
                peak = null;
            } else if (!peak || now - peak.time > 500) peak = { ...sample, time: now };
        };
        const cleanup = () => {
            active = false;
            clearTimeout(timer);
            try { api[`off${kind}Change`](callback); } catch { /* 清理失败仍禁用本地回调。 */ }
            try { api[`stop${kind}`]({}); } catch { /* 宿主可能不支持停止。 */ }
        };
        const failed = (error: unknown) => {
            if (!active || generation !== this.generation) return;
            console.warn(`[PhoneShake] ${kind} 不可用`, error);
            cleanup();
            this.cleanup = null;
            this.listening = false;
            this.gesture.reset();
            this.tryHost(candidates, generation);
        };
        this.cleanup = cleanup;
        this.listening = true;
        this.gesture.reset();
        // 适配超时3000毫秒；接口存在但不回传数据时尝试下一候选。
        timer = setTimeout(() => failed('启动后未收到数据'), 3000);
        try {
            api[`on${kind}Change`](callback);
            api[`start${kind}`]({ interval: kind === 'Gyroscope' ? 100 : 'game', fail: failed });
        } catch (error) { failed(error); }
    }

    /** @param now 当前毫秒时间；将真实摇晃转为现有按钮共用的请求。 */
    private trigger(now: number): void {
        if (now < this.nextShakeAt) return;
        this.nextShakeAt = now + 1600;
        this.requested?.();
    }

    /** @param event 引擎归一化加速度事件，三轴单位 g。 */
    private onMotion(event: EventAcceleration): void {
        if (game.isPaused() || !this.allowed?.()) {
            this.gesture.reset();
            return;
        }
        if (this.gesture.accept(event.acc, Date.now())) this.trigger(Date.now());
    }

    /** 进入后台时停止采样并丢弃未完成的摇晃。 */
    private suspend(): void {
        ++this.generation;
        this.gesture.reset();
        if (this.cleanup) {
            this.cleanup();
            this.cleanup = null;
            this.listening = false;
        }
        input.off(Input.EventType.DEVICEMOTION, this.onMotion, this);
        if (!this.listening) return;
        this.listening = false;
        try { input.setAccelerometerEnabled(false); } catch { /* 不支持关闭时仍解除本页面监听。 */ }
    }

    /** 隐藏、销毁或重开页面时解除全部监听。 */
    stop(): void {
        this.suspend();
        game.off(Game.EVENT_HIDE, this.suspend, this);
        game.off(Game.EVENT_SHOW, this.resume, this);
        this.allowed = null;
        this.requested = null;
    }
}
