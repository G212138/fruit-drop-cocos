/** 原版 GameSc.reviveTopFloorBalls 的摆放参数；单位像素，修改会影响回收区域及间距。 */
export const REVIVE_PLACEMENT = Object.freeze({
    /** 原版横纵搜索步长，同时也是最小圆心间距，单位像素。 */
    step: 80,
    /** 原版圆形包围范围之间额外保留的距离，单位像素。 */
    padding: 5,
    /** 原版无等待水果时第一颗的起始纵坐标，单位像素。 */
    emptyStartY: -150,
    /** 原版最多向下搜索四十行，超过后使用保底位置。 */
    rows: 40,
    /** 回收后的最低纵坐标，单位设计像素；原版-70，按等待区上移需求增加140，避免复活后再次贴近斜坡。 */
    minimumY: 70,
    /** 原版黑洞容器抬升比例；容器中的成员还会获得自身的移动量。 */
    wrapperShiftRatio: 0.5,
    /** 原版回收动画时长，单位秒，配合 sineOut 缓动。 */
    duration: 0.5,
});

/** 等待区域占位圆；半径由节点尺寸和缩放计算，不能使用碰撞体半径替代。 */
export interface ReviveCircle {
    /** 水果实例唯一标识。 */
    id: string;
    /** 棋盘局部横坐标，单位像素。 */
    x: number;
    /** 棋盘局部纵坐标，单位像素。 */
    y: number;
    /** 视觉包围半径，单位像素；回收对象应使用恢复下落前缩放后的半径。 */
    radius: number;
    /** 是否位于黑洞容器之内，用于原版抬升距离计算。 */
    insideBlackHole: boolean;
}

/** 摆放计划只给出数据，由流程层负责坐标应用与动画生命周期。 */
export interface RevivePlacement {
    /** 回收水果完成整体抬升后的目标坐标。 */
    targets: { id: string; x: number; y: number }[];
    /** 等待区域整体抬升基准距离，单位像素，黑洞层级需要单独应用比例。 */
    lift: number;
}

/**
 * 搜索第一个不重叠的位置，保留原版先同列、再左右交替、最后向下逐行搜索的顺序。
 * @param fruit 需要回收的水果，半径已经恢复为下落前尺寸。
 * @param startY 本水果第一行的纵坐标，单位像素。
 * @param occupied 已有等待水果和先前已规划的回收水果占位。
 */
function findPosition(fruit: ReviveCircle, startY: number, occupied: readonly ReviveCircle[]): { x: number; y: number } {
    const offsets = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6];
    const { step, padding, rows } = REVIVE_PLACEMENT;
    for (let row = 0; row < rows; row++) {
        const y = startY - step * row;
        for (const offset of offsets) {
            const x = fruit.x + step * offset;
            if (occupied.every(other => {
                const distance = Math.max(step, other.radius + fruit.radius + padding);
                return (x - other.x) ** 2 + (y - other.y) ** 2 >= distance ** 2;
            })) return { x, y };
        }
    }
    return { x: fruit.x, y: startY - step * rows };
}

/**
 * 计算纵向复活摆放与整体抬升，输入不会被修改，也不会把未回收的下落水果算作等待区占位。
 * @param restored 按高度从高到低选出的普通水果，半径已恢复为下落前状态。
 * @param waiting 未释放的等待水果，不包含 restored 中的对象。
 * @param wrapperYs 黑洞容器在等待层内的纵坐标；扁平实例管理器需提供等效容器位置。
 */
export function planRevivePlacement(restored: readonly ReviveCircle[], waiting: readonly ReviveCircle[], wrapperYs: readonly number[] = []): RevivePlacement {
    if (!restored.length) return { targets: [], lift: 0 };
    const { step, emptyStartY, minimumY, wrapperShiftRatio } = REVIVE_PLACEMENT;
    const occupied = [...waiting];
    const lowest = Math.min(...waiting.map(fruit => fruit.y));
    const startY = Number.isFinite(lowest) ? lowest - step : emptyStartY;
    const targets = restored.map((fruit, index) => {
        const position = findPosition(fruit, startY - step * index, occupied);
        occupied.push({ ...fruit, ...position });
        return { id: fruit.id, ...position };
    });
    const normalY = Math.min(...occupied.filter(fruit => !fruit.insideBlackHole).map(fruit => fruit.y));
    const groupY = Math.min(...waiting.filter(fruit => fruit.insideBlackHole).map(fruit => fruit.y), ...wrapperYs);
    const lift = Math.max(0, minimumY - normalY, (minimumY - groupY) / wrapperShiftRatio);
    return { targets: targets.map(target => ({ ...target, y: target.y + lift })), lift };
}
