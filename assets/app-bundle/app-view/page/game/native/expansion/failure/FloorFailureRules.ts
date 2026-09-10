/** 沿用原版数量与配对边界，按用户要求取消失败等待。 */
const FLOOR_RULES = {
    /** 参与底部相邻判定的纵向边界，单位设计像素，严格小于才计入。 */
    bottomY: -250,
    /** 普通锁墙启用时的判负数量，单位个。 */
    normalThreshold: 4,
    /** 洞口中心左右110设计像素内允许堆叠延伸；适配圆形水果半径，不纳入远处斜坡。 */
    mouthHalfWidth: 110,
} as const;

/** 底部判定需要的纯数据，不依赖引擎或 UI。 */
export interface FloorFruit {
    /** 棋盘局部横坐标，单位设计像素；旧规则快照可省略。 */
    x?: number;
    /** 是否已点击释放；悬停或出现中的水果不能构成失败堆叠。 */
    released?: boolean;
    /** 物理引擎当前真实接触的水果ID，包含休眠中的有效接触。 */
    contacts?: string[];
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
    /**
     * 从洞内水果沿真实接触寻找连续堆叠，顶部可自然延伸到洞口上方。
     * @param fruits 当前物理步结束后的水果快照。
     * @param threshold 普通洞4个、扩槽5个；不等待静止或额外计时。
     */
    losesOnStack(fruits: FloorFruit[], threshold: number = FLOOR_RULES.normalThreshold): boolean {
        if (fruits.some(fruit => fruit.removing)) return false;
        const eligible = fruits.filter(fruit => fruit.released === true && Number.isFinite(fruit.x)
            && Math.abs(fruit.x!) <= FLOOR_RULES.mouthHalfWidth);
        const remaining = new Set(eligible);
        while (remaining.size) {
            const seed = remaining.values().next().value as FloorFruit;
            const stack = [seed];
            remaining.delete(seed);
            for (let index = 0; index < stack.length; index++) {
                const current = stack[index];
                for (const next of remaining) {
                    if ((current.contacts ?? []).indexOf(next.id) < 0 && (next.contacts ?? []).indexOf(current.id) < 0) continue;
                    remaining.delete(next);
                    stack.push(next);
                }
            }
            if (stack.length < threshold || !stack.some(fruit => fruit.y < FLOOR_RULES.bottomY)) continue;
            // 同一连续堆叠中仍有可消除的真实接触时，先交给配对流程处理。
            const canMatch = stack.some(first => stack.some(second => first !== second && first.kind === second.kind
                && (first.touchedFloor || second.touchedFloor)
                && ((first.contacts ?? []).indexOf(second.id) >= 0 || (second.contacts ?? []).indexOf(first.id) >= 0)));
            if (!canMatch) return true;
        }
        return false;
    }
    /** 保留棋盘重开/扩槽调用契约；即时规则没有跨帧计时状态。 */
    reset(): void {}

    /**
     * 复现原版底部最高两个水果新接触时的即时判负。
     * @param fruits 当前棋盘的水果状态集合，包含尚未完成的消除。
     * @param first 接触或配对中的第一方，标识与快照必须属于同一棋盘。
     * @param second 接触或配对中的第二方，不得与第一方为同一实例。
     * @param threshold 判负数量阈值，普通槽四个、扩槽五个；调大允许更多堆积。
     */
    losesOnContact(fruits: FloorFruit[], first: string, second: string, threshold: number = FLOOR_RULES.normalThreshold): boolean {
        if (fruits.some(fruit => fruit.removing) || canEliminateAtFloor(fruits)) return false;
        const bottom = getBottomFruits(fruits);
        if (bottom.length < threshold) return false;
        return (bottom[0].id === first && bottom[1].id === second)
            || (bottom[0].id === second && bottom[1].id === first);
    }

}
