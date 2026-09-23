import { PlatformStorage } from './PlatformStorage';
/** 抖音两种任务独立于TikTok任务命名空间。 */
export type DouyinMission = 'profile' | 'shortcut';
/** 抖音奖励和领取标记原子保存至现有道具库存。 */
export class DouyinMissionRewards {
    /** 与道具消费共用库存，新增标记不会被道具消费覆盖。 */
    private static readonly key = 'fruit-drop.props.v1';
    /** 本地自然日；当前无账号后端，领取记录按设备保存。 */
    static day(): string {
        const now = new Date();
        return [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
    }
    /** 侧边栏每日一次，桌面添加终身一次。 */
    private static claimKey(mission: DouyinMission): string {
        return 'douyin:' + mission + (mission === 'profile' ? ':' + this.day() : '');
    }
    /** 查询当前周期是否已经领取；异常存档在发奖时严格拒绝。 */
    static claimed(mission: DouyinMission): boolean {
        try {
            const data = JSON.parse(PlatformStorage.getItem(this.key) || '{}');
            return Array.isArray(data.missionRewards) && data.missionRewards.includes(this.claimKey(mission));
        } catch { return false; }
    }
    /** 仅由已验证平台任务的服务调用，写入失败不增加库存。 */
    static grant(mission: DouyinMission): 'granted' | 'already' | 'failed' {
        try {
            const data = JSON.parse(PlatformStorage.getItem(this.key) || '{"eliminate":2,"shuffle":2}');
            if (!data || typeof data !== 'object' || Array.isArray(data)) return 'failed';
            const claims = Array.isArray(data.missionRewards) ? data.missionRewards : [];
            const key = this.claimKey(mission);
            if (claims.includes(key)) return 'already';
            const kind = mission === 'profile' ? 'shuffle' : 'eliminate';
            if (!Number.isSafeInteger(data[kind]) || data[kind] < 0 || data[kind] >= Number.MAX_SAFE_INTEGER) return 'failed';
            PlatformStorage.setItem(this.key, JSON.stringify({ ...data, [kind]: data[kind] + 1, missionRewards: [...claims, key] }));
            return 'granted';
        } catch { return 'failed'; }
    }
}
