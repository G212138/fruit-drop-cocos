/** 复活选择所需的快照；坐标统一为棋盘局部像素，数组顺序保留原实例遍历顺序。 */
export interface ReviveFruit {
    /** 当前实例唯一标识，不能使用水果种类代替。 */
    id: string;
    /** 原版水果种类编号。 */
    kind: number;
    /** 棋盘局部纵坐标，单位像素，向上为正。 */
    y: number;
    /** 是否已经接触地形。 */
    touchedFloor: boolean;
    /** 是否仍有效且挂在棋盘层级中。 */
    available: boolean;
    /** 是否正等待移除或物理出场处理。 */
    pendingRemoval: boolean;
    /** 黑洞出现动画是否尚未结束。 */
    spawning: boolean;
    /** 原版宿主标记；空值才回退读取成员标记，零值也保留原版优先级。 */
    blackHoleId?: number | null;
    /** 原版黑洞成员所属编号。 */
    parentBlackHoleId?: number | null;
    /** 是否仍在黑洞容器中；释放到下落层的成员为假。 */
    insideBlackHole: boolean;
}

/** 同次复活允许的三种操作；空选择不会擅自清场。 */
export interface ReviveSelection {
    /** 返回待点击区域的实例标识，按高度从高到低排列。 */
    restoreIds: string[];
    /** 强制配对的实例标识；与正常碰撞消除分开执行。 */
    pairs: [string, string][];
}

/**
 * 判定原版复活回收是否排除该水果，保留宿主标记优先于成员标记的语义。
 * @param fruit 当前有效水果快照。
 */
function belongsToBlackHole(fruit: ReviveFruit): boolean {
    const id = Number(fruit.blackHoleId != null ? fruit.blackHoleId : fruit.parentBlackHoleId);
    return Number.isFinite(id) && id > 0;
}

/**
 * 找到同类伙伴，优先最高的触底水果，否则选择最低的非触底水果。
 * @param seed 本次尝试移除的触底水果。
 * @param candidates 已排除无效、占用和禁止对象的快照，保持原遍历顺序。
 */
function findPartner(seed: ReviveFruit, candidates: readonly ReviveFruit[]): ReviveFruit | undefined {
    const sameKind = candidates.filter(fruit => fruit.id !== seed.id && fruit.kind === seed.kind);
    return sameKind.filter(fruit => fruit.touchedFloor).sort((a, b) => b.y - a.y)[0]
        ?? sameKind.filter(fruit => !fruit.touchedFloor).sort((a, b) => a.y - b.y)[0];
}

/**
 * 横向模式只规划一对；执行后必须重新采样再调用，才能包含黑洞消除新补出的成员。
 * 原版每次复活最多调用两次；最高水果无伙伴时不越过它选择下面的水果。
 * @param fruits 当前存活水果，必须在上一对移除及黑洞补出后重新取得。
 */
export function selectHorizontalRevivePair(fruits: readonly ReviveFruit[]): [string, string] | null {
    const candidates = fruits.filter(fruit => fruit.available && !fruit.pendingRemoval);
    const seed = candidates.filter(fruit => fruit.touchedFloor).sort((a, b) => b.y - a.y)[0];
    if (!seed) return null;
    const partner = findPartner(seed, candidates);
    return partner ? [seed.id, partner.id] : null;
}

/**
 * 原版纵向模式回收最高的普通触底水果；一个也选不到时才尝试黑洞成员配对回退。
 * @param fruits 本次复活开始时的存活水果快照。
 * @param count 回收数量，原版默认三颗；不足时不补做配对，零表示不处理。
 */
export function selectVerticalRevive(fruits: readonly ReviveFruit[], count = 3): ReviveSelection {
    const limit = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    const floor = fruits.filter(fruit => fruit.available && fruit.touchedFloor).sort((a, b) => b.y - a.y);
    const restoreIds = floor.filter(fruit => !belongsToBlackHole(fruit)).slice(0, limit).map(fruit => fruit.id);
    if (restoreIds.length || !limit) return { restoreIds, pairs: [] };

    const eligible = fruits.filter(fruit => fruit.available && !fruit.pendingRemoval && !fruit.spawning
        && !fruit.insideBlackHole && !(Number.isFinite(fruit.blackHoleId) && fruit.blackHoleId! > 0));
    const eligibleIds = new Set(eligible.map(fruit => fruit.id));
    const seeds = floor.filter(fruit => eligibleIds.has(fruit.id)).slice(0, 2);
    const used = new Set<string>();
    const pairs: [string, string][] = [];
    for (const seed of seeds) {
        // 两个种子互相排除，即使同类也不能在这次回退中组成一对。
        const candidates = eligible.filter(fruit => !used.has(fruit.id) && !seeds.some(other => other.id === fruit.id));
        const partner = findPartner(seed, candidates);
        if (!partner) continue;
        used.add(seed.id);
        used.add(partner.id);
        pairs.push([seed.id, partner.id]);
    }
    return { restoreIds: [], pairs };
}
