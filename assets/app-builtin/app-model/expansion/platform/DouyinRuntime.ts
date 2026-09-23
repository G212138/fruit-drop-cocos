import { PlatformApi, PlatformRewardedAd } from './PlatformContracts';
/** 抖音激励视频支持显式预加载。 */
export interface DouyinRewardedAd extends PlatformRewardedAd {
    /** 在展示前加载广告，失败不得发奖。 */
    load(): Promise<void>;
}
/** 抖音宿主子集；独立检测，不给全局对象创建别名。 */
export interface DouyinGameApi extends Omit<PlatformApi, 'createRewardedVideoAd' | 'onShow' | 'offShow'> {
    /** 最新前台入口参数用于侧边栏资格验证。 */
    onShow?(callback: (options?: DouyinLaunchOptions) => void): void;
    /** 注销当前监听，不影响其他平台服务。 */
    offShow?(callback: (options?: DouyinLaunchOptions) => void): void;
    /** 冷启动来源，仅在启动监听尚未收到事件时读取。 */
    getLaunchOptionsSync?(): DouyinLaunchOptions;
    /** 桌面能力按实际系统与宿主屏蔽。 */
    getSystemInfoSync?(): { platform?: string; appName?: string };
    /** 官方侧边栏能力探测，isExist严格为true才展示。 */
    checkScene?(options: { scene: 'sidebar'; success: (result: { isExist?: boolean }) => void; fail: () => void }): void;
    /** 用户点击后进入侧边栏，不代表获得奖励资格。 */
    navigateToScene?(options: { scene: 'sidebar'; success: () => void; fail: () => void }): void;
    /** 必须在用户点击的同步调用链里执行。 */
    addShortcut?(options: { success: () => void; fail: () => void }): void;
    /** 仅Android支持，查询真实桌面添加状态。 */
    checkShortcut?(options: { success: (result: { status?: { exist?: boolean; needUpdate?: boolean } }) => void; fail: () => void }): void;
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

/** 官方入口参数，只保留任务所需字段。 */
export interface DouyinLaunchOptions {
    /** 首页侧边栏返回homepage。 */
    launch_from?: string;
    /** 首页侧边栏返回sidebar_card。 */
    location?: string;
    /** 宿主场景值，不单独作为领奖依据。 */
    scene?: string;
}
