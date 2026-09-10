/** 参与匹配的最小数据快照。 */
export interface MatchCandidate {
    /** 已释放且未处于生成、冰冻或固定摇晃阶段，才允许普通碰撞消除。 */
    released?: boolean;
    /** 原版水果编号，只有同编号允许匹配。 */
    kind: number;
    /** 棋盘局部纵坐标，单位设计像素，向上为正。 */
    y: number;
    /** 是否曾接触原版地形，供匹配和判负共同使用。 */
    touchedFloor: boolean;
    /** 是否正在配对移除，阻止重复匹配。 */
    removing: boolean;
}

/**
 * 已释放的同类水果真实接触时允许配对，不依赖布局高度或触地历史。
 * @param first 接触或配对中的第一方，标识与快照必须属于同一棋盘。
 * @param second 接触或配对中的第二方，不得与第一方为同一实例。
 */
export function canMatch(first: MatchCandidate, second: MatchCandidate): boolean {
    return first !== second
        && !first.removing
        && !second.removing
        && first.kind === second.kind
        && first.released === true
        && second.released === true;
}
