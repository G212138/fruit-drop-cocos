import { RewardPlacement } from '../RewardGate';
/** 抖音独立公开配置；空值禁用对应能力，禁止借用TikTok广告位。 */
export const DouyinConfig = {
    /** 抖音小游戏App ID，用户已提供。 */
    appId: 'ttaf1dd9a03178d36c02',
    /** 按业务用途配置抖音激励广告位。 */
    rewardedAds: {
        eliminate: '', shuffle: '', revive: '', 'expand-slot': '',
        'terrain-unlock': '',
    } as Partial<Record<RewardPlacement, string>>,
};
