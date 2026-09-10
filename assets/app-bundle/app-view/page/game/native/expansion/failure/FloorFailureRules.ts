/** 原版 GameSc 底部失败规则；增大数量或延时会降低失败压力。 */
const FLOOR_RULES = {
    /** 参与底部相邻判定的纵向边界，单位设计像素，严格小于才计入。 */
    bottomY: -250,
    /** 普通锁墙启用时的判负数量，单位个。 */
    normalThreshold: 4,
    /** 恰好达到阈值时连续静止 0.25 秒；由原版 0.5 秒缩短，提高失败反馈速度。 */
    normalDelay: 0.25,
    /** 超过阈值时连续静止 0.1 秒；由原版 0.15 秒缩短，保留消除和运动保护。 */
    overflowDelay: 0.1,
} as const;

/** 底部判定需要的纯数据，不依赖引擎或 UI。 */
export interface FloorFruit {
    /** 水果实例唯一标识，用于区分同种水果。 */
    id: string;
    /** 原版水果编号，只有同编号允许匹配。 */
    kind: number;
    /** 棋盘局部纵坐标，单位设计像素，向上为正。 */
    y: number;
    /** 是否曾接触原版地形，供匹配和判负共同使用。 */
    touchedFloor: boolean;
    /** 是否正在配对移除，阻止重复匹配。 */
    removing: boolean;
    /** 按原版速度阈值计算的静止状态。 */
    settled: boolean;
}

/**
 * 原版按高度相邻且至少一方触底的同类水果，会阻止失败判定。
 * @param fruits 当前棋盘的水果状态集合，包含尚未完成的消除。
 */
export function canEliminateAtFloor(fruits: FloorFruit[]): boolean {
    const bottom = getBottomFruits(fruits);
    return bottom.some((fruit, index) => index > 0 && fruit.kind === bottom[index - 1].kind
        && (fruit.touchedFloor || bottom[index - 1].touchedFloor));
}

/**
 * 获取原版 y 小于负二百五十的非消除水果，按高度降序排列。
 * @param fruits 当前棋盘的水果状态集合，包含尚未完成的消除。
 */
function getBottomFruits(fruits: FloorFruit[]): FloorFruit[] {
    return fruits.filter(fruit => !fruit.removing && fruit.y < FLOOR_RULES.bottomY).sort((a, b) => b.y - a.y);
}

/** 普通窄槽规则；扩槽机制接入后由调用方传入五个的阈值。 */
export class FloorFailureRules {
    /** 当前连续静止的累计时长，单位秒。 */
    private elapsed = 0;
    /** 上一帧的触底水果数量，变化时重置计时。 */
    private lastCount = 0;

    /** 清除上一局或上一轮消除遗留的计时。 */
    reset(): void {
        this.elapsed = 0;
        this.lastCount = 0;
    }

    /**
     * 复现原版底部最高两个水果新接触时的即时判负。
     * @param fruits 当前棋盘的水果状态集合，包含尚未完成的消除。
     * @param first 接触或配对中的第一方，标识与快照必须属于同一棋盘。
     * @param second 接触或配对中的第二方，不得与第一方为同一实例。
     * @param threshold 判负数量阈值，普通槽四个、扩槽五个；调大允许更多堆积。
     */
    losesOnContact(fruits: FloorFruit[], first: string, second: string, threshold: number = FLOOR_RULES.normalThreshold): boolean {
        if (canEliminateAtFloor(fruits)) return false;
        const bottom = getBottomFruits(fruits);
        if (bottom.length < threshold) return false;
        return (bottom[0].id === first && bottom[1].id === second)
            || (bottom[0].id === second && bottom[1].id === first);
    }

    /**
     * 触底数量达到阈值并持续静止才判负；移动、消除和数量变化均重置计时。
     * @param fruits 当前棋盘的水果状态集合，包含尚未完成的消除。
     * @param dt 距上一帧的时间，单位秒。
     * @param threshold 判负数量阈值，普通槽四个、扩槽五个；调大允许更多堆积。
     */
    tick(fruits: FloorFruit[], dt: number, threshold: number = FLOOR_RULES.normalThreshold): boolean {
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
        if (this.elapsed < (count > threshold ? FLOOR_RULES.overflowDelay : FLOOR_RULES.normalDelay)) return false;
        this.reset();
        return true;
    }
}
