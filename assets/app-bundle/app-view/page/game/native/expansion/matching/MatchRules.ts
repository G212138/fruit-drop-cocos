/** 参与匹配的最小数据快照。 */
export interface MatchCandidate {
    kind: number;
    y: number;
    touchedFloor: boolean;
    removing: boolean;
}

/** 同类、均低于消除线且至少一方触底，才允许配对。 */
export function canMatch(first: MatchCandidate, second: MatchCandidate, limit = -80): boolean {
    return first !== second
        && !first.removing
        && !second.removing
        && first.kind === second.kind
        && first.y < limit
        && second.y < limit
        && (first.touchedFloor || second.touchedFloor);
}
