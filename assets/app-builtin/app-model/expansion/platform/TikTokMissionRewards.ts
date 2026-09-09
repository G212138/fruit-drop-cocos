import { PlatformStorage } from './PlatformStorage';
import { TikTokMission } from './TikTokRevisit';

/** 回访奖励落盘；库存和领取记录使用同一条存档，避免写入一半重复领奖。 */
export class TikTokMissionRewards {
    /** 与游戏道具库存共用原有存档键，不修改初始道具规则。 */
    private static readonly key = 'fruit-drop.props.v1';

    /** @param mission 平台确认有资格的任务。 @param playerId 后端确认的玩家标识，禁止用临时 code 代替。 */
    static grant(mission: TikTokMission, playerId: string): 'granted' | 'already' | 'failed' {
        if (!playerId) return 'failed';
        try {
            const raw = PlatformStorage.getItem(this.key);
            const saved = raw ? JSON.parse(raw) : { eliminate: 2, shuffle: 2 };
            if (!saved || typeof saved !== 'object') return 'failed';
            const claims: string[] = Array.isArray(saved.missionRewards) ? saved.missionRewards : [];
            const claim = playerId + ':' + mission;
            if (claims.indexOf(claim) >= 0) return 'already';
            // 适配奖励：每个任务每名玩家一次；桌面赠消除 1 次，主页回访赠刷新 1 次。
            const kind = mission === 'shortcut' ? 'eliminate' : 'shuffle';
            if (!Number.isSafeInteger(saved[kind]) || saved[kind] < 0 || saved[kind] >= Number.MAX_SAFE_INTEGER) return 'failed';
            PlatformStorage.setItem(this.key, JSON.stringify({ ...saved, [kind]: saved[kind] + 1, missionRewards: [...claims, claim] }));
            return 'granted';
        } catch { return 'failed'; }
    }
}
