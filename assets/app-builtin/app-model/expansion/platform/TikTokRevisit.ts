import { getTikTokGame, supportsTikTok, TikTokGameApi } from './TikTokRuntime';

/** 官方两种回访任务，奖励数量交由业务规则决定。 */
export type TikTokMission = 'shortcut' | 'profile';
/** 任务结果；eligible 仅表示平台允许领取，业务仍需幂等保存奖励。 */
export type TikTokMissionResult = 'opened' | 'eligible' | 'not-eligible' | 'unavailable' | 'failed';

/** 回访任务平台接口；禁止把导航成功视作任务完成。 */
export class TikTokRevisit {
    /** @param loggedIn 当前是否持有有效业务会话。 @param runtime SDK 获取函数。 */
    constructor(private readonly loggedIn: () => boolean, private readonly runtime: () => TikTokGameApi | null = getTikTokGame) {}

    /** @param mission 用户主动选择的任务类型。 */
    open(mission: TikTokMission): Promise<TikTokMissionResult> {
        return this.call(mission, false);
    }

    /** @param mission 回到前台后或用户主动领取时查询的任务类型。 */
    check(mission: TikTokMission): Promise<TikTokMissionResult> {
        return this.call(mission, true);
    }

    /** @param mission 任务类型。 @param checking 是否查询奖励资格；本层不直接发奖。 */
    private call(mission: TikTokMission, checking: boolean): Promise<TikTokMissionResult> {
        const api = this.runtime();
        const name = checking
            ? (mission === 'shortcut' ? 'getShortcutMissionReward' : 'getEntranceMissionReward')
            : (mission === 'shortcut' ? 'addShortcut' : 'startEntranceMission');
        // 回访接口从 TikTok 41.0.0 起提供，必须显式通过官方能力检测。
        if (!this.loggedIn() || !api?.canIUse || !supportsTikTok(api, name)) return Promise.resolve('unavailable');
        return new Promise(resolve => {
            let settled = false;
            /** 单次接口等待最多 15 秒，不因回访任务卡住首页。 */
            const timer = setTimeout(() => finish('failed'), 15000);
            /** @param value 单次任务接口结果，重复或迟到回调不再通知业务。 */
            const finish = (value: TikTokMissionResult): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(value);
            };
            try {
                api[name]!({
                    success: (result: unknown) => finish(checking
                        ? (result && (result as { canReceiveReward?: boolean }).canReceiveReward === true ? 'eligible' : 'not-eligible') : 'opened'),
                    fail: () => finish('failed'),
                });
            } catch { finish('failed'); }
        });
    }
}
