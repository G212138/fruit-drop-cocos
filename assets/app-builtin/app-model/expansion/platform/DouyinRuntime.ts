import { PlatformApi, PlatformRewardedAd } from './PlatformContracts';
/** 抖音激励视频支持显式预加载。 */
export interface DouyinRewardedAd extends PlatformRewardedAd {
    /** 在展示前加载广告，失败不得发奖。 */
    load(): Promise<void>;
}
/** 抖音宿主子集；独立检测，不给全局对象创建别名。 */
export interface DouyinGameApi extends Omit<PlatformApi, 'createRewardedVideoAd'> {
    /** 启动加速度监听；不指定宿主未明确支持的采样间隔。 */
    startAccelerometer?(options: { success: () => void; fail: () => void }): void;
    /** 停止加速度监听。 */
    stopAccelerometer?(options: Record<string, unknown>): void;
    /** 注册三轴加速度回调。 */
    onAccelerometerChange?(callback: (value: { x: number; y: number; z: number }) => void): void;
    /** 仅注销自己的三轴回调。 */
    offAccelerometerChange?(callback: (value: { x: number; y: number; z: number }) => void): void;
    /** 静默登录允许匿名凭证，不伪造业务用户身份。 */
    login?(options: { force: boolean; success: (result: { code?: string; anonymousCode?: string }) => void; fail: () => void }): void;
    /** 获取宿主激励视频实例。 */
    createRewardedVideoAd?(options: { adUnitId: string }): DouyinRewardedAd;
}
/** 抖音由宿主注入tt，微信接口不会在此使用。 */
declare const TTMinis: { game?: unknown } | undefined;
declare const tt: DouyinGameApi | undefined;
/** TikTok原生包可能同时有tt别名，必须优先识别TTMinis。 */
export function getDouyinGame(): DouyinGameApi | null {
    const tiktokHost = typeof TTMinis !== 'undefined' && !!TTMinis.game;
    return !tiktokHost && typeof tt !== 'undefined' ? tt : null;
}
