import { PlatformAdapter } from './PlatformContracts';
import { getTikTokGame } from './TikTokRuntime';
import { TikTokConfig } from './TikTokConfig';
/** TikTok独立策略，保持现有自动广告行为。 */
export const TikTokPlatform: PlatformAdapter = {
    kind: 'tiktok',
    getApi: getTikTokGame,
    automaticAds: {
        resultVideo: true,
        /** 仅此平台启用30秒闲置插屏。 */
        get idleInterstitialId(): string { return TikTokConfig.idleInterstitialAd; },
    },
};
