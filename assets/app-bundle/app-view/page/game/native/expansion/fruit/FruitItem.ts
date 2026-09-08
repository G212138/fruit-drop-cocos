import {
    _decorator, Component, Node, RigidBody2D, ERigidBody2DType,
    PolygonCollider2D, Contact2DType, Collider2D, Vec2, Vec3, Tween, IPhysics2DContact,
} from 'cc';
import { IceFruitView } from '../ice/IceFruitView';
import { reduceIceLayers } from '../ice/IceRules';
import { PHYSICS_RULES } from '../physics/PhysicsRules';
import { BoardEvents } from '../board/BoardEvents';
import { MatchCandidate } from '../matching/MatchRules';
import { FloorFruit } from '../failure/FloorFailureRules';
import { FruitVisual } from './FruitVisual';
import { ReviveVisualState } from '../revive/ReviveVisualState';
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
    /** 当前剩余冰层，单位层；大于零时不可点击下落。 */
    iceLayers = 0;
    /** 黑洞成员出现与避让阶段标记，为真时禁止点击和底部判负。 */
    spawning = false;
    /** 实例化的独立冰层表现，普通水果为空。 */
    private iceView: IceFruitView | null = null;

    /** @param layers 初始冰层数。 @param view 编辑器预制体实例上的冰层表现。 */
    attachIce(layers: number, view: IceFruitView): void {
        this.iceLayers = layers;
        this.iceView = view;
        view.initialize(layers);
    }

    /** 每次成功配对削减一层，不能由接触回调直接触发。 */
    reduceIce(): void {
        if (this.iceLayers <= 0) return;
        this.iceLayers = reduceIceLayers(this.iceLayers);
        this.iceView?.updateLayers(this.iceLayers);
    }

    /** 是否接触过原版地形，接触槽壁也会记录。 */
    touchedFloor = false;
    /** 配对锁定标记，避免同帧被重复消除。 */
    removing = false;
    /** 是否已经点击释放；释放后不参与整体补位。 */
    private released = false;
    /** 原版每颗水果仅首次动态触地播放草叶，复活不重复。 */
    private floorEffectPlayed = false;
    /** 每次实际下落前记录独立视觉快照，复活摆放与刚体恢复由流程层协调。 */
    readonly reviveVisual = new ReviveVisualState();

    /**
     * 初始化水果数据，默认悬停等待点击。
     * @param kind 原版水果编号，必须与预制体内序列化编号一致。
     */
    configure(kind: number): void {
        if (this.kind !== kind) throw new Error('水果预制体与配置编号不一致');
        this.iceLayers = 0;
        this.spawning = false;
        this.iceView = null;
        this.touchedFloor = false;
        this.removing = false;
        this.released = false;
        this.floorEffectPlayed = false;
        this.reviveVisual.clear();

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
        this.visual.clearWarning();
        this.reviveVisual.capture(this.node);
        this.released = true;
        this.body.type = ERigidBody2DType.Dynamic;
        // 原版像素每秒已经在 PhysicsRules 换算为 Creator 3.8 所需的物理米每秒。
        this.body.linearVelocity = new Vec2(0, PHYSICS_RULES.dropVelocityY);
        this.body.wakeUp();
    }

    /** 是否仍可参与整体补位。 */
    get waiting(): boolean {
        return !this.released && !this.removing;
    }

    /** 回收前关闭整颗刚体并恢复下落前外观，避免移动途中与槽壁碰撞。 */
    prepareRevive(): void {
        this.body.enabled = false;
        Tween.stopAllByTarget(this.node);
        this.visual.clearWarning();
        this.reviveVisual.restore();
        this.touchedFloor = false;
        this.removing = false;
        this.released = false;
        this.body.type = ERigidBody2DType.Static;
        this.body.linearVelocity = new Vec2();
        this.body.angularVelocity = 0;
    }

    /** 回收动画结束后恢复静态碰撞，不自动下落；下一次点击仍由棋盘批准。 */
    finishRevive(): void {
        this.body.type = ERigidBody2DType.Static;
        this.body.linearVelocity = new Vec2();
        this.body.angularVelocity = 0;
        this.body.enabled = !this.spawning;
    }

    /**
     * 复活时恢复未回收水果：已触底者继续动态模拟，其余按原版恢复静态等待。
     * 黑洞出现中的刚体继续禁用，交给出现流程完成碰撞保护。
     */
    resumeAfterRevive(): void {
        this.visual.clearWarning();
        this.removing = false;
        this.released = this.touchedFloor;
        this.body.type = this.touchedFloor ? ERigidBody2DType.Dynamic : ERigidBody2DType.Static;
        this.body.linearVelocity = new Vec2();
        this.body.angularVelocity = 0;
        this.body.enabled = !this.spawning;
        if (this.touchedFloor && !this.spawning) this.body.wakeUp();
    }

    /** @param shifting 为真时由动画驱动刚体，结束后恢复静态悬停。 */
    setShifting(shifting: boolean): void {
        this.body.type = shifting ? ERigidBody2DType.Animated : ERigidBody2DType.Static;
        this.body.linearVelocity = new Vec2();
        this.body.angularVelocity = 0;
    }

    /**
     * 新接触先进入配对队列，再记录原版即时失败检查所需的接触双方。
     * @param contact 引擎提供的世界接触点，不可用时回退水果中心。
     * @param self 物理引擎回调中的本水果碰撞体。
     * @param other 物理引擎回调中的另一方碰撞体。
     */
    private onContactBegan(self: Collider2D, other: Collider2D, contact?: IPhysics2DContact | null): void {
        if (other.node.name === 'Floor' && !this.floorEffectPlayed && !this.removing
            && this.body.type === ERigidBody2DType.Dynamic) {
            this.floorEffectPlayed = true;
            const point = contact?.getWorldManifold()?.points[0];
            const position = point ? new Vec3(point.x, point.y, 0) : this.node.worldPosition.clone();
            this.node.emit(BoardEvents.GroundImpact, position);
        }
        this.onContact(self, other);
        const fruit = other.getComponent(FruitItem);
        if (fruit) this.node.emit(BoardEvents.FruitContactBegan, this, fruit);
    }

    /** 提供判负快照，原版像素与度的静止阈值已换算为米与弧度。 */
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
        // 页面隐藏后无需再修改已停用刚体的类型和速度。
        if (this.body.enabledInHierarchy === false) return;
        // 结算时保持刚体激活并转为静态，避免补位节点仍待同步时销毁 Box2D 代理。
        this.body.type = ERigidBody2DType.Static;
        this.body.linearVelocity = new Vec2();
        this.body.angularVelocity = 0;
    }

    /** @param revived 是否为复活强制消除；使用原版较长的放大收缩反馈。 */
    pop(revived = false): void {
        this.prepareRemoval();
        if (revived) this.visual.playReviveRemoval(() => this.node.destroy());
        else this.visual.playRemoval(() => this.node.destroy());
    }

    /** 配对后先停用物理并保留既有节点，供独立入袋表现移动。 */
    prepareRemoval(): void {
        this.node.emit(BoardEvents.Removing);
        Tween.stopAllByTarget(this.node);
        // 整体停用刚体一次，保留碰撞体至节点销毁，避免同帧重复移除碰撞代理。
        this.body.enabled = false;
        this.visual.clearWarning();
    }

    /** 解除单体注册的所有监听。 */
    onDestroy(): void {
        this.reviveVisual.clear();
        this.node.targetOff(this);
        this.collider?.off(Contact2DType.BEGIN_CONTACT, this.onContactBegan, this);
        this.collider?.off(Contact2DType.PRE_SOLVE, this.onContact, this);
    }
}
