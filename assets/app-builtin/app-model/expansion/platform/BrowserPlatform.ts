import { PlatformAdapter } from './PlatformContracts';
/** 浏览器只使用本地体验，不借用任何平台SDK或真实广告。 */
export const BrowserPlatform: PlatformAdapter = {
    kind: 'browser',
    automaticAds: { resultVideo: false, idleInterstitialId: '' },
    /** 浏览器没有小游戏宿主。 */
    getApi(): null { return null; },
};
