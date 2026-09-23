import { RewardPlacement } from '../RewardGate';
/** 抖音独立公开配置；空值禁用对应能力，禁止借用TikTok广告位。 */
export const DouyinConfig = {
    /** 抖音小游戏App ID，用户已提供。 */
    appId: 'ttaf1dd9a03178d36c02',
    /** 按业务用途配置抖音激励广告位。 */
    rewardedAds: {
        /** 消除道具。 */
        eliminate: 'cp6350pxhrern4ilol',
        /** 打乱道具。 */
        shuffle: '27h3itvao6n9k5gp91',
        /** 失败复活。 */
        revive: 'lbl62dkgjc06toodvj',
        /** 扩容槽位。 */
        'expand-slot': 'hedie4d8ik78dg7k8i',
        /** 解锁主题。 */
        'terrain-unlock': '5fmgf2m14bf4p0k3mg',
    } as Partial<Record<RewardPlacement, string>>,
};
