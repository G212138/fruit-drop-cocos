import { BoardPropFlow } from '../props/BoardPropFlow';
import { FruitShake } from '../physics/FruitShake';
import { GameHaptics } from '../../../../../../../app-builtin/app-controller/expansion/GameHaptics';
import { PropKind } from '../props/PropRules';
import { _decorator, Component, PhysicsSystem2D, Vec2, Vec3, Node, RigidBody2D, UITransform, PolygonCollider2D } from 'cc';
import { EntryFlow } from '../movement/EntryFlow';
import { LevelHintView } from '../hint/LevelHintView';
import { chooseHint } from '../hint/HintRules';
import { LockWallView } from '../reward/LockWallView';
import { HorizontalFlow } from '../movement/HorizontalFlow';
import { PHYSICS_RULES } from '../physics/PhysicsRules';
import { FloorFailureRules } from '../failure/FloorFailureRules';
import { FloorWarningRules } from '../failure/FloorWarningRules';
import { FruitItem } from '../fruit/FruitItem';
import { FruitShift } from '../movement/FruitShift';
import { VerticalShiftGate } from '../movement/VerticalShiftRules';
import { LevelDefinition } from '../level/LevelDefinition';
import { MatchQueue } from '../matching/MatchQueue';
import { BoardEvents } from './BoardEvents';
import { FruitSpawner } from './FruitSpawner';
import { BoardReviveFlow } from '../revive/BoardReviveFlow';
import { RemovalEffects } from '../effects/RemovalEffects';
const { ccclass, property } = _decorator;

/** 棋盘只协调配对、补位与判负，不包含 UI 布局和单体表现。 */
@ccclass('GameBoard')
export class GameBoard extends Component {
    /** 独立消除特效预制体实例，视觉位于水果上层，不参与物理和水果计数。 */
    @property(Node)
    removalEffectsRoot: Node = null!;
    /** 从独立预制体读取特效组件，避免跨预制体组件绑定丢失。 */
    private get removalEffects(): RemovalEffects | null {
        return this.removalEffectsRoot?.getComponent(RemovalEffects) ?? null;
    }
    /** 独立锁墙预制体节点，保持原版位置并由奖励流程解锁。 */
    @property(Node)
    lockWallRoot: Node = null!;
    /** 当前局是否可以发起扩槽；提示和入场期间不接收请求。 */
    get canExpand(): boolean {
        return this.playing && !this.levelHint?.busy && !this.entry.busy && !this.shake.busy
            && !!this.lockWallRoot && !this.lockWallRoot.getComponent(LockWallView)!.unlocked;
    }
    /** 原版普通槽四个判负，扩槽后五个判负，单位个。 */
    private get floorThreshold(): number {
        return this.lockWallRoot?.getComponent(LockWallView)?.unlocked ? 5 : 4;
    }

    /** 注册预制体锁墙的请求事件，不直接绑定广告平台。 */
    onLoad(): void {
        this.lockWallRoot.on('unlock-request', this.requestExpansion, this);
    }

    /** 向页面发布当前局扩槽意图，页面负责广告门禁。 */
    private requestExpansion(): void {
        if (this.canExpand) this.node.emit('expand-request');
    }

    /** 仅在本局仍可接收奖励时移除锁墙，返回是否实际发放。 */
    expandSlot(): boolean {
        if (!this.canExpand) return false;
        const expanded = this.lockWallRoot.getComponent(LockWallView)!.unlock();
        if (expanded) this.failure.reset();
        return expanded;
    }
    /** 独立原版机制提示，展示结束后才推进水果入场。 */
    @property(Node)
    levelHintRoot: Node = null!;
    /** 从序列化的独立提示节点读取运行时组件，避免编辑器跨预制体脚本引用丢失。 */
    private get levelHint(): LevelHintView | null {
        return this.levelHintRoot?.getComponent(LevelHintView) ?? null;
    }
    /** 预制体绑定的水果实例管理器，负责生成和清理整关水果。 */
    @property(FruitSpawner)
    spawner: FruitSpawner = null!;
    /** 横向模式关闭原版左墙，允许场外水果向右进入。 */
    @property(Node)
    leftBoundary: Node = null!;
    /** 原版右侧虚线，位置和尺寸参与自动下落范围。 */
    @property(Node)
    rightLine: Node = null!;
    /** 当前关卡原始移动模式。 */
    private mode: 1 | 2 = 1;
    /** 第二关起的纵向关卡按斜坡安全距离自动补位；横向关卡保持原移动规则。 */
    private automaticShift = false;
    /** 正在爆炸或入袋的普通配对数；入袋结束前不提交失败，避免丢失配对计数。 */
    private collectingPairs = 0;
    /** 清局使尚未结束的入袋通知失效。 */
    private collectionGeneration = 0;
    /** 独立横向补位与自动下落状态。 */
    private readonly horizontal = new HorizontalFlow();
    /** 独立开局入场动画与输入锁。 */
    private readonly entry = new EntryFlow();

    /** 本帧匹配去重队列，先锁定双方再延迟结算。 */
    private readonly matches = new MatchQueue<FruitItem>();
    /** 独立底部失败计时器，每局重置。 */
    private readonly failure = new FloorFailureRules();
    /** 独立危险提醒计时，不与判负延时共享状态。 */
    private readonly warning = new FloorWarningRules();
    /** 是否允许当前棋盘处理输入和物理结果。 */
    private playing = false;
    /** 原版纵向补位协调器；动画期间锁定点击。 */
    private readonly shift = new FruitShift();
    /** 道具独立实例流程。 */
    private readonly props = new BoardPropFlow();
    /** 场地容器运动与真实碰撞反馈。 */
    private readonly shake = new FruitShake();
    /** 本局已运行秒数；暂停时不推进摇晃冷却。 */
    private shakeTime = 0;

    /** 可操作阶段触发整个水果群摇晃，包含未点击的悬停水果。 */
    shakeFruits(): boolean {
        if (!this.canUseProp) return false;
        const count = this.shake.apply(this.spawner.getLive(), this.shakeTime, this.node);
        if (count) {
            GameHaptics.impact();
            this.removalEffects?.playShakeSound();
        }
        return count > 0;
    }
    /** 当前棋盘是否接受道具操作。 */
    get canUseProp(): boolean {
        return this.playing && !this.levelHint?.busy && !this.entry.busy && !this.shift.busy
            && !this.props.busy && !this.revival.busy && !this.shake.busy && this.collectingPairs === 0;
    }
    /** @param kind 道具类型。 @param consume 确定目标后的库存扣减。 */
    useProp(kind: PropKind, consume: () => boolean): string {
        if (!this.canUseProp) return "请等待当前动画结束";
        const result = this.props.use(kind, this.spawner, consume, (a,b) => { this.removalEffects?.beginRevive(); this.removePair(a,b,true); });
        if (!result) {
            if (kind === 'shuffle') {
                this.shiftGate.reset();
                for (const fruit of this.spawner.getLive()) {
                    if (!fruit.waiting) this.shiftGate.request(fruit.node.uuid);
                }
            }
            this.shiftGate.request('prop-completed');
        }
        return result;
    }
    /** ????????????????500?????????????? */
    fruitDisplayTop = 500;
    /** 等本批已释放水果全部到达洞口后再请求纵向补位。 */
    private readonly shiftGate = new VerticalShiftGate();
    /** 独立复活实例流程，包含回收动画及旧局取消。 */
    private readonly revival = new BoardReviveFlow();
    /** 只有确实由当前棋盘判负的局才可复活。 */
    private failed = false;

    /** 当前棋盘是否等待失败复活，胜利或已经恢复时拒绝重复奖励。 */
    get canRevive(): boolean {
        return this.failed && !this.revival.busy;
    }

    /** 奖励与权威状态校验后，恢复当前实例；不重新载入关卡配置。 */
    revive(): boolean {
        if (!this.canRevive) return false;
        this.removalEffects?.beginRevive();
        this.failed = false;
        return this.revival.begin(this.mode, this.spawner, (first, second) => this.removePair(first, second, true), () => {
            this.matches.clear();
            this.failure.reset();
            this.warning.reset();
            this.playing = true;
        });
    }

    /**
     * 重置棋盘并载入已经校验的关卡。
     * @param level 已验证关卡配置或从一开始的关卡编号，具体类型见声明。
     */
    begin(level: LevelDefinition): void {
        this.clear();
        this.mode = level.mode;
        this.automaticShift = level.number >= 2 && level.mode === 1;
        this.lockWallRoot.getComponent(LockWallView)!.reset();
        // 左墙没有可见图片；仅停用刚体，避免节点与碰撞体同时停用时重复移除物理代理。
        this.leftBoundary.getComponent(RigidBody2D)!.enabled = this.mode !== 2;
        this.rightLine.active = this.mode === 2;
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.gravity = new Vec2(0, PHYSICS_RULES.gravityY);

        this.guideDismissed = level.number !== 1;
        this.playing = true;
        this.spawner.spawn(level.fruits, fruit => this.bindFruit(fruit));
        // 编辑草稿可能全部位于屏幕上方，按既有补位规则移入可点击区域。
        if (this.mode === 2) this.horizontal.begin(this.spawner.getWaiting(), this.rightLine);
        const size = this.node.getComponent(UITransform)!.contentSize;
        const waiting = this.spawner.getWaiting();
        const finalDeltaY = this.mode === 1
            ? this.shift.entryDelta(waiting, this.fruitDisplayTop - 60, this.node.getChildByName('Floor'), this.automaticShift) : 0;
        this.entry.begin(waiting, this.mode, { left: -size.width / 2, top: size.height / 2 }, finalDeltaY);
        this.spawner.updateBlackHoles(0);
        if (!this.levelHint) throw new Error('关卡提示预制体绑定缺失');
        this.levelHint.play(chooseHint(level));
    }

    /** 第一关第一次有效点击后永久隐藏本局手指。 */
    private guideDismissed = true;
    /** 入场和补位结束后选择可见的右侧水果，跟随实际位置避免适配后指向空处。 */
    get guideTarget(): Node | null {
        if (this.guideDismissed || !this.playing || this.levelHint?.busy || this.entry.busy || this.shift.busy) return null;
        const candidates = this.spawner.getWaiting().filter(fruit => !fruit.spawning && fruit.iceLayers === 0
            && fruit.node.position.y <= this.fruitDisplayTop - 60);
        candidates.sort((a,b) => b.node.position.x - a.node.position.x);
        return candidates[0]?.node ?? null;
    }
    /** @param position 首次动态触地的世界接触坐标，不在物理回调内改变任何刚体。 */
    private showGroundImpact(position: Vec3): void {
        if (this.playing) this.removalEffects?.showGroundImpact(position);
    }

    /**
     * 为每个水果连接棋盘级事件。
     * @param fruit 本次操作的水果实例。
     */
    private bindFruit(fruit: FruitItem): void {
        fruit.node.on(BoardEvents.GroundImpact, this.showGroundImpact, this);
        fruit.node.on(BoardEvents.ReleaseRequested, this.release, this);
        fruit.node.on(BoardEvents.FruitContact, this.contact, this);
    }

    /**
     * 只有正在进行的棋盘允许下落。
     * @param fruit 本次操作的水果实例。
     * @param userTriggered 是否由玩家点击触发；自动下落传 false，不播放点击震动。
     */
    private release(fruit: FruitItem, userTriggered = true): void {
        if (this.playing && !this.levelHint?.busy && !this.entry.busy && !this.shift.busy && !this.props.busy && fruit.waiting && !fruit.spawning && fruit.iceLayers === 0) {
            this.guideDismissed = true;
            this.shake.release(fruit);
            this.spawner.releaseBlackHole(fruit);
            fruit.drop();
            if (userTriggered) GameHaptics.impact();
            if (this.mode === 2) this.horizontal.afterDrop(this.spawner.getWaiting(), this.rightLine);
            else this.shiftGate.request(fruit.node.uuid);
        }
    }

    /**
     * 将有效物理接触提交给去重队列。
     * @param first 接触或配对中的第一方，标识与快照必须属于同一棋盘。
     * @param second 接触或配对中的第二方，不得与第一方为同一实例。
     */
    private contact(first: FruitItem, second: FruitItem): void {
        if (first.shakingSuspended || second.shakingSuspended) return;
        if (this.playing) {
            const layout = this.readCavityLayout();
            if (!layout) return;
            const firstY = layout.transform.convertToNodeSpaceAR(first.node.worldPosition).y;
            const secondY = layout.transform.convertToNodeSpaceAR(second.node.worldPosition).y;
            if (firstY > layout.region.matchTop || secondY > layout.region.matchTop) return;
            this.matches.enqueue(first, second);
        }
    }


    /**
     * 在物理回调之外结算配对并检查底部失败。
     * @param dt 距上一帧的时间，单位秒。
     */
    lateUpdate(dt: number): void {
        if (!this.playing) return;
        this.shakeTime += dt;
        this.shake.tick(this.spawner.getLive(), dt);
        if (this.levelHint?.busy) return;
        if (this.entry.busy) {
            this.entry.tick(dt);
            this.spawner.updateBlackHoles(0);
            return;
        }
        if (this.mode === 2 && !this.shake.busy) this.horizontal.tick(dt, this.spawner.getLive(), this.spawner.getWaiting(), this.rightLine, fruit => this.release(fruit, false));
        if (this.props.busy) return;
        this.spawner.updateBlackHoles(dt);
        this.matchTouchingFruits();
        this.resolveMatches();
        if (!this.playing) return;
        if (this.automaticShift && this.canUseProp) {
            this.shift.begin(this.spawner.getWaiting(), this.fruitDisplayTop - 60, this.node.getChildByName('Floor'), true);
        }
        if (!this.automaticShift && this.mode === 1 && !this.shake.busy && this.shiftGate.consume(
            this.spawner.getLive().map(fruit => ({ id: fruit.node.uuid, y: fruit.node.position.y })), this.shift.busy,
        )) this.shift.begin(this.spawner.getWaiting(), this.fruitDisplayTop - 60, this.node.getChildByName('Floor'));
        if (this.collectingPairs > 0) return;
        const fruits = this.spawner.getFloorSnapshots();
        const warning = this.warning.tick(fruits, dt, this.floorThreshold === 5);
        if (warning === 'clear') this.restoreWarnings();
        else if (warning === 'flash') {
            for (const fruit of this.spawner.getLive()) {
                if (fruit.touchedFloor && !fruit.removing) fruit.visual.flashWarning();
            }
        }
        const contactFailure = this.checkLayoutFailure();
        // 只有洞内最高水果与下方水果真实接触才判负，不按触地总数提前结束。
        if (contactFailure) {
            this.stop();
            this.failed = true;
            this.node.emit(BoardEvents.Failed);
        }
    }

    /** 补查持续接触和休眠刚体；使用真实接触集合，不按图片距离猜测。 */
    private matchTouchingFruits(): void {
        const live = this.spawner.getLive();
        const byId = new Map(live.map(fruit => [fruit.node.uuid, fruit]));
        for (const first of live) {
            for (const id of first.getFloorSnapshot().contacts ?? []) {
                const second = byId.get(id);
                if (second) this.contact(first, second);
            }
        }
    }

    /** 只读当前地形轮廓和锁墙布局，统一提供消除入口与失败区域。 */
    private readCavityLayout() {
        const floor = this.node.getChildByName('Floor');
        const transform = floor?.getComponent(UITransform);
        const collider = floor?.getComponent(PolygonCollider2D);
        const lock = this.lockWallRoot?.getComponent(UITransform);
        if (!transform || !collider || !lock) return null;
        // 锁墙视觉宽度覆盖洞口内壁，用于从现有地形多边形筛出凹槽轮廓。
        const left = transform.convertToNodeSpaceAR(lock.convertToWorldSpaceAR(new Vec3(-lock.width * lock.anchorX, 0, 0))).x;
        const right = transform.convertToNodeSpaceAR(lock.convertToWorldSpaceAR(new Vec3(lock.width * (1 - lock.anchorX), 0, 0))).x;
        const neck = collider.points.map(point => ({ x: point.x + collider.offset.x, y: point.y + collider.offset.y }))
            .filter(point => point.x >= Math.min(left, right) && point.x <= Math.max(left, right));
        if (neck.length < 4) return null;
        const region = {
            left: Math.min(...neck.map(point => point.x)),
            right: Math.max(...neck.map(point => point.x)),
            bottom: Math.min(...neck.map(point => point.y)),
            top: Math.max(...neck.map(point => point.y)),
            // 洞口上方预留一个槽宽，容纳入口堆叠的水果；随地形缩放，不使用屏幕固定高度。
            matchTop: Math.max(...neck.map(point => point.y)) + Math.max(...neck.map(point => point.x)) - Math.min(...neck.map(point => point.x)),
        };
        return { transform, region };
    }

    /** 在地形局部坐标中判定洞内接触堆叠，消除保护使用同一入口边界。 */
    private checkLayoutFailure(): boolean {
        const layout = this.readCavityLayout();
        if (!layout) return false;
        const { transform, region } = layout;
        const fruits = this.spawner.getLive().map(fruit => {
            const position = transform.convertToNodeSpaceAR(fruit.node.worldPosition);
            return { ...fruit.getFloorSnapshot(), x: position.x, y: position.y };
        });
        return this.failure.losesOnStack(fruits, this.floorThreshold, region);
    }

    /** 移除双方后才发布配对事件，避免结算重入污染集合。 */
    private resolveMatches(): void {
        for (const [first, second] of this.matches.drain()) {
            if (!this.playing) break;
            if (first.shakingSuspended || second.shakingSuspended) continue;
            this.removePair(first, second, false);
            GameHaptics.impact();
        }
    }

    /** @param first 第一颗实例。 @param second 同类伙伴。 @param forced 是否为复活强制配对。 */
    private removePair(first: FruitItem, second: FruitItem, forced: boolean): void {
        this.shake.release(first);
        this.shake.release(second);
        if (forced) this.removalEffects?.showRevivePair(first.node, second.node);
        first.removing = second.removing = true;
        this.spawner.remove(first);
        this.spawner.remove(second);
        first.node.targetOff(this);
        second.node.targetOff(this);
        this.shift.remove(first);
        this.shift.remove(second);
        const effects = this.removalEffects;
        if (!forced && effects) {
            const generation = this.collectionGeneration;
            this.collectingPairs++;
            first.prepareRemoval();
            second.prepareRemoval();
            effects.showNormalPair(first.node, second.node, () => {
                if (generation !== this.collectionGeneration) return;
                this.collectingPairs--;
                this.node.emit(BoardEvents.Matched);
            });
        } else {
            first.pop(forced);
            second.pop(forced);
        }
        // 原版 markElimination 对复活移除也累计减冰；复活阶段不累计横向补位。
        this.spawner.reduceIce();
        if (!forced && this.mode === 2) this.horizontal.matched();
        if (forced || !effects) this.node.emit(BoardEvents.Matched);
    }

    /** 停止棋盘输入和本局水果模拟。 */
    stop(): void {
        this.shake.stop();
        this.revival.cancel();
        this.warning.reset();
        this.restoreWarnings();
        this.levelHint?.stop();
        this.entry.cancel();
        this.horizontal.reset();
        this.playing = false;
        this.props.cancel();
        this.shift.stop();
        this.shiftGate.reset();
        this.matches.clear();
        this.failure.reset();
        this.spawner.freeze();
    }

    /** 清理旧局实例及排队通知。 */
    clear(): void {
        this.shake.reset();
        this.shakeTime = 0;
        this.collectionGeneration++;
        this.collectingPairs = 0;
        this.removalEffects?.clear();
        this.failed = false;
        this.revival.cancel();
        this.warning.reset();
        this.restoreWarnings();
        this.levelHint?.stop();
        this.entry.cancel();
        this.horizontal.reset();
        this.playing = false;
        this.props.cancel();
        this.shift.stop();
        this.shiftGate.reset();
        this.matches.clear();
        this.failure.reset();
        this.spawner.clear();
    }

    /** 页面销毁时清理本棋盘，不关闭全局物理系统。 */
    onDestroy(): void {
        this.shake.stop();
        this.collectionGeneration++;
        this.revival.cancel();
        this.warning.reset();
        this.playing = false;
        this.props.cancel();
        this.shift.stop();
        this.shiftGate.reset();
        this.matches.clear();
        this.failure.reset();
    }

    /** 恢复当前存活水果颜色，消除中的水果由自身表现组件清理。 */
    private restoreWarnings(): void {
        for (const fruit of this.spawner.getLive()) fruit.visual.clearWarning();
    }
}
