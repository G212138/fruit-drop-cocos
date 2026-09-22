import { TikTokStartup } from './TikTokStartup';
import { DouyinLifecycle } from './DouyinLifecycle';
import { IdleInterstitial } from './IdleInterstitial';
import { DouyinSilentLogin } from '../../app-model/expansion/platform/DouyinSilentLogin';
import { platformKind } from '../../app-model/expansion/platform/PlatformRuntime';
/** 多平台启动入口，不从AppInit静态依赖业务分包。 */
export class PlatformStartup {
    /** TikTok保留原启动链，抖音使用独立生命周期和静默登录。 */
    static enter(): void {
        if (platformKind() === 'douyin') {
            DouyinLifecycle.install();
            IdleInterstitial.install();
            void DouyinSilentLogin.shared.login();
            return;
        }
        TikTokStartup.enter();
    }
}
