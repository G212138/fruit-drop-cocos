import { TikTokRewardProvider } from './TikTokRewardProvider';
import { DouyinRewardProvider } from './DouyinRewardProvider';
import { platformKind } from './PlatformRuntime';
/** 按宿主选择独立广告实例，业务奖励判定仍由RewardGate负责。 */
export class PlatformRewards {
    /** 返回当前平台的全局广告门禁。 */
    static get shared(): TikTokRewardProvider | DouyinRewardProvider {
        return platformKind() === 'douyin' ? DouyinRewardProvider.shared : TikTokRewardProvider.shared;
    }
}
