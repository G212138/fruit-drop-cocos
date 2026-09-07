/** 原版一次配对消除两个水果，所有在场冰层减少一层。 */
export const ICE_LAYERS_PER_PAIR = 1;

/** @param layers 当前冰层数，单位层；不允许负数、无限值或小数。 */
export function validateIceLayers(layers: unknown): number {
    if (layers === undefined) return 0;
    const value = Number(layers);
    if (!Number.isInteger(value) || value < 0) throw new Error('冰层数必须是非负整数');
    return value;
}

/** @param layers 当前冰层数；每次成功配对调用一次，清零后可下落。 */
export function reduceIceLayers(layers: number): number {
    return Math.max(0, layers - ICE_LAYERS_PER_PAIR);
}
