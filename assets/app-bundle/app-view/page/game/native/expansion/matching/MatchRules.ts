/** 参与匹配的最小数据快照。 */
export interface MatchCandidate {
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
 * 同类、均低于消除线且至少一方触底，才允许配对。
 * @param first 接触或配对中的第一方，标识与快照必须属于同一棋盘。
 * @param second 接触或配对中的第二方，不得与第一方为同一实例。
 * @param limit 允许消除的纵向边界，原版为负八十设计像素；双方必须低于此线。
 */
export function canMatch(first: MatchCandidate, second: MatchCandidate, limit = -80): boolean {
    return first !== second
        && !first.removing
        && !second.removing
        && first.kind === second.kind
        && first.y < limit
        && second.y < limit
        && (first.touchedFloor || second.touchedFloor);
}
