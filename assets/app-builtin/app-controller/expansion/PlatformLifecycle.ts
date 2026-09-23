import { TikTokLifecycle } from './TikTokLifecycle';
import { DouyinLifecycle } from './DouyinLifecycle';
import { platformKind } from '../../app-model/expansion/platform/PlatformRuntime';
/** 闲置广告的公共生命周期分发，不保存任一平台状态。 */
export class PlatformLifecycle {
    /** 后台或全屏广告是否正在占用；浏览器不借用其他平台状态。 */
    static get blocked(): boolean {
        switch (platformKind()) {
            case 'tiktok': return TikTokLifecycle.blocked;
            case 'douyin': return DouyinLifecycle.blocked;
            default: return false;
        }
    }
    /** @param visible 插屏是否占用全屏；仅TikTok支持自动插屏。 */
    static setInterstitialVisible(visible: boolean): void {
        if (platformKind() === 'tiktok') TikTokLifecycle.setInterstitialVisible(visible);
    }
}
