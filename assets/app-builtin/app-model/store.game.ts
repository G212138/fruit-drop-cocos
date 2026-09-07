import { IStore } from 'db://app/base/BaseModel';

/** 单局权威状态，不保存节点、物理对象或资源引用。 */
export default class Game implements IStore<Game> {
    /** 当前关卡编号，从一开始。 */
    level = 1;
    /** 尚未消除水果数，单位个。 */
    remaining = 0;
    /** 开局总数，单位个，用于计算进度。 */
    total = 0;
    /** 单局阶段；已结束结果不被重复碰撞通知覆盖。 */
    phase: 'idle' | 'playing' | 'won' | 'lost' = 'idle';

    /** 开始一关，重置权威状态。 @param total 水果总数。 @param level 原关卡序号。 */
    begin(total: number, level = 1): void {
        if (!Number.isInteger(total) || total <= 0 || total % 2 !== 0) {
            throw new Error('总水果数必须为正偶数');
        }
        this.level = level;
        this.total = total;
        this.remaining = total;
        this.phase = 'playing';
    }

    /** 移除一对水果，耗尽时进入胜利状态。 */
    removePair(): void {
        if (this.phase !== 'playing') return;
        this.remaining = Math.max(0, this.remaining - 2);
        if (this.remaining === 0) {
            this.phase = 'won';
        }
    }

    /** 仅运行中的局可以失败，重复通知不覆盖已结束结果。 */
    lose(): void {
        if (this.phase === 'playing') {
            this.phase = 'lost';
        }
    }
}
