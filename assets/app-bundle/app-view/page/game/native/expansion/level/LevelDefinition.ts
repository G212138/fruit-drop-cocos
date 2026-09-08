import { validateIceLayers } from '../ice/IceRules';
/** 关卡水果：坐标相对棋盘原点，单位为设计像素。 */
export interface FruitDefinition {
    /** 原版水果编号，与独立水果预制体编号一致。 */
    kind: number;
    /** 原 BlackHoleID；正整数代表黑洞宿主，省略为普通水果。 */
    blackHoleId?: number;
    /** 原 FatherBlackHoleID；成员延迟生成，不随初始水果一起出现。 */
    fatherBlackHoleId?: number;
    /** 原 SequenceID；同一黑洞的成员按升序释放。 */
    sequence?: number;
    /** 原配置 ice 或 i 字段，单位层，每次配对减少一层。 */
    iceLayers: number;
    /** 原配置 h=t 表示以花朵遮住外观，触底或消除时揭示。 */
    hidden: boolean;
    /** 原配置横坐标，向右为正。 */
    x: number;
    /** 原配置纵坐标加初始偏移，向上为正。 */
    y: number;
}

/** 已验证且允许开始的一关；宿主与普通水果初始生成，黑洞成员按顺序补出。 */
export interface LevelDefinition {
    /** 从一开始的原始关卡序号。 */
    number: number;
    /** 原版一为纵向补位，二为向右补位及边界自动释放。 */
    mode: 1 | 2;
    /** 保留原配置顺序的水果列表。 */
    fruits: FruitDefinition[];
}

/** 首次生成纵向偏移，单位设计像素；原版700，按水果区上移需求增加140，给斜坡留出空间。 */
export const INITIAL_OFFSET_Y = 840;
/** 原版完整四十五关；普通、隐藏、冰层、黑洞和横向均已接入，逐关实玩验证仍单独记录。 */
export const SUPPORTED_LEVEL_COUNT = 45;
/** 原版完整三十种水果编号，必须具有对应预制体。 */
export const SUPPORTED_FRUIT_KINDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];

/**
 * 严格读取原版配置，不跳过未知机制，也不更改关卡顺序。
 * @param value 原版 JSON 中单关数据。
 * @param number 请求关卡序号，从一开始。
 */
export function parseLevel(value: unknown, number = 1): LevelDefinition {
    if (!Number.isInteger(number) || number < 1 || number > SUPPORTED_LEVEL_COUNT) {
        throw new Error('第 '+number+' 关尚未开放，特殊机制正在迁移');
    }
    const source = value as { level: number; m: number; d: Record<string, unknown>[] };
    if (!source || source.level !== number || (source.m !== 1 && source.m !== 2) || !Array.isArray(source.d) || !source.d.length) {
        throw new Error('关卡编号、移动模式或水果列表无效');
    }
    const counts = new Map<number, number>();
    const fruits = source.d.map(item => {
        if (!item || Object.keys(item).some(key => ['n','p','h','ice','i','BlackHole','BlackHoleID','FatherBlackHoleID','SequenceID'].indexOf(key) < 0)
            || (item.h !== undefined && item.h !== 'f' && item.h !== 't')) {
            throw new Error('关卡含有未知水果字段或隐藏标记');
        }
        const kind = Number(item.n);
        const point = item.p as number[];
        if (SUPPORTED_FRUIT_KINDS.indexOf(kind) < 0 || !Array.isArray(point) || point.length !== 2
            || !point.every(Number.isFinite)) throw new Error('水果编号或原始坐标无效');
        counts.set(kind, (counts.get(kind) || 0) + 1);
        const blackHoleId = optionalId(item.BlackHoleID);
        const fatherBlackHoleId = optionalId(item.FatherBlackHoleID);
        const sequence = optionalId(item.SequenceID);
        if (blackHoleId && fatherBlackHoleId) throw new Error('黑洞宿主不能同时是成员');
        return { kind, ...(blackHoleId ? { blackHoleId } : {}), ...(fatherBlackHoleId ? { fatherBlackHoleId } : {}), ...(sequence ? { sequence } : {}),
            iceLayers: validateIceLayers(item.ice ?? item.i), hidden: item.h === 't', x: point[0], y: point[1] + INITIAL_OFFSET_Y };
    });
    const hosts = new Set<number>();
    for (const fruit of fruits) {
        if (!fruit.blackHoleId) continue;
        if (hosts.has(fruit.blackHoleId)) throw new Error('黑洞宿主编号重复');
        hosts.add(fruit.blackHoleId);
    }
    const sequences = new Set<string>();
    for (const fruit of fruits) {
        if (!fruit.fatherBlackHoleId) continue;
        if (!hosts.has(fruit.fatherBlackHoleId) || !fruit.sequence) throw new Error('黑洞成员缺少宿主或顺序');
        const key = fruit.fatherBlackHoleId + ':' + fruit.sequence;
        if (sequences.has(key)) throw new Error('黑洞成员顺序重复');
        sequences.add(key);
    }
    if ([...counts.values()].some(count => count % 2)) throw new Error('同类水果数量必须成对');
    return { number, mode: source.m, fruits };
}

/** @param value 原配置黑洞编号或顺序；省略表示无此属性，存在时必须为正整数。 */
function optionalId(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('黑洞编号或顺序无效');
    return id;
}

/** @param level 已验证关卡；返回数量单位为个。 */
export function countFruits(level: LevelDefinition): number {
    return level.fruits.length;
}

/**
 * 沿用原 GameSc.getLoopedLevelIndex：超过配置总数后循环第三关至最后一关，前两关不再重复。
 * @param count 原始配置数量，单位关；一至两关配置只重复最后一关。
 * @param displayed 玩家看到的累计关数，必须为安全正整数。
 */
export function loopedLevelIndex(count: number, displayed: number): number {
    if (!Number.isSafeInteger(count) || count < 1) throw new Error('关卡配置列表为空或数量无效');
    if (!Number.isSafeInteger(displayed) || displayed < 1) throw new Error('累计关卡编号无效');
    if (displayed <= count) return displayed - 1;
    if (count <= 2) return count - 1;
    return 2 + (displayed - 3) % (count - 2);
}

/**
 * 加载正式关卡并保留累计关数；编辑器试玩仍直接解析其独立草稿。
 * @param values 原版完整关卡数组，不允许缺失配置时静默替换成第一关。
 * @param displayed 玩家累计关数，用于 HUD、结算和下一关存档。
 */
export function loadCampaignLevel(values: unknown, displayed: number): LevelDefinition {
    if (!Array.isArray(values)) throw new Error('关卡配置列表无效');
    const index = loopedLevelIndex(values.length, displayed);
    const definition = parseLevel(values[index], index + 1);
    return { ...definition, number: displayed };
}
