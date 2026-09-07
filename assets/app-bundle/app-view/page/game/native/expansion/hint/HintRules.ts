import { LevelDefinition } from '../level/LevelDefinition';

/** 原版提示图片的固定绑定顺序：纵向、横向、隐藏、冰层、黑洞。 */
export type HintKind = 0 | 1 | 2 | 3 | 4;

/** @param level 已校验关卡；混合机制按原 GameSc 的优先级显示一种提示。 */
export function chooseHint(level: LevelDefinition): HintKind {
    if (level.fruits.some(fruit => !!fruit.blackHoleId || !!fruit.fatherBlackHoleId)) return 4;
    if (level.fruits.some(fruit => fruit.iceLayers > 0)) return 3;
    if (level.fruits.some(fruit => fruit.hidden)) return 2;
    return level.mode === 2 ? 1 : 0;
}
