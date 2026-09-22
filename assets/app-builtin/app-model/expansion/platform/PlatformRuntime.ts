import { getTikTokGame, supportsTikTok, TikTokGameApi } from './TikTokRuntime';
import { getDouyinGame } from './DouyinRuntime';
import { TikTokConfig } from './TikTokConfig';
import { DouyinConfig } from './DouyinConfig';
/** 已接入平台；微信后续以独立适配器加入。 */
export type PlatformKind = 'tiktok' | 'douyin' | 'browser';
/** 根据真实宿主路由，TikTok优先以兼容其tt别名。 */
export function platformKind(): PlatformKind {
    return getTikTokGame() ? 'tiktok' : getDouyinGame() ? 'douyin' : 'browser';
}
/** 页面使用的共有接口，不包含平台任务与登录差异。 */
export type PlatformApi = Omit<TikTokGameApi, 'login' | 'addShortcut' | 'getShortcutMissionReward' | 'startEntranceMission' | 'getEntranceMissionReward'>;
/** 获取共有SDK，不修改或桥接宿主命名空间。 */
export function getPlatformGame(): PlatformApi | null {
    return getTikTokGame() || getDouyinGame();
}
/** @param api 当前平台。 @param name 能力名；版本不支持时安全降级。 */
export function supportsPlatform(api: PlatformApi | null, name: keyof PlatformApi): boolean {
    return supportsTikTok(api, name);
}
/** 获取当前平台独立广告配置，浏览器不连接任何真实广告位。 */
export function platformInterstitialId(): string {
    return platformKind() === 'tiktok' ? TikTokConfig.idleInterstitialAd
        : platformKind() === 'douyin' ? DouyinConfig.idleInterstitialAd : '';
}
