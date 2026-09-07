/** 底部判定需要的纯数据，不依赖引擎或 UI。 */
export interface FloorFruit {
    id: string;
    kind: number;
    y: number;
    touchedFloor: boolean;
    removing: boolean;
    settled: boolean;
}

/** 原版按高度相邻且至少一方触底的同类水果，会阻止失败判定。 */
export function canEliminateAtFloor(fruits: FloorFruit[]): boolean {
    const bottom = getBottomFruits(fruits);
    return bottom.some((fruit, index) => index > 0 && fruit.kind === bottom[index - 1].kind
        && (fruit.touchedFloor || bottom[index - 1].touchedFloor));
}

/** 获取原版 y 小于负二百五十的非消除水果，按高度降序排列。 */
function getBottomFruits(fruits: FloorFruit[]): FloorFruit[] {
    return fruits.filter(fruit => !fruit.removing && fruit.y < -250).sort((a, b) => b.y - a.y);
}

/** 普通窄槽规则；扩槽机制接入后由调用方传入五个的阈值。 */
export class FloorFailureRules {
    private elapsed = 0;
    private lastCount = 0;

    /** 清除上一局或上一轮消除遗留的计时。 */
    reset(): void {
        this.elapsed = 0;
        this.lastCount = 0;
    }

    /** 复现原版底部最高两个水果新接触时的即时判负。 */
    losesOnContact(fruits: FloorFruit[], first: string, second: string, threshold = 4): boolean {
        if (canEliminateAtFloor(fruits)) return false;
        const bottom = getBottomFruits(fruits);
        if (bottom.length < threshold) return false;
        return (bottom[0].id === first && bottom[1].id === second)
            || (bottom[0].id === second && bottom[1].id === first);
    }

    /** 触底数量达到阈值并持续静止才判负；移动、消除和数量变化均重置计时。 */
    tick(fruits: FloorFruit[], dt: number, threshold = 4): boolean {
        if (fruits.some(fruit => fruit.removing) || canEliminateAtFloor(fruits)) {
            this.reset();
            return false;
        }
        const count = fruits.filter(fruit => fruit.touchedFloor).length;
        if (count !== this.lastCount) {
            this.elapsed = 0;
            this.lastCount = count;
        }
        if (count < threshold || fruits.some(fruit => !fruit.settled)) {
            this.elapsed = 0;
            return false;
        }
        this.elapsed += dt;
        if (this.elapsed < (count > threshold ? 0.15 : 0.5)) return false;
        this.reset();
        return true;
    }
}
