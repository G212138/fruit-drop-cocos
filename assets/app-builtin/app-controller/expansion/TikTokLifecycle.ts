import { game } from 'cc';
import { GameHaptics } from './GameHaptics';
import { getTikTokGame, supportsTikTok } from '../../app-model/expansion/platform/TikTokRuntime';
import { TikTokRewardProvider } from '../../app-model/expansion/platform/TikTokRewardProvider';

/** 连接 TikTok 宿主生命周期与 Cocos 主循环，整个进程只注册一次。 */
export class TikTokLifecycle {
    /** 宿主事件是否已经连接。 */
    private static installed = false;
    /** 仅恢复由本适配器暂停的主循环，保留其他业务暂停状态。 */
    private static pausedHere = false;
    /** 宿主是否处于后台；与广告占用分别记录，避免错误恢复。 */
    private static hidden = false;
    /** 原生广告是否占用全屏。 */
    private static adVisible = false;
    /** 后台通知的稳定引用。 */
    private static readonly hide = (): void => {
        this.hidden = true;
        this.applyPause();
    };
    /** 前台通知的稳定引用。 */
    private static readonly show = (): void => {
        this.hidden = false;
        this.applyPause();
    };

    /** 汇总后台和广告占用，只有两者都结束后才恢复本适配器暂停的游戏。 */
    private static applyPause(): void {
        if (this.hidden || this.adVisible) {
            if (!game.isPaused()) {
                this.pausedHere = true;
                game.pause();
            }
        } else if (this.pausedHere) {
            this.pausedHere = false;
            game.resume();
        }
    }

    /** 启动时连接真实宿主；普通浏览器完全沿用原有行为。 */
    static install(): void {
        const api = getTikTokGame();
        if (!api || this.installed) return;
        TikTokRewardProvider.shared.setActivityListener(visible => {
            this.adVisible = visible;
            this.applyPause();
        });
        if (supportsTikTok(api, 'onHide') && supportsTikTok(api, 'onShow')) {
            try {
                api.onHide!(this.hide);
                api.onShow!(this.show);
                this.installed = true;
            } catch {
                try { api.offHide?.(this.hide); } catch { /* 不影响启动。 */ }
                try { api.offShow?.(this.show); } catch { /* 不影响启动。 */ }
            }
        }
        if (supportsTikTok(api, 'vibrateShort') || supportsTikTok(api, 'vibrateLong')) {
            GameHaptics.register(milliseconds => {
                if (milliseconds >= 400) {
                    if (!supportsTikTok(api, 'vibrateLong')) return false;
                    api.vibrateLong!({ success: () => {}, fail: () => {} });
                    return true;
                }
                if (!supportsTikTok(api, 'vibrateShort')) return false;
                api.vibrateShort!({ success: () => {}, fail: () => {} });
                return true;
            });
        }
    }

    /** @param progress 已完成资源加载比例，范围 0 到 1；不支持时忽略。 */
    static loading(progress: number): void {
        const api = getTikTokGame();
        if (!supportsTikTok(api, 'setLoadingProgress')) return;
        try {
            api!.setLoadingProgress!({ progress: Math.max(0, Math.min(1, progress)), success: () => {}, fail: () => {} });
        } catch { /* 宿主进度上报失败不阻塞游戏资源加载。 */ }
    }
}
