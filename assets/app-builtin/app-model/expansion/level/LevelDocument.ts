/** 原版单颗水果的可交换配置；字段保留原项目命名，便于旧关卡直接导入。 */
export interface LevelFruitData {
    /** 水果编号字符串，原版一至三十。 */
    n: string;
    /** 相对编辑器棋盘原点的设计像素坐标，不包含运行时入场偏移。 */
    p: [number, number];
    /** t 隐藏，f 或省略为普通。 */
    h?: 't' | 'f';
    /** 初始冰层数，单位层。 */
    ice?: number;
    /** 黑洞总水果数，包含宿主；导出时根据成员重新计算。 */
    BlackHole?: number;
    /** 黑洞宿主的正整数编号。 */
    BlackHoleID?: number;
    /** 所属黑洞编号；成员与宿主在导出时共用坐标。 */
    FatherBlackHoleID?: number;
    /** 黑洞内部释放顺序，从一开始。 */
    SequenceID?: number;
}

/** 原版关卡编辑器导入、导出和试玩共用的数据结构。 */
export interface LevelDocument {
    /** 原关卡序号，从一开始；自建关卡默认一。 */
    level: number;
    /** 一为纵向，二为横向。 */
    m: 1 | 2;
    /** 包含黑洞待释放成员的完整水果列表。 */
    d: LevelFruitData[];
}

/** @param value 待校验值。 @param name 中文字段名。 @param minimum 最小合法整数。 */
function integer(value: unknown, name: string, minimum: number): number {
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < minimum) throw new Error(name + '无效');
    return result;
}

/** @param value JSON 数据；只校验格式及引用，不要求编辑中的草稿已成对。 */
export function readLevelDocument(value: unknown): LevelDocument {
    if (!value || typeof value !== 'object') throw new Error('关卡必须是对象');
    const source = value as Record<string, unknown>;
    const mode = integer(source.m, '移动模式', 1);
    if (mode !== 1 && mode !== 2) throw new Error('移动模式仅支持 1 或 2');
    if (!Array.isArray(source.d)) throw new Error('水果列表必须是数组');
    const fruits: LevelFruitData[] = source.d.map((entry: unknown) => {
        if (!entry || typeof entry !== 'object') throw new Error('水果数据无效');
        const item = entry as Record<string, unknown>;
        const allowed = ['n','p','h','ice','i','BlackHole','BlackHoleID','FatherBlackHoleID','SequenceID'];
        if (Object.keys(item).some(key => allowed.indexOf(key) < 0)) throw new Error('存在未知水果字段');
        const kind = integer(item.n, '水果编号', 1);
        if (kind > 30) throw new Error('水果编号必须在 1 至 30 之间');
        if (!Array.isArray(item.p) || item.p.length !== 2 || !item.p.every(Number.isFinite)) throw new Error('水果坐标必须是两个有限数值');
        const result: LevelFruitData = { n: String(kind), p: [item.p[0], item.p[1]] };
        if (item.h !== undefined) {
            if (item.h !== 't' && item.h !== 'f') throw new Error('隐藏标记无效');
            result.h = item.h;
        }
        if (item.ice !== undefined || item.i !== undefined) result.ice = integer(item.ice ?? item.i, '冰层数', 0);
        for (const key of ['BlackHole','BlackHoleID','FatherBlackHoleID','SequenceID'] as const) {
            if (item[key] !== undefined) result[key] = integer(item[key], key, key === 'BlackHole' ? 0 : 1);
        }
        if (result.BlackHoleID && result.FatherBlackHoleID) throw new Error('黑洞成员不能同时作为宿主');
        return result;
    });
    const hosts = new Map<number, LevelFruitData>();
    for (const item of fruits) {
        if (item.BlackHoleID) {
            if (hosts.has(item.BlackHoleID)) throw new Error('黑洞编号重复');
            hosts.set(item.BlackHoleID, item);
        }
    }
    const sequences = new Set<string>();
    for (const item of fruits) {
        if (item.FatherBlackHoleID) {
            if (!hosts.has(item.FatherBlackHoleID)) throw new Error('黑洞成员缺少宿主');
            if (!item.SequenceID) throw new Error('黑洞成员缺少顺序');
            const key = item.FatherBlackHoleID + ':' + item.SequenceID;
            if (sequences.has(key)) throw new Error('同一黑洞成员顺序重复');
            sequences.add(key);
        }
    }
    return { level: integer(source.level, '关卡编号', 1), m: mode, d: fruits };
}

/** @param document 待导出或试玩的草稿；沿用原版成对及五十设计像素间距约束。 */
export function validateLevelForExport(document: LevelDocument): void {
    const data = readLevelDocument(document);
    if (!data.d.length) throw new Error('请先放置水果');
    const counts = new Map<string, number>();
    for (const item of data.d) counts.set(item.n, (counts.get(item.n) || 0) + 1);
    for (const [kind, count] of counts) {
        if (count % 2) throw new Error('水果 ' + kind + ' 数量为 ' + count + '，需要成对出现');
    }
    for (let i = 0; i < data.d.length; i++) {
        const first = data.d[i];
        for (let j = i + 1; j < data.d.length; j++) {
            const second = data.d[j];
            const group = first.BlackHoleID ?? first.FatherBlackHoleID;
            if (group && group === (second.BlackHoleID ?? second.FatherBlackHoleID)) continue;
            const dx = first.p[0] - second.p[0], dy = first.p[1] - second.p[1];
            if (dx * dx + dy * dy <= 2500) throw new Error('不同组水果距离必须大于 50 设计像素');
        }
    }
}

/** @param document 已校验草稿；深拷贝保证试玩不会修改编辑器状态。 */
export function cloneLevelDocument(document: LevelDocument): LevelDocument {
    return { level: document.level, m: document.m, d: document.d.map(item => ({ ...item, p: [...item.p] as [number, number] })) };
}
