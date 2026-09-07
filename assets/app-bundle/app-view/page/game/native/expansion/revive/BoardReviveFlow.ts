import { isValid, UITransform } from 'cc';
import { FruitSpawner } from '../board/FruitSpawner';
import { FruitItem } from '../fruit/FruitItem';
import { ReviveMotion } from './ReviveMotion';
import { ReviveCircle, planRevivePlacement } from './RevivePlacement';
import { ReviveFruit, selectHorizontalRevivePair, selectVerticalRevive } from './ReviveSelection';

/** 将纯复活规则应用到原棋盘实例，不负责广告、玩家进度或弹窗。 */
export class BoardReviveFlow {
    /** 回收动画生命周期，清局时必须一起取消。 */
    private readonly motion = new ReviveMotion();
    /** 包括同步强制配对和异步回收期间的输入锁。 */
    private running = false;
    /** 重开、胜利或退出使当前流程失效，阻止继续消除旧局对象。 */
    private generation = 0;

    /** 当前是否正在复活。 */
    get busy(): boolean {
        return this.running;
    }

    /**
     * 根据原模式回收水果或强制配对，完成后恢复同一棋盘。
     * @param mode 原配置模式，一为纵向，二为横向。
     * @param spawner 当前棋盘实例集合与黑洞生命周期。
     * @param removePair 删除一对并通知权威状态的棋盘回调。
     * @param completed 正常恢复完成后解锁棋盘的回调。
     */
    begin(mode: 1 | 2, spawner: FruitSpawner, removePair: (a: FruitItem, b: FruitItem) => void, completed: () => void): boolean {
        if (this.running) return false;
        const generation = ++this.generation;
        this.running = true;
        spawner.resumeBlackHoles();
        const finish = () => {
            if (generation !== this.generation) return;
            this.running = false;
            completed();
        };
        if (mode === 2) {
            // 每次移除后重新采样，下一次允许选择刚从黑洞补出的成员。
            for (let attempt = 0; attempt < 2 && generation === this.generation; attempt++) {
                const pair = selectHorizontalRevivePair(this.snapshots(spawner));
                if (pair) this.remove(pair, spawner, removePair);
            }
            if (generation !== this.generation) return true;
            for (const fruit of spawner.getLive()) fruit.resumeAfterRevive();
            finish();
            return true;
        }
        const selection = selectVerticalRevive(this.snapshots(spawner));
        if (!selection.restoreIds.length) {
            for (const pair of selection.pairs) {
                if (generation !== this.generation) return true;
                this.remove(pair, spawner, removePair);
            }
            if (generation !== this.generation) return true;
            for (const fruit of spawner.getLive()) fruit.resumeAfterRevive();
            finish();
            return true;
        }
        const restored = selection.restoreIds.map(id => spawner.getLive().find(fruit => fruit.node.uuid === id)!);
        const selected = new Set(restored);
        const waiting = spawner.getWaiting().filter(fruit => !selected.has(fruit));
        for (const fruit of restored) fruit.prepareRevive();
        const plan = planRevivePlacement(restored.map(fruit => this.circle(fruit, spawner)),
            waiting.map(fruit => this.circle(fruit, spawner)), spawner.getBlackHoleCenterYs());
        for (const fruit of [...waiting, ...restored]) {
            const definition = spawner.getDefinition(fruit);
            // 原版宿主移动半量；容器内成员同时获得容器与自身半量，扁平实例合为全量。
            const ratio = definition.blackHoleId ? 0.5 : 1;
            const position = fruit.node.position;
            fruit.node.setPosition(position.x, position.y + plan.lift * ratio, position.z);
        }
        spawner.updateBlackHoles(0);
        for (const fruit of spawner.getLive()) if (!selected.has(fruit)) fruit.resumeAfterRevive();
        this.motion.begin(plan.targets.map(target => ({ ...target, fruit: restored.find(fruit => fruit.node.uuid === target.id)! })), finish);
        return true;
    }

    /** @param spawner 当前集合；以原始身份和当前释放状态生成规则快照。 */
    private snapshots(spawner: FruitSpawner): ReviveFruit[] {
        return spawner.getLive().map(fruit => {
            const definition = spawner.getDefinition(fruit);
            return {
                id: fruit.node.uuid, kind: fruit.kind, y: fruit.node.position.y,
                touchedFloor: fruit.touchedFloor, available: isValid(fruit.node, true) && !!fruit.node.parent,
                pendingRemoval: fruit.removing, spawning: fruit.spawning,
                blackHoleId: definition.blackHoleId, parentBlackHoleId: definition.fatherBlackHoleId,
                insideBlackHole: !!definition.fatherBlackHoleId && spawner.isBlackHoleResident(fruit),
            };
        });
    }

    /** @param fruit 尺寸已恢复的实例。 @param spawner 提供当前黑洞归属。 */
    private circle(fruit: FruitItem, spawner: FruitSpawner): ReviveCircle {
        const size = fruit.node.getComponent(UITransform)!.contentSize;
        const scale = fruit.node.scale;
        return { id: fruit.node.uuid, x: fruit.node.position.x, y: fruit.node.position.y,
            radius: Math.max(10, Math.max(size.width, size.height) * Math.max(Math.abs(scale.x) || 1, Math.abs(scale.y) || 1) * 0.5),
            insideBlackHole: !!spawner.getDefinition(fruit).fatherBlackHoleId && spawner.isBlackHoleResident(fruit) };
    }

    /** @param pair 规则确认的两颗标识。 @param spawner 当前集合。 @param removePair 棋盘删除回调。 */
    private remove(pair: [string, string], spawner: FruitSpawner, removePair: (a: FruitItem, b: FruitItem) => void): void {
        const live = spawner.getLive();
        const first = live.find(fruit => fruit.node.uuid === pair[0]);
        const second = live.find(fruit => fruit.node.uuid === pair[1]);
        if (first && second && first !== second) removePair(first, second);
    }

    /** 取消旧局流程，不调用正常完成通知。 */
    cancel(): void {
        this.generation++;
        this.running = false;
        this.motion.cancel();
    }
}
