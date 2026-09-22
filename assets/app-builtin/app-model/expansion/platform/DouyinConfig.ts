import { RewardPlacement } from '../RewardGate';
/** 抖音独立公开配置；空值禁用对应能力，禁止借用TikTok广告位。 */
export const DouyinConfig = {
    /** 抖音小游戏App ID，用户后续提供。 */
    appId: '',
    /** 抖音闲置插屏广告位。 */
    idleInterstitialAd: '',
    /** 按业务用途配置抖音激励广告位。 */
    rewardedAds: {
        eliminate: '', shuffle: '', revive: '', 'expand-slot': '',
        'terrain-unlock': '', 'result-video': '', prop: '',
    } as Record<RewardPlacement, string>,
};
