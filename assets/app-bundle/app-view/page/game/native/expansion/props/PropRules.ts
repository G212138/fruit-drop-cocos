/** 原版两种道具，分别为刷新位置与消除一对。 */
export type PropKind = 'shuffle' | 'eliminate';
/** 选择道具目标所需的水果状态。 */
export interface PropFruit {
    /** 当前水果唯一标识。 */
    id: string;
    /** 水果类型编号。 */
    kind: number;
    /** 棋盘局部高度，单位设计像素。 */
    y: number;
    /** 已经接触地形。 */
    touchedFloor: boolean;
    /** 正在消除、生成或不可操作。 */
    unavailable: boolean;
    /** 仍在黑洞容器内。 */
    resident: boolean;
    /** 带有黑洞宿主或成员标记，刷新时排除。 */
    blackHole: boolean;
}
/** @param fruits 当前水果快照；优先最高触底水果，伙伴先触底最高、再上方最低。 */
export function selectPropPair(fruits: readonly PropFruit[]): [string, string] | null {
    const available = fruits.filter(fruit => !fruit.unavailable && !fruit.resident);
    const seed = available.filter(fruit => fruit.touchedFloor).sort((a,b) => b.y-a.y)[0];
    if (!seed) return null;
    const partners = available.filter(fruit => fruit.id !== seed.id && fruit.kind === seed.kind);
    const partner = partners.filter(fruit => fruit.touchedFloor).sort((a,b) => b.y-a.y)[0]
        ?? partners.filter(fruit => !fruit.touchedFloor).sort((a,b) => a.y-b.y)[0];
    return partner ? [seed.id, partner.id] : null;
}
/** @param fruits 当前快照；按原版排除触底、黑洞宿主和成员及出场中的水果。 */
export function selectShuffleTargets(fruits: readonly PropFruit[]): string[] {
    return fruits.filter(fruit => !fruit.unavailable && !fruit.resident && !fruit.blackHole && !fruit.touchedFloor)
        .map(fruit => fruit.id);
}
