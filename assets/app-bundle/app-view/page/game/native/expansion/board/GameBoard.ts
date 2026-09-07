import { _decorator, Component, PhysicsSystem2D, Vec2 } from 'cc';
import { PHYSICS_RULES } from '../physics/PhysicsRules';
import { FloorFailureRules } from '../failure/FloorFailureRules';
import { FruitItem } from '../fruit/FruitItem';
import { FruitShift } from '../movement/FruitShift';
import { LevelDefinition } from '../level/LevelDefinition';
import { MatchQueue } from '../matching/MatchQueue';
import { BoardEvents } from './BoardEvents';
import { FruitSpawner } from './FruitSpawner';
const { ccclass, property } = _decorator;

/** 棋盘只协调配对、补位与判负，不包含 UI 布局和单体表现。 */
@ccclass('GameBoard')
export class GameBoard extends Component {
    /** 预制体绑定的水果实例管理器，负责生成和清理整关水果。 */
    @property(FruitSpawner)
    spawner: FruitSpawner = null!;

    /** 本帧匹配去重队列，先锁定双方再延迟结算。 */
    private readonly matches = new MatchQueue<FruitItem>();
    /** 独立底部失败计时器，每局重置。 */
    private readonly failure = new FloorFailureRules();
    /** 本帧新接触双方的节点标识，物理步结束后检查。 */
    private readonly contacts: [string, string][] = [];
    /** 是否允许当前棋盘处理输入和物理结果。 */
    private playing = false;
    /** 原版纵向补位协调器；动画期间锁定点击。 */
    private readonly shift = new FruitShift();

    /**
     * 重置棋盘并载入已经校验的关卡。
     * @param level 已验证关卡配置或从一开始的关卡编号，具体类型见声明。
     */
    begin(level: LevelDefinition): void {
        this.clear();
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.gravity = new Vec2(0, PHYSICS_RULES.gravityY);

        this.playing = true;
        this.spawner.spawn(level.fruits, fruit => this.bindFruit(fruit));
    }

    /**
     * 为每个水果连接棋盘级事件。
     * @param fruit 本次操作的水果实例。
     */
    private bindFruit(fruit: FruitItem): void {
        fruit.node.on(BoardEvents.ReleaseRequested, this.release, this);
        fruit.node.on(BoardEvents.FruitContact, this.contact, this);
        fruit.node.on(BoardEvents.FruitContactBegan, this.recordContact, this);
    }

    /**
     * 只有正在进行的棋盘允许下落。
     * @param fruit 本次操作的水果实例。
     */
    private release(fruit: FruitItem): void {
        if (this.playing && !this.shift.busy && fruit.waiting) {
            fruit.drop();
            this.shift.begin(this.spawner.getWaiting());
        }
    }

    /**
     * 将有效物理接触提交给去重队列。
     * @param first 接触或配对中的第一方，标识与快照必须属于同一棋盘。
     * @param second 接触或配对中的第二方，不得与第一方为同一实例。
     */
    private contact(first: FruitItem, second: FruitItem): void {
        if (this.playing) {
            this.matches.enqueue(first, second);
        }
    }

    /**
     * 保存新接触，等本帧配对优先处理完毕后再检查失败。
     * @param first 接触或配对中的第一方，标识与快照必须属于同一棋盘。
     * @param second 接触或配对中的第二方，不得与第一方为同一实例。
     */
    private recordContact(first: FruitItem, second: FruitItem): void {
        if (this.playing) this.contacts.push([first.node.uuid, second.node.uuid]);
    }

    /**
     * 在物理回调之外结算配对并检查底部失败。
     * @param dt 距上一帧的时间，单位秒。
     */
    lateUpdate(dt: number): void {
        if (!this.playing) return;
        this.resolveMatches();
        if (!this.playing) return;
        const fruits = this.spawner.getFloorSnapshots();
        const contactFailure = this.contacts.splice(0).some(([first, second]) =>
            this.failure.losesOnContact(fruits, first, second));
        if (contactFailure || this.failure.tick(fruits, dt)) {
            this.stop();
            this.node.emit(BoardEvents.Failed);
        }
    }

    /** 移除双方后才发布配对事件，避免结算重入污染集合。 */
    private resolveMatches(): void {
        for (const [first, second] of this.matches.drain()) {
            if (!this.playing) break;
            this.spawner.remove(first);
            this.spawner.remove(second);
            first.node.targetOff(this);
            second.node.targetOff(this);
            first.pop();
            second.pop();
            this.node.emit(BoardEvents.Matched);
        }
    }

    /** 停止棋盘输入和本局水果模拟。 */
    stop(): void {
        this.playing = false;
        this.shift.stop();
        this.matches.clear();
        this.contacts.length = 0;
        this.failure.reset();
        this.spawner.freeze();
    }

    /** 清理旧局实例及排队通知。 */
    clear(): void {
        this.playing = false;
        this.shift.stop();
        this.matches.clear();
        this.contacts.length = 0;
        this.failure.reset();
        this.spawner.clear();
    }

    /** 页面销毁时清理本棋盘，不关闭全局物理系统。 */
    onDestroy(): void {
        this.playing = false;
        this.shift.stop();
        this.matches.clear();
        this.contacts.length = 0;
        this.failure.reset();
    }
}
