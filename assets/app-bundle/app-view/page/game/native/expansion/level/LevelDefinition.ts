/** 一个水果的类型及棋盘局部坐标。 */
export interface FruitDefinition {
    kind: number;
    x: number;
    y: number;
}

/** 验证关使用分批布局；原版移动机制另行迁移。 */
export interface LevelDefinition {
    waves: FruitDefinition[][];
}

/** 校验外部 JSON，防止空关、缺图及奇数水果造成无法结束的一局。 */
export function parseLevel(value: unknown): LevelDefinition {
    const level = value as LevelDefinition;
    if (!level || !Array.isArray(level.waves) || level.waves.length === 0) {
        throw new Error('关卡缺少有效批次');
    }

    for (const wave of level.waves) {
        if (!Array.isArray(wave) || wave.length === 0) {
            throw new Error('关卡批次不能为空');
        }
        const counts = new Map<number, number>();
        for (const fruit of wave) {
            if (!fruit || [21, 22, 6, 17].indexOf(fruit.kind) < 0
                || !Number.isFinite(fruit.x) || !Number.isFinite(fruit.y)) {
                throw new Error('水果类型或坐标无效');
            }
            counts.set(fruit.kind, (counts.get(fruit.kind) || 0) + 1);
        }
        if ([...counts.values()].some(count => count % 2 !== 0)) {
            throw new Error('每批同类水果必须成对');
        }
    }
    return level;
}

/** 统计本局总水果数，供状态及进度显示使用。 */
export function countFruits(level: LevelDefinition): number {
    return level.waves.reduce((total, wave) => total + wave.length, 0);
}
