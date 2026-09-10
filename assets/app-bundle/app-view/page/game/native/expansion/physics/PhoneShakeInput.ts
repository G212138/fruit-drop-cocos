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
        if (!this.allowed || this.listening || !sys.isMobile) return;
        const host = getTikTokGame() as unknown as Record<string, unknown> | null;
        if (host && ['startAccelerometer', 'stopAccelerometer', 'onAccelerometerChange', 'offAccelerometerChange']
            .some(name => typeof host[name] !== 'function')) return;
        this.gesture.reset();
        try {
            input.on(Input.EventType.DEVICEMOTION, this.onMotion, this);
            this.listening = true;
            input.setAccelerometerEnabled(true);
        } catch {
            this.suspend();
        }
    }

    /** @param event 引擎归一化加速度事件，三轴单位 g。 */
    private onMotion(event: EventAcceleration): void {
        if (game.isPaused() || !this.allowed?.()) {
            this.gesture.reset();
            return;
        }
        if (this.gesture.accept(event.acc, Date.now())) this.requested?.();
    }

    /** 进入后台时停止采样并丢弃未完成的摇晃。 */
    private suspend(): void {
        this.gesture.reset();
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
