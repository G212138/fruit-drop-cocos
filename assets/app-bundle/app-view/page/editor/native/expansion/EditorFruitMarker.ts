import { _decorator, Component, Sprite, Label, Node, EventTouch, UITransform, Vec3, Color } from 'cc';
const { ccclass, property } = _decorator;

/** 编辑器水果标记：只有图片与拖拽，不含游戏刚体和消除行为。 */
@ccclass('EditorFruitMarker')
export class EditorFruitMarker extends Component {
    /** 原版水果图片组件，预制体绑定。 */
    @property(Sprite)
    icon: Sprite = null!;
    /** 隐藏、冰层与黑洞关系的编辑提示，不进入游戏试玩。 */
    @property(Label)
    badge: Label = null!;
    /** 草稿中的稳定下标，仅在本次刷新周期使用。 */
    index = -1;
    /** 拖拽开始时鼠标到标记中心的差值，单位父节点设计像素。 */
    private offset = new Vec3();

    /** 只注册本标记的输入。 */
    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.beginDrag, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.moveDrag, this);
        this.node.on(Node.EventType.TOUCH_END, this.endDrag, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.endDrag, this);
    }
    /** @param selected 是否为当前选中水果。 */
    highlight(selected: boolean): void {
        this.icon.color = selected ? new Color(190, 255, 190) : Color.WHITE;
    }
    /** @param event 点击起点；位置换算为父节点局部设计像素。 */
    private beginDrag(event: EventTouch): void {
        const point = this.localPoint(event);
        Vec3.subtract(this.offset, this.node.position, point);
        this.node.parent!.emit('editor-select', this.index);
        event.propagationStopped = true;
    }
    /** @param event 拖拽位置，保持初始点击偏移防止水果跳到指针中心。 */
    private moveDrag(event: EventTouch): void {
        const point = this.localPoint(event).add(this.offset);
        this.node.setPosition(point);
        this.node.parent!.emit('editor-move', this.index, point.x, point.y);
        event.propagationStopped = true;
    }
    /** @param event 松开或取消时结束拖拽，交给页面保存最终坐标。 */
    private endDrag(event: EventTouch): void {
        this.node.parent!.emit('editor-drag-end');
        event.propagationStopped = true;
    }
    /** @param event 屏幕输入；返回父容器局部坐标。 */
    private localPoint(event: EventTouch): Vec3 {
        const point = event.getUILocation();
        return this.node.parent!.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(point.x, point.y, 0));
    }
    /** 页面刷新和关闭时解除拖拽事件。 */
    onDestroy(): void {
        this.node.targetOff(this);
    }
}
