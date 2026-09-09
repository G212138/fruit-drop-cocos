import { sys } from 'cc';
import { PropKind } from './PropRules';
import { PlatformStorage } from '../../../../../../../app-builtin/app-model/expansion/platform/PlatformStorage';

/** 独立道具库存；成功执行才扣次数，不与关卡进度或广告SDK混在一起。 */
export class PropInventory {
    /** 新玩家每种2次，来自原版dataManager；采用独立存档键。 */
    private counts: Record<PropKind, number> = { shuffle: 2, eliminate: 2 };
    /** 独立版本化存档键，避免与旧项目存档冲突。 */
    private readonly key = 'fruit-drop.props.v1';
    /** 与回访任务奖励共用的幂等记录；改变库存时必须保留。 */
    private missionRewards: string[] = [];

    /** 读取并校验库存；坏档按零次处理，防止重新发放初始库存。 */
    constructor() {
        this.refresh();
    }
    /** 进入游戏或改变库存前刷新，接收首页领取的回访奖励。 */
    refresh(): void {
        try {
            const saved = PlatformStorage.getItem(this.key);
            if (saved) {
                const data = JSON.parse(saved);
                this.missionRewards = Array.isArray(data.missionRewards) ? data.missionRewards : [];
                for (const kind of ['shuffle','eliminate'] as PropKind[]) {
                    this.counts[kind] = Number.isSafeInteger(data[kind]) && data[kind] >= 0 ? data[kind] : 0;
                }
            }
        } catch { this.counts = { shuffle: 0, eliminate: 0 }; }
    }
    /** @param kind 道具类型；返回剩余次数，单位次。 */
    count(kind: PropKind): number {
        return this.counts[kind];
    }
    /** @param kind 已经确定可执行的道具；存档成功才允许后续执行。 */
    consume(kind: PropKind): boolean {
        if (this.counts[kind] < 1) return false;
        return this.change(kind, -1);
    }
    /** @param kind 已经校验成功的奖励类型；每次奖励增加1次，接平台前仍需业务门禁校验。 */
    grant(kind: PropKind): boolean {
        return this.change(kind, 1);
    }
    /** @param kind 道具类型。 @param delta 次数变化；写入失败不改变内存库存。 */
    private change(kind: PropKind, delta: number): boolean {
        this.refresh();
        if (this.counts[kind] + delta < 0 || !Number.isSafeInteger(this.counts[kind] + delta)) return false;
        const next = { ...this.counts, [kind]: this.counts[kind] + delta };
        try { PlatformStorage.setItem(this.key, JSON.stringify({ ...next, missionRewards: this.missionRewards })); }
        catch { return false; }
        this.counts = next;
        return true;
    }
}
