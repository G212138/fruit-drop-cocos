import { isValid, tween, Tween } from 'cc';
import { FruitSpawner } from '../board/FruitSpawner';
import { FruitItem } from '../fruit/FruitItem';
import { PropFruit, PropKind, selectPropPair, selectShuffleTargets } from './PropRules';

/** 道具实例流程，与库存、广告和按钮分离。 */
export class BoardPropFlow {
    /** 正在刷新位置的实例；非空时锁定其他棋盘操作。 */
    private moving: FruitItem[] = [];
    /** 动画是否仍占用棋盘。 */
    get busy(): boolean { return this.moving.length > 0; }

    /**
     * @param kind 道具类型。
     * @param spawner 当前棋盘水果集合。
     * @param consume 已确定目标后扣库存；失败则不执行。
     * @param eliminate 执行一对强制消除并更新关卡计数。
     * @returns 空字符串表示成功，否则返回用户可读原因。
     */
    use(kind: PropKind, spawner: FruitSpawner, consume: () => boolean,
        eliminate: (first: FruitItem, second: FruitItem) => void): string {
        const live = spawner.getLive();
        const snapshots: PropFruit[] = live.map(fruit => {
            const definition = spawner.getDefinition(fruit);
            return { id: fruit.node.uuid, kind: fruit.kind, y: fruit.node.position.y,
                touchedFloor: fruit.touchedFloor, unavailable: fruit.removing || fruit.spawning,
                resident: spawner.isBlackHoleResident(fruit),
                blackHole: !!(definition.blackHoleId || definition.fatherBlackHoleId) };
        });
        if (kind === 'eliminate') {
            const pair = selectPropPair(snapshots);
            if (!pair) return '当前无可消除的同类水果';
            if (!consume()) return '道具保存失败，请重试';
            eliminate(live.find(fruit => fruit.node.uuid === pair[0])!, live.find(fruit => fruit.node.uuid === pair[1])!);
            return '';
        }
        const ids = new Set(selectShuffleTargets(snapshots));
        const targets = live.filter(fruit => ids.has(fruit.node.uuid));
        if (targets.length < 2) return '当前无可刷新水果';
        if (!consume()) return '道具保存失败，请重试';
        const positions = targets.map(fruit => fruit.node.position.clone());
        for (let index = positions.length - 1; index > 0; index--) {
            const other = Math.floor(Math.random() * (index + 1));
            [positions[index], positions[other]] = [positions[other], positions[index]];
        }
        this.moving = [...targets];
        targets.forEach((fruit, index) => {
            fruit.prepareRevive();
            // 原版刷新动画0.35秒、正弦缓入缓出；未触底的动态水果恢复待点击状态。
            tween(fruit.node).to(0.35, { position: positions[index] }, { easing: 'sineInOut' })
                .call(() => this.finish(fruit)).start();
        });
        return '';
    }
    /** @param fruit 已完成位置刷新的水果，恢复静态碰撞后解除占用。 */
    private finish(fruit: FruitItem): void {
        if (isValid(fruit, true)) fruit.finishRevive();
        this.moving = this.moving.filter(item => item !== fruit);
    }
    /** 结束或重开时取消旧动画，不向下一局发送回调。 */
    cancel(): void {
        for (const fruit of this.moving) {
            if (!isValid(fruit, true)) continue;
            Tween.stopAllByTarget(fruit.node);
            fruit.finishRevive();
        }
        this.moving = [];
    }
}
