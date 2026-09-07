import { IStore } from 'db://app/base/BaseModel';

/** 单局权威状态，不保存节点、物理对象或资源引用。 */
export default class Game implements IStore<Game> {
    remaining = 0;
    total = 0;
    phase: 'idle' | 'playing' | 'won' | 'lost' = 'idle';

    /** 开始验证关，重置权威状态。 */
    begin(total: number): void {
        if (!Number.isInteger(total) || total <= 0 || total % 2 !== 0) {
            throw new Error('总水果数必须为正偶数');
        }
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
