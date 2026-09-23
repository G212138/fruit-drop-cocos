import { TikTokStartup } from './TikTokStartup';
import { DouyinStartup } from './DouyinStartup';
import { platformKind } from '../../app-model/expansion/platform/PlatformRuntime';
/** 平台启动分发，只委托各自入口，不放平台业务。 */
export class PlatformStartup {
    /** 浏览器不运行小游戏平台启动逻辑。 */
    static enter(): void {
        switch (platformKind()) {
            case 'tiktok': TikTokStartup.enter(); break;
            case 'douyin': DouyinStartup.enter(); break;
        }
    }
}
