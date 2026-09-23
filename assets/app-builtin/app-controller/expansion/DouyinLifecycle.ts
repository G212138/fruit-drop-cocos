import { game } from 'cc';
import { GameHaptics } from './GameHaptics';
import { getDouyinGame } from '../../app-model/expansion/platform/DouyinRuntime';
import { supportsPlatform } from '../../app-model/expansion/platform/PlatformContracts';
import { DouyinRewardProvider } from '../../app-model/expansion/platform/DouyinRewardProvider';

/** 连接抖音 宿主生命周期与 Cocos 主循环，整个进程只注册一次。 */
export class DouyinLifecycle {
    /** 宿主事件是否已经连接。 */
    private static installed = false;
    /** 仅恢复由本适配器暂停的主循环，保留其他业务暂停状态。 */
    private static pausedHere = false;
    /** 宿主是否处于后台；与广告占用分别记录，避免错误恢复。 */
    private static hidden = false;
    /** 原生广告是否占用全屏。 */
    private static adVisible = false;
    /** 独立记录插屏，避免覆盖激励广告暂停状态。 */
    private static interstitialVisible = false;
    /** 后台或任意广告占用时禁止闲置展示。 */
    static get blocked(): boolean {
        return this.hidden || this.adVisible || this.interstitialVisible;
    }
    /** 同步插屏暂停状态和激励广告互斥。 */
    static setInterstitialVisible(visible: boolean): void {
        this.interstitialVisible = visible;
        DouyinRewardProvider.shared.interstitialBusy = visible;
        this.applyPause();
    }
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
        if (this.blocked) {
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
        const api = getDouyinGame();
        if (!api || this.installed) return;
        DouyinRewardProvider.shared.setActivityListener(visible => {
            this.adVisible = visible;
            this.applyPause();
        });
        if (supportsPlatform(api, 'onHide') && supportsPlatform(api, 'onShow')) {
            try {
                api.onHide!(this.hide);
                api.onShow!(this.show);
                this.installed = true;
            } catch {
                try { api.offHide?.(this.hide); } catch { /* 不影响启动。 */ }
                try { api.offShow?.(this.show); } catch { /* 不影响启动。 */ }
            }
        }
        if (supportsPlatform(api, 'vibrateShort') || supportsPlatform(api, 'vibrateLong')) {
            GameHaptics.register(milliseconds => {
                if (milliseconds >= 400) {
                    if (!supportsPlatform(api, 'vibrateLong')) return false;
                    api.vibrateLong!({ success: () => {}, fail: () => {} });
                    return true;
                }
                if (!supportsPlatform(api, 'vibrateShort')) return false;
                api.vibrateShort!({ success: () => {}, fail: () => {} });
                return true;
            });
        }
    }

}
