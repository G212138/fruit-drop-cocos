import { IdleInterstitial } from './IdleInterstitial';
import { TikTokSilentLogin } from '../../app-model/expansion/platform/TikTokSilentLogin';
import { TikTokLifecycle } from './TikTokLifecycle';
import { TikTokConfig } from '../../app-model/expansion/platform/TikTokConfig';
import { TikTokLogin } from '../../app-model/expansion/platform/TikTokLogin';
import { TikTokLoginBackend } from '../../app-model/expansion/platform/TikTokLoginBackend';

/** 业务分包就绪后连接 TikTok；禁止从 AppInit 静态引用本模块。 */
export class TikTokStartup {
    /** 从首页或直接进入关卡时调用；生命周期与登录各自保证重复调用安全。 */
    static enter(): void {
        TikTokLifecycle.install();
        IdleInterstitial.install();
        void TikTokSilentLogin.shared.login();
        if (TikTokConfig.loginEndpoint) {
            TikTokLogin.shared.configure(TikTokLoginBackend.exchange);
            void TikTokLogin.shared.login();
        }
    }
}
