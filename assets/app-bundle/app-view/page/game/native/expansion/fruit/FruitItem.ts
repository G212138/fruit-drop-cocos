import {
    _decorator, Component, Node, RigidBody2D, ERigidBody2DType,
    PolygonCollider2D, Contact2DType, Collider2D, Vec2, Tween,
} from 'cc';
import { PHYSICS_RULES } from '../physics/PhysicsRules';
import { BoardEvents } from '../board/BoardEvents';
import { MatchCandidate } from '../matching/MatchRules';
import { FloorFruit } from '../failure/FloorFailureRules';
import { FruitVisual } from './FruitVisual';
const { ccclass, property } = _decorator;

/** 水果单体负责输入和物理，上报接触而不裁决消除。 */
@ccclass('FruitItem')
export class FruitItem extends Component {
    /** 预制体绑定的单体视觉组件。 */
    @property(FruitVisual)
    visual: FruitVisual = null!;

    /** 预制体绑定的二维刚体，控制悬停、补位和下落。 */
    @property(RigidBody2D)
    body: RigidBody2D = null!;

    /** 原版轮廓对应的多边形碰撞体。 */
    @property(PolygonCollider2D)
    collider: PolygonCollider2D = null!;

    /** 原版水果类型，由各自预制体序列化，禁止猜测数组下标。 */
    @property
    kind = 0;
    /** 是否接触过原版地形，接触槽壁也会记录。 */
    touchedFloor = false;
    /** 配对锁定标记，避免同帧被重复消除。 */
    removing = false;
    /** 是否已经点击释放；释放后不参与整体补位。 */
    private released = false;

    /**
     * 初始化水果数据，默认悬停等待点击。
     * @param kind 原版水果编号，必须与预制体内序列化编号一致。
     */
    configure(kind: number): void {
        if (this.kind !== kind) throw new Error('水果预制体与配置编号不一致');
        this.touchedFloor = false;
        this.removing = false;
        this.released = false;

        this.body.type = ERigidBody2DType.Static;
    }

    /** 注册单体输入和物理通知。 */
    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.requestRelease, this);
        this.collider.on(Contact2DType.BEGIN_CONTACT, this.onContactBegan, this);
        this.collider.on(Contact2DType.PRE_SOLVE, this.onContact, this);
    }

    /** 请求棋盘确认本局是否允许下落。 */
    private requestRelease(): void {
        if (!this.released && !this.removing) {
            this.node.emit(BoardEvents.ReleaseRequested, this);
        }
    }

    /** 棋盘批准后启动动态刚体。 */
    drop(): void {
        this.released = true;
        this.body.type = ERigidBody2DType.Dynamic;
        // 沿用原版释放速度值；Creator 2D 线速度接口使用物理米每秒。
        this.body.linearVelocity = new Vec2(0, PHYSICS_RULES.dropVelocityY);
        this.body.wakeUp();
    }

    /** 是否仍可参与整体补位。 */
    get waiting(): boolean {
        return !this.released && !this.removing;
    }

    /** @param shifting 为真时由动画驱动刚体，结束后恢复静态悬停。 */
    setShifting(shifting: boolean): void {
        this.body.type = shifting ? ERigidBody2DType.Animated : ERigidBody2DType.Static;
        this.body.linearVelocity = new Vec2();
        this.body.angularVelocity = 0;
    }

    /**
     * 新接触先进入配对队列，再记录原版即时失败检查所需的接触双方。
     * @param self 物理引擎回调中的本水果碰撞体。
     * @param other 物理引擎回调中的另一方碰撞体。
     */
    private onContactBegan(self: Collider2D, other: Collider2D): void {
        this.onContact(self, other);
        const fruit = other.getComponent(FruitItem);
        if (fruit) this.node.emit(BoardEvents.FruitContactBegan, this, fruit);
    }

    /** 提供判负快照，沿用原版线速度平方二十五和角速度五的静止阈值。 */
    getFloorSnapshot(): FloorFruit {
        const velocity = this.body.linearVelocity;
        return {
            ...this.getMatchCandidate(),
            id: this.node.uuid,
            settled: this.body.type !== ERigidBody2DType.Dynamic
                || (velocity.lengthSqr() <= PHYSICS_RULES.settledSpeedSquared && Math.abs(this.body.angularVelocity) <= PHYSICS_RULES.settledAngularSpeed),
        };
    }

    /**
     * 记录触底并将水果接触交给棋盘处理。
     * @param _self 物理引擎回调中的本水果碰撞体。
     * @param other 物理引擎回调中的另一方碰撞体。
     */
    private onContact(_self: Collider2D, other: Collider2D): void {
        if (other.node.name === 'Floor' && !this.touchedFloor) {
            this.touchedFloor = true;
            this.node.emit(BoardEvents.FirstFloorContact, this.body.type === ERigidBody2DType.Dynamic);
        }
        const fruit = other.getComponent(FruitItem);
        if (fruit) {
            this.node.emit(BoardEvents.FruitContact, this, fruit);
        }
    }

    /** 提供纯数据快照，规则模块无需读取引擎对象。 */
    getMatchCandidate(): MatchCandidate {
        return {
            kind: this.kind,
            y: this.node.position.y,
            touchedFloor: this.touchedFloor,
            removing: this.removing,
        };
    }

    /** 停止本水果的模拟，不影响其他页面的全局物理开关。 */
    freeze(): void {
        // 结算时保持刚体激活并转为静态，避免补位节点仍待同步时销毁 Box2D 代理。
        this.body.type = ERigidBody2DType.Static;
        this.body.linearVelocity = new Vec2();
        this.body.angularVelocity = 0;
    }

    /** 在物理步结束后关闭碰撞并播放消除表现。 */
    pop(): void {
        this.node.emit(BoardEvents.Removing);
        Tween.stopAllByTarget(this.node);
        // 整体停用刚体一次，保留碰撞体至节点销毁，避免同帧重复移除碰撞代理。
        this.body.enabled = false;
        this.visual.playRemoval(() => this.node.destroy());
    }

    /** 解除单体注册的所有监听。 */
    onDestroy(): void {
        this.node.targetOff(this);
        this.collider?.off(Contact2DType.BEGIN_CONTACT, this.onContactBegan, this);
        this.collider?.off(Contact2DType.PRE_SOLVE, this.onContact, this);
    }
}
