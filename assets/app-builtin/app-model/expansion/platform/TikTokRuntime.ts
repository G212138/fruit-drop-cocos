/** TikTok 官方回调参数；业务不依赖抖音 tt 命名空间。 */
export interface TikTokCallbacks<T> {
    /** 接口成功回调。 */
    success: (result: T) => void;
    /** 接口失败回调，不输出凭据。 */
    fail: (error?: unknown) => void;
}

/** 官方激励广告实例，每次展示创建新实例。 */
export interface TikTokRewardedAd {
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
export interface TikTokGameApi {
    /** 检查当前客户端支持的 API。 */
    canIUse?(schema: string): boolean;
    /** 根据后台广告位创建激励实例。 */
    createRewardedVideoAd?(options: { adUnitId: string }): TikTokRewardedAd;
    /** 获取临时登录码，必须由自有后端换取身份。 */
    login?(options: TikTokCallbacks<{ code: string }>): void;
    /** 引导添加桌面；成功回调不等于获得任务奖励。 */
    addShortcut?(options: TikTokCallbacks<void>): void;
    /** 查询桌面任务奖励资格。 */
    getShortcutMissionReward?(options: TikTokCallbacks<{ canReceiveReward: boolean }>): void;
    /** 引导用户从个人主页回访小游戏。 */
    startEntranceMission?(options: TikTokCallbacks<void>): void;
    /** 查询个人主页回访奖励资格。 */
    getEntranceMissionReward?(options: TikTokCallbacks<{ canReceiveReward: boolean }>): void;
    /** 向宿主报告加载进度，范围为 0 到 1。 */
    setLoadingProgress?(options: TikTokCallbacks<void> & { progress: number }): void;
    /** 读取宿主本地存档，不存在时返回空值。 */
    getStorageSync?(key: string): unknown;
    /** 同步写入宿主本地存档；失败时抛出异常。 */
    setStorageSync?(key: string, value: string): void;
    /** 向自有 HTTPS 后端请求；网络成功仍需检查 HTTP 状态和业务数据。 */
    request?(options: TikTokCallbacks<{ statusCode: number; data: unknown }> & {
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
    vibrateShort?(options: TikTokCallbacks<void>): void;
    /** 官方长震，固定400毫秒。 */
    vibrateLong?(options: TikTokCallbacks<void>): void;
}

/** 原生运行时由宿主注入；HTML 运行时需在启动引擎前初始化官方 SDK。 */
declare const TTMinis: { game?: TikTokGameApi } | undefined;

/** 获取 TikTok 小游戏 SDK；普通浏览器没有该对象时返回 null。 */
export function getTikTokGame(): TikTokGameApi | null {
    return typeof TTMinis !== 'undefined' && TTMinis.game ? TTMinis.game : null;
}

/** @param api 当前 SDK。 @param name 官方能力名称；SDK 抛错也按不可用处理。 */
export function supportsTikTok(api: TikTokGameApi | null, name: keyof TikTokGameApi): boolean {
    try {
        return !!api && typeof api[name] === 'function' && (!api.canIUse || api.canIUse(name));
    } catch {
        return false;
    }
}
