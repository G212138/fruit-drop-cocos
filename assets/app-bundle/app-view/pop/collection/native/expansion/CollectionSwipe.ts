/** 图鉴横向手势判定；距离单位为预制体设计像素。 */
export class CollectionSwipe {
    /** 当前手势锁定方向，避免横竖滚动争抢。 */
    axis: 'pending' | 'horizontal' | 'vertical' = 'pending';
    /** 最近的横向总位移。 */
    distance = 0;
    /** 清除上次手势。 */
    reset(): void {
        this.axis = 'pending';
        this.distance = 0;
    }
    /** @param x 横向总位移。 @param y 纵向总位移。 */
    move(x: number, y: number): string {
        this.distance = x;
        if (this.axis === 'pending' && Math.max(Math.abs(x), Math.abs(y)) >= 12) {
            this.axis = Math.abs(x) > Math.abs(y) * 1.15 ? 'horizontal' : 'vertical';
        }
        return this.axis;
    }
    /** @param page 当前页，零为水果一为甜点。 @param width 可见宽度。 @param cancelled 是否取消。 */
    finish(page: number, width: number, cancelled = false): number {
        if (cancelled || this.axis !== 'horizontal' || Math.abs(this.distance) < width * .16) return page;
        return Math.max(0, Math.min(1, page + (this.distance < 0 ? 1 : -1)));
    }
}
