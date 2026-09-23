import { PlatformAdapter } from './PlatformContracts';
import { getDouyinGame } from './DouyinRuntime';
/** 抖音独立策略，不启用闲置插屏和自动结算视频。 */
export const DouyinPlatform: PlatformAdapter = {
    kind: 'douyin',
    getApi: getDouyinGame,
    fixedLanguage: 'zh',
    automaticAds: { resultVideo: false, idleInterstitialId: '' },
};
