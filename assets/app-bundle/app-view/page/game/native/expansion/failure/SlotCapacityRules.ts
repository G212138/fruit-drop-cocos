/** 读取当前可用凹槽容量；底部两格需依次解锁，每格容纳一个物品。 */
export function slotCapacity(unlockedSlots: number): { failure: number; warning: number } {
    // 原版普通槽4个判负、3个预警；两次有效奖励分别把阈值提升到5/4与6/5。
    const slots = Number.isFinite(unlockedSlots) ? Math.max(0, Math.min(2, Math.floor(unlockedSlots))) : 0;
    return { failure: 4 + slots, warning: 3 + slots };
}
