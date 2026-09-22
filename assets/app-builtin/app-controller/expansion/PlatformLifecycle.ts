import { TikTokLifecycle } from './TikTokLifecycle';
import { DouyinLifecycle } from './DouyinLifecycle';
import { platformKind } from '../../app-model/expansion/platform/PlatformRuntime';
/** 闲置广告使用当前宿主的暂停与互斥状态。 */
export class PlatformLifecycle {
    /** 当前平台的生命周期实现。 */
    private static get current(): typeof TikTokLifecycle | typeof DouyinLifecycle {
        return platformKind() === 'douyin' ? DouyinLifecycle : TikTokLifecycle;
    }
    /** 后台或全屏广告是否正在占用。 */
    static get blocked(): boolean { return this.current.blocked; }
    /** @param visible 插屏是否占用全屏。 */
    static setInterstitialVisible(visible: boolean): void { this.current.setInterstitialVisible(visible); }
}
