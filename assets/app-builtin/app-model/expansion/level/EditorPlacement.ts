/** 编辑器碰撞估算圆，位置和半径均为设计像素。 */
export interface PlacementCircle {
    /** 水平中心。 */
    x: number;
    /** 垂直中心。 */
    y: number;
    /** 根据实际主题图片尺寸计算的外接圆半径。 */
    radius: number;
}

/**
 * 从视口附近向外查找空位；采用确定性扫描，空间不足时拒绝添加，不回退到重叠点。
 * @param x 期望横坐标。
 * @param y 期望纵坐标。
 * @param radius 新水果半径。
 * @param mode 原版纵向1、横向2。
 * @param existing 现有水果及黑洞成员的显示圆。
 */
export function findEditorPlacement(x: number, y: number, radius: number, mode: 1 | 2, existing: PlacementCircle[]): [number, number] {
    /** 原版允许的编辑范围；纵向上方可以继续扩展。 */
    const minimumX = mode === 2 ? -2000 : -300;
    const maximumY = mode === 2 ? 0 : Math.max(y, ...existing.map(item => item.y), 0) + 2400;
    x = Math.max(minimumX, Math.min(300, x));
    y = Math.max(-760, Math.min(maximumY, y));
    /** @param px 候选横坐标。 @param py 候选纵坐标。 */
    const valid = (px: number, py: number): boolean => px >= minimumX && px <= 300 && py >= -760 && py <= maximumY
        && existing.every(item => (item.x - px) ** 2 + (item.y - py) ** 2 > (item.radius + radius + 8) ** 2);
    // 8像素安全间隔来自原版；20像素搜索步长为适配值，不改变实际水果尺寸。
    for (let ring = 0; ring <= 160; ring++) {
        for (let dx = -ring; dx <= ring; dx++) {
            for (const dy of ring === 0 ? [0] : [-ring, ring]) {
                if (valid(x + dx * 20, y + dy * 20)) return [x + dx * 20, y + dy * 20];
            }
        }
        for (let dy = -ring + 1; dy < ring; dy++) {
            for (const dx of [-ring, ring]) {
                if (valid(x + dx * 20, y + dy * 20)) return [x + dx * 20, y + dy * 20];
            }
        }
    }
    throw new Error('附近没有足够空间，请移动视口或整理已有水果后再添加');
}

/** 按内容边缘和可视半径限制单轴平移；内容较小时允许在视口内调整位置。
 * @param offset 请求的显示偏移，单位设计像素。
 * @param min 内容最小边缘，包含图片半径。
 * @param max 内容最大边缘，包含图片半径。
 * @param halfExtent 可用视口的一半，已扣除编辑余量并换算缩放。
 */
export function clampEditorPan(offset: number, min: number, max: number, halfExtent: number): number {
    const first = halfExtent - max;
    const second = -halfExtent - min;
    return Math.max(Math.min(first, second), Math.min(Math.max(first, second), offset));
}
