import { RewardProvider, RewardRequest, RewardResponse } from '../RewardGate';
import { TikTokRewardProvider } from './TikTokRewardProvider';
import { DouyinRewardProvider } from './DouyinRewardProvider';
import { platformKind } from './PlatformRuntime';
/** 浏览器没有真实广告，模拟广告仍由开发面板单独处理。 */
const unavailable: RewardProvider = {
    /** @param request 保留请求身份，不伪造广告完成。 */
    show(request: RewardRequest): Promise<RewardResponse> {
        return Promise.resolve({ ...request, status: 'unavailable', source: 'platform' });
    },
};
/** 广告分发只依赖业务契约，各平台自行管理SDK和互斥。 */
export class PlatformRewards {
    /** 返回当前平台的独立广告服务。 */
    static get shared(): RewardProvider {
        switch (platformKind()) {
            case 'tiktok': return TikTokRewardProvider.shared;
            case 'douyin': return DouyinRewardProvider.shared;
            default: return unavailable;
        }
    }
}
