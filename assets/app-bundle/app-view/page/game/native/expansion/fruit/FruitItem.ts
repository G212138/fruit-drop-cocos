import {
    _decorator, Component, Node, RigidBody2D, ERigidBody2DType,
    CircleCollider2D, Contact2DType, Collider2D, SpriteFrame,
} from 'cc';
import { BoardEvents } from '../board/BoardEvents';
import { MatchCandidate } from '../matching/MatchRules';
import { FruitVisual } from './FruitVisual';
const { ccclass, property } = _decorator;

/** 水果单体负责输入和物理，上报接触而不裁决消除。 */
@ccclass('FruitItem')
export class FruitItem extends Component {
    @property(FruitVisual)
    visual: FruitVisual = null!;

    @property(RigidBody2D)
    body: RigidBody2D = null!;

    @property(CircleCollider2D)
    collider: CircleCollider2D = null!;

    kind = 0;
    touchedFloor = false;
    removing = false;
    private released = false;

    /** 初始化水果数据，默认悬停等待点击。 */
    configure(kind: number, frame: SpriteFrame): void {
        this.kind = kind;
        this.touchedFloor = false;
        this.removing = false;
        this.released = false;
        this.visual.setFrame(frame);
        this.body.type = ERigidBody2DType.Static;
    }

    /** 注册单体输入和物理通知。 */
    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.requestRelease, this);
        this.collider.on(Contact2DType.BEGIN_CONTACT, this.onContact, this);
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
        this.body.wakeUp();
    }

    /** 记录触底并将水果接触交给棋盘处理。 */
    private onContact(_self: Collider2D, other: Collider2D): void {
        if (other.node.name === 'Floor') {
            this.touchedFloor = true;
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
        this.body.enabled = false;
    }

    /** 在物理步结束后关闭碰撞并播放消除表现。 */
    pop(): void {
        this.freeze();
        this.collider.enabled = false;
        this.visual.playRemoval(() => this.node.destroy());
    }

    /** 解除单体注册的所有监听。 */
    onDestroy(): void {
        this.node.targetOff(this);
        this.collider?.off(Contact2DType.BEGIN_CONTACT, this.onContact, this);
        this.collider?.off(Contact2DType.PRE_SOLVE, this.onContact, this);
    }
}
