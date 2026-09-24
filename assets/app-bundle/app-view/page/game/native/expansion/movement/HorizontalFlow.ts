import { Node, UITransform } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { initialHorizontalShift, shiftAfterHorizontalDrop, consumeHorizontalShift, chooseHorizontalDrop,
    HORIZONTAL_PAIR_SHIFT, HORIZONTAL_DROP_INTERVAL } from './HorizontalRules';

/** 横向模式的位移与自动释放协调器，不创建节点也不处理胜负。 */
export class HorizontalFlow {
    /** 当前安全上界，单位水果容器设计像素。 */
    private top = Infinity;
    /** 水果容器左边缘，单位设计像素。 */
    private left = -Infinity;

    /** 等待完成的右移距离，单位设计像素。 */
    private pending = 0;
    /** 距离下次自动释放的剩余秒数。 */
    private cooldown = 0;

    /** @param fruits 开局悬停水果。 @param line 预制体中的原版右侧线。 @param top 水果容器内的可见上界，单位设计像素。 */
    begin(fruits: FruitItem[], line: Node, top = Infinity): void {
        this.reset();
        this.top = top;
        const root = fruits[0]?.node.parent?.getComponent(UITransform);
        this.left = root ? -root.contentSize.width * root.anchorX : -Infinity;
        this.move(fruits, initialHorizontalShift(fruits.map(fruit => fruit.node.position.x), line.position.x));
        this.alignVisibleTop(fruits);
    }

    /** @param fruits 本次释放后剩余悬停水果。 @param line 右侧线节点。 */
    afterDrop(fruits: FruitItem[], line: Node): void {
        this.pending += shiftAfterHorizontalDrop(fruits.map(fruit => fruit.node.position.x), line.position.x);
    }

    /** 每对真实消除追加原版十五像素右移。 */
    matched(): void {
        this.pending += HORIZONTAL_PAIR_SHIFT;
    }

    /** @param dt 当前帧秒数。 @param all 存活水果。 @param waiting 未释放水果。 @param line 右侧线。 @param release 棋盘批准的自动释放回调。 */
    tick(dt: number, all: FruitItem[], waiting: FruitItem[], line: Node, release: (fruit: FruitItem) => void): void {
        const movement = consumeHorizontalShift(this.pending, all.map(fruit => fruit.node.position.x), line.position.x, dt);
        this.pending = movement.remaining;
        this.move(waiting, movement.delta);
        if (movement.delta) this.alignVisibleTop(waiting);
        this.cooldown -= dt;
        if (this.cooldown > 0) return;
        const eligible = waiting.filter(fruit => !fruit.spawning && fruit.iceLayers === 0 && !fruit.touchedFloor);
        const size = line.getComponent(UITransform)!.contentSize;
        const selected = chooseHorizontalDrop(eligible.map(fruit => {
            const bounds = fruit.node.getComponent(UITransform)!.contentSize;
            return { x: fruit.node.position.x, y: fruit.node.position.y, radius: Math.max(bounds.width, bounds.height) / 2 };
        }), line.position.x, line.position.y, size.width, size.height);
        if (selected >= 0) {
            release(eligible[selected]);
            this.cooldown = HORIZONTAL_DROP_INTERVAL;
        }
    }

    /** 按可见水果外沿对齐；屏外水果随接近左缘连续参与计算，避免入屏时突然下跳。 */
    private alignVisibleTop(fruits: FruitItem[]): void {
        if (!Number.isFinite(this.top) || !fruits.length) return;
        const highest = Math.max(...fruits.map(fruit => {
            const transform = fruit.node.getComponent(UITransform)!;
            const right = fruit.node.position.x + transform.contentSize.width
                * Math.abs(fruit.node.scale.x) * (1 - transform.anchorX);
            // 屏外每远离一设计像素，放宽一像素上界；到达左缘时恢复完整安全上界。
            const outside = Number.isFinite(this.left) ? Math.max(0, this.left - right) : 0;
            return fruit.node.position.y + transform.contentSize.height
                * Math.abs(fruit.node.scale.y) * (1 - transform.anchorY) - outside;
        }));
        const deltaY = this.top - highest;
        for (const fruit of fruits) {
            const position = fruit.node.position;
            fruit.node.setPosition(position.x, position.y + deltaY, position.z);
        }
    }

    /** @param fruits 只移动悬停水果，已下落的动态刚体不随横向补位。 @param delta 当前位移，单位像素。 */
    private move(fruits: FruitItem[], delta: number): void {
        if (!delta) return;
        for (const fruit of fruits) {
            const position = fruit.node.position;
            fruit.node.setPosition(position.x + delta, position.y, position.z);
        }
    }

    /** 重开清除待移动距离和自动下落冷却。 */
    reset(): void {
        this.pending = 0;
        this.cooldown = 0;
    }
}
