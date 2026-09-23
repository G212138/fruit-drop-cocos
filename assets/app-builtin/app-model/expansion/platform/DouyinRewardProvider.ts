import { RewardProvider, RewardRequest, RewardResponse } from '../RewardGate';
import { DouyinConfig } from './DouyinConfig';
import { getDouyinGame, DouyinGameApi, DouyinRewardedAd } from './DouyinRuntime';
import { supportsPlatform } from './PlatformContracts';

/** 真实激励广告边界；不直接修改库存、复活状态或关卡进度。 */
export class DouyinRewardProvider implements RewardProvider {
    /** 全游戏共享实例，防止不同页面同时请求原生全屏广告。 */
    static readonly shared = new DouyinRewardProvider();
    /** 正在播放的广告锁，页面重开也不允许再叠加广告。 */
    private busy = false;
    /** 插屏占用时禁止另开激励广告。 */
    interstitialBusy = false;
    /** 全屏广告状态通知，用于暂停和恢复游戏；不参与发奖判断。 */
    private activity: ((visible: boolean) => void) | null = null;

    /** @param runtime SDK 获取函数，测试时可注入官方接口替身。 */
    constructor(private readonly runtime: () => DouyinGameApi | null = getDouyinGame) {}

    /** @param listener 全屏广告占用状态监听，启动阶段连接引擎生命周期。 */
    setActivityListener(listener: (visible: boolean) => void): void {
        this.activity = listener;
    }

    /** @param visible 是否正在等待或播放原生广告；表现回调失败不能阻塞业务结算。 */
    private notifyActivity(visible: boolean): void {
        try { this.activity?.(visible); } catch { /* 广告结算必须继续。 */ }
    }

    /** @param request 含具体道具用途的请求；关闭、异常和迟到回调仅结算一次。 */
    show(request: RewardRequest): Promise<RewardResponse> {
        const api = this.runtime();
        const adUnitId = DouyinConfig.rewardedAds[request.placement];
        if (request.placement === 'result-video' || this.busy || this.interstitialBusy || !adUnitId || !supportsPlatform(api, 'createRewardedVideoAd')) {
            return Promise.resolve({ ...request, status: 'unavailable', source: 'platform' });
        }
        this.busy = true;
        this.notifyActivity(true);
        return new Promise(resolve => {
            let ad: DouyinRewardedAd | null = null;
            let settled = false;
            /** 适配超时为 180 秒，避免 SDK 永不回调锁死；超时绝不发奖。 */
            const timer = setTimeout(() => finish('failed'), 180000);
            /** @param status 广告真实结果；先解除回调再通知业务。 */
            const finish = (status: RewardResponse['status']): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                try { ad?.offClose(close); } catch { /* 宿主清理失败不能改变奖励结果。 */ }
                try { ad?.offError(error); } catch { /* 保证业务请求最终结束。 */ }
                this.busy = false;
                this.notifyActivity(false);
                resolve({ ...request, status, source: 'platform' });
            };
            /** @param result 只接受官方明确完成标识，空结果按取消处理。 */
            const close = (result: { isEnded: boolean }): void => {
                finish(result?.isEnded === true ? 'completed' : 'cancelled');
            };
            /** 加载或展示失败，不发放奖励。 */
            const error = (): void => { finish('failed'); };
            try {
                ad = api!.createRewardedVideoAd!({ adUnitId });
                ad.onClose(close);
                ad.onError(error);
                const currentAd = ad;
                Promise.resolve(currentAd.load()).then(() => {
                    if (!settled) return currentAd.show();
                }).catch(error);
            } catch {
                error();
            }
        });
    }
}
