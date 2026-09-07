import { canEliminateAtFloor, FloorFruit } from './FloorFailureRules';

/** 原版危险提醒节奏，独立于失败计时，不依赖引擎或表现。 */
export class FloorWarningRules {
    /** 是否已连续进入危险状态；离开后重新等待首闪。 */
    private active = false;
    /** 距离下一次闪烁的时间，单位秒。 */
    private remaining = 0;

    /** 清理危险状态和首闪等待，供结算、重开及恢复安全时调用。 */
    reset(): void {
        this.active = false;
        this.remaining = 0;
    }

    /** @param fruits 当前水果快照。 @param dt 当前帧时长，秒。 @param expanded 本局是否已扩槽。 */
    tick(fruits: FloorFruit[], dt: number, expanded: boolean): 'clear' | 'wait' | 'flash' {
        // 原版普通槽3个、扩槽4个触底水果开始提醒；正在消除的水果不计数。
        const count = fruits.filter(fruit => fruit.touchedFloor && !fruit.removing).length;
        if (count < (expanded ? 4 : 3) || canEliminateAtFloor(fruits)) {
            this.reset();
            return 'clear';
        }
        if (!this.active) {
            this.active = true;
            this.remaining = 1;
            return 'wait';
        }
        this.remaining -= dt;
        if (this.remaining > 0) return 'wait';
        // 原版首闪等1秒，之后每4秒一次；大帧只发一次，不补发多次。
        this.remaining = 4;
        return 'flash';
    }
}
