import { canMatch, MatchCandidate } from './MatchRules';

/** 接触事件中的实体句柄，不依赖引擎节点类型。 */
export interface MatchEntity {
    removing: boolean;
    getMatchCandidate(): MatchCandidate;
}

/** 锁定配对并延后处理，避免在物理回调内销毁刚体。 */
export class MatchQueue<T extends MatchEntity> {
    private pairs: Array<[T, T]> = [];

    /** 接受有效配对并立即锁定双方，拒绝重复物理通知。 */
    enqueue(first: T, second: T): boolean {
        if (first === second || !canMatch(first.getMatchCandidate(), second.getMatchCandidate())) {
            return false;
        }
        first.removing = true;
        second.removing = true;
        this.pairs.push([first, second]);
        return true;
    }

    /** 取出当前待处理批次，后续接触进入新队列。 */
    drain(): Array<[T, T]> {
        const pairs = this.pairs;
        this.pairs = [];
        return pairs;
    }

    /** 退出或重开时丢弃旧局的待处理通知。 */
    clear(): void {
        this.pairs = [];
    }
}
