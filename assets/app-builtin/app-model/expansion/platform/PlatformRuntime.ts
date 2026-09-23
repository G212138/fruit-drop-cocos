import { PlatformAdapter, PlatformApi } from './PlatformContracts';
import { TikTokPlatform } from './TikTokPlatform';
import { DouyinPlatform } from './DouyinPlatform';
import { BrowserPlatform } from './BrowserPlatform';
export type { PlatformApi } from './PlatformContracts';
export { supportsPlatform } from './PlatformContracts';
/** 已注册的平台标识。 */
export type PlatformKind = PlatformAdapter['kind'];
/** 唯一宿主选择入口；TikTok优先，兼容其原生包中的tt别名。 */
export function currentPlatform(): PlatformAdapter {
    if (TikTokPlatform.getApi()) return TikTokPlatform;
    if (DouyinPlatform.getApi()) return DouyinPlatform;
    return BrowserPlatform;
}
/** 返回当前平台，不在页面中判断SDK全局对象。 */
export function platformKind(): PlatformKind { return currentPlatform().kind; }
/** 页面使用的公共宿主能力。 */
export function getPlatformGame(): PlatformApi | null { return currentPlatform().getApi(); }
/** 闲置广告入口读取各平台自己的策略。 */
export function platformInterstitialId(): string { return currentPlatform().automaticAds.idleInterstitialId; }
/** 结算流程只询问能力，平台名单由注册层维护。 */
export function allowsAutomaticResultVideo(): boolean { return currentPlatform().automaticAds.resultVideo; }
