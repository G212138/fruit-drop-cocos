import { _decorator, Component, PhysicsSystem2D, Vec2 } from 'cc';
import { FloorFailureRules } from '../failure/FloorFailureRules';
import { FruitItem } from '../fruit/FruitItem';
import { LevelDefinition } from '../level/LevelDefinition';
import { MatchQueue } from '../matching/MatchQueue';
import { BoardEvents } from './BoardEvents';
import { FruitSpawner } from './FruitSpawner';
const { ccclass, property } = _decorator;

/** 棋盘只协调批次与配对，不包含 UI 布局和单体表现。 */
@ccclass('GameBoard')
export class GameBoard extends Component {
    @property(FruitSpawner)
    spawner: FruitSpawner = null!;

    private readonly matches = new MatchQueue<FruitItem>();
    private readonly failure = new FloorFailureRules();
    private readonly contacts: [string, string][] = [];
    private playing = false;
    private waveIndex = 0;
    private level: LevelDefinition = { waves: [] };

    /** 重置棋盘并载入已经校验的关卡。 */
    begin(level: LevelDefinition): void {
        this.clear();
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.gravity = new Vec2(0, -1600);
        this.level = level;
        this.waveIndex = 0;
        this.playing = true;
        this.spawnCurrentWave();
    }

    /** 请求实例模块生成当前批次。 */
    private spawnCurrentWave(): void {
        this.spawner.spawn(this.level.waves[this.waveIndex], fruit => this.bindFruit(fruit));
    }

    /** 为每个水果连接棋盘级事件。 */
    private bindFruit(fruit: FruitItem): void {
        fruit.node.on(BoardEvents.ReleaseRequested, this.release, this);
        fruit.node.on(BoardEvents.FruitContact, this.contact, this);
        fruit.node.on(BoardEvents.FruitContactBegan, this.recordContact, this);
    }

    /** 只有正在进行的棋盘允许下落。 */
    private release(fruit: FruitItem): void {
        if (this.playing) {
            fruit.drop();
        }
    }

    /** 将有效物理接触提交给去重队列。 */
    private contact(first: FruitItem, second: FruitItem): void {
        if (this.playing) {
            this.matches.enqueue(first, second);
        }
    }

    /** 保存新接触，等本帧配对优先处理完毕后再检查失败。 */
    private recordContact(first: FruitItem, second: FruitItem): void {
        if (this.playing) this.contacts.push([first.node.uuid, second.node.uuid]);
    }

    /** 在物理回调之外结算配对并检查下一批次。 */
    lateUpdate(dt: number): void {
        if (!this.playing) return;
        this.resolveMatches();
        if (!this.playing) return;
        this.advanceWave();
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

    /** 当前批次清空后生成下一批，不自行裁决整局胜利。 */
    private advanceWave(): void {
        if (this.spawner.count === 0 && this.waveIndex + 1 < this.level.waves.length) {
            this.waveIndex++;
            this.spawnCurrentWave();
        }
    }

    /** 停止棋盘输入和本局水果模拟。 */
    stop(): void {
        this.playing = false;
        this.matches.clear();
        this.contacts.length = 0;
        this.failure.reset();
        this.spawner.freeze();
    }

    /** 清理旧局实例及排队通知。 */
    clear(): void {
        this.playing = false;
        this.matches.clear();
        this.contacts.length = 0;
        this.failure.reset();
        this.spawner.clear();
    }

    /** 页面销毁时清理本棋盘，不关闭全局物理系统。 */
    onDestroy(): void {
        this.playing = false;
        this.matches.clear();
        this.contacts.length = 0;
        this.failure.reset();
    }
}
