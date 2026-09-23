/** 平台共用回调契约，不绑定任何宿主。 */
export interface PlatformCallbacks<T> {
    /** 接口成功回调。 */
    success: (result: T) => void;
    /** 接口失败回调，不输出凭据。 */
    fail: (error?: unknown) => void;
}

/** 官方激励广告实例，每次展示创建新实例。 */
export interface PlatformRewardedAd {
    /** 展示成功仅说明打开广告，不代表用户完成观看。 */
    show(): Promise<void>;
    /** 注册关闭回调；只有 isEnded 严格为 true 才可发奖。 */
    onClose(callback: (result: { isEnded: boolean }) => void): void;
    /** 解除本次关闭监听。 */
    offClose(callback: (result: { isEnded: boolean }) => void): void;
    /** 注册播放错误监听。 */
    onError(callback: () => void): void;
    /** 解除本次错误监听。 */
    offError(callback: () => void): void;
}

/** 当前业务使用的官方 SDK 子集，未提供的能力必须降级。 */
export interface PlatformApi {
    /** 官方好友分享入口，仅打开联系人选择界面，不代表已发送消息。 */
    shareAppMessage?(options: PlatformCallbacks<void> & {
        /** 本地化分享标题。 */
        title: string;
        /** 不包含身份信息的关卡上下文。 */
        query: string;
    }): void;
    /** 检查当前客户端支持的 API。 */
    canIUse?(schema: string): boolean;
    /** 根据后台广告位创建激励实例。 */
    createRewardedVideoAd?(options: { adUnitId: string }): PlatformRewardedAd;
    /** 每次创建一个无奖励插屏实例。 */
    createInterstitialAd?(options: { adUnitId: string }): {
        show(): Promise<void>;
        onClose(callback: () => void): void;
        offClose(callback: () => void): void;
        onError(callback: () => void): void;
        offError(callback: () => void): void;
    };
    /** 向宿主报告加载进度，范围为 0 到 1。 */
    setLoadingProgress?(options: PlatformCallbacks<void> & { progress: number }): void;
    /** 读取宿主本地存档，不存在时返回空值。 */
    getStorageSync?(key: string): unknown;
    /** 同步写入宿主本地存档；失败时抛出异常。 */
    setStorageSync?(key: string, value: string): void;
    /** 向自有 HTTPS 后端请求；网络成功仍需检查 HTTP 状态和业务数据。 */
    request?(options: PlatformCallbacks<{ statusCode: number; data: unknown }> & {
        /** 自有后端地址。 */
        url: string;
        /** HTTP 请求方法。 */
        method: string;
        /** JSON 请求数据，不包含 Client Secret。 */
        data: object;
        /** 请求头。 */
        header: Record<string, string>;
        /** 超时毫秒数。 */
        timeout: number;
    }): { /** 终止当前网络请求。 */ abort(): void };
    /** 注册进入前台回调。 */
    onShow?(callback: () => void): void;
    /** 解除进入前台回调。 */
    offShow?(callback: () => void): void;
    /** 注册进入后台回调。 */
    onHide?(callback: () => void): void;
    /** 解除进入后台回调。 */
    offHide?(callback: () => void): void;
    /** 原生短震，时长由官方 SDK 固定为 15 毫秒。 */
    vibrateShort?(options: PlatformCallbacks<void>): void;
    /** 官方长震，固定400毫秒。 */
    vibrateLong?(options: PlatformCallbacks<void>): void;
}

/** 自动广告开关由平台实现明确声明，新增平台默认关闭。 */
export interface AutomaticAdPolicy {
    /** 是否允许结算时自动抽取激励视频。 */
    readonly resultVideo: boolean;
    /** 闲置插屏广告位；空值表示不启用。 */
    readonly idleInterstitialId: string;
}
/** 平台选择层只依赖此契约，不包含平台业务实现。 */
export interface PlatformAdapter {
    /** 稳定平台标识。 */
    readonly kind: 'tiktok' | 'douyin' | 'browser';
    /** 固定界面语言；空字符串表示允许用户选择。 */
    readonly fixedLanguage: 'zh' | '';
    /** 当前平台的自动广告策略。 */
    readonly automaticAds: AutomaticAdPolicy;
    /** 获取当前宿主，未运行在该平台时返回空。 */
    getApi(): PlatformApi | null;
}
/** @param api 当前宿主。 @param name 能力名称；检测异常视为不支持。 */
export function supportsPlatform(api: PlatformApi | null, name: keyof PlatformApi): boolean {
    try {
        return !!api && typeof api[name] === 'function' && (!api.canIUse || api.canIUse(name));
    } catch {
        return false;
    }
}
