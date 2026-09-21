import { _decorator, Component, Node, Button, ScrollView, UITransform, EventTouch, Tween, tween, Vec3 } from 'cc';
import { CollectionSwipe } from './CollectionSwipe';
const { ccclass, property } = _decorator;
/** 只移动编辑器创建的图鉴页面，纵向列表各自保留位置。 */
@ccclass('CollectionPager')
export class CollectionPager extends Component {
    /** 两个页面的共同横向容器。 */
    @property(Node) strip: Node = null!;
    /** 水果及甜点的独立纵向滚动组件。 */
    @property([ScrollView]) scrolls: ScrollView[] = [];
    /** 编辑器绑定的上一页按钮。 */
    @property(Button) previousButton: Button = null!;
    /** 编辑器绑定的下一页按钮。 */
    @property(Button) nextButton: Button = null!;
    /** 页中心间距，设计像素；与预制体页面位置一致。 */
    @property pagePitch = 604;
    /** 当前页面索引。 */
    index = 0;
    /** 与渲染无关的方向判定。 */
    private readonly gesture = new CollectionSwipe();
    /** 当前捕获的手指，忽略第二根手指。 */
    private touchId: number | null = null;
    /** 手势起始设计坐标。 */
    private startX = 0;
    /** 手势起始纵坐标。 */
    private startY = 0;
    /** 当前分页过渡是否进行中。 */
    private moving = false;
    /** 进入面板时捕获触摸，先于内部纵向列表判定方向。 */
    onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.begin, this, true);
        this.node.on(Node.EventType.TOUCH_MOVE, this.move, this, true);
        this.node.on(Node.EventType.TOUCH_END, this.end, this, true);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.cancel, this, true);
    }
    /** 关闭时停止过渡并恢复纵向列表。 */
    onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.begin, this, true);
        this.node.off(Node.EventType.TOUCH_MOVE, this.move, this, true);
        this.node.off(Node.EventType.TOUCH_END, this.end, this, true);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.cancel, this, true);
        Tween.stopAllByTarget(this.strip);
        this.touchId = null;
        this.moving = false;
        this.scrolls.forEach(scroll => { scroll.vertical = true; });
    }
    /** @param page 要展示的页。 @param animate 是否使用0.24秒翻页过渡。 */
    show(page: number, animate = true): void {
        const next = Math.max(0, Math.min(1, page));
        Tween.stopAllByTarget(this.strip);
        this.index = next;
        this.moving = animate;
        const position = new Vec3(-next * this.pagePitch, 0, 0);
        if (animate) {
            tween(this.strip).to(.24, { position }, { easing: 'quadOut' }).call(() => { this.moving = false; }).start();
        } else {
            this.strip.setPosition(position);
        }
        if (this.previousButton) this.previousButton.interactable = next > 0;
        if (this.nextButton) this.nextButton.interactable = next < 1;
        this.node.emit('collection-page', next);
    }
    /** 点击上一页；边界保持当前页。 */
    previous(): void {
        this.show(this.index - 1);
    }
    /** 点击下一页；边界保持当前页。 */
    next(): void {
        this.show(this.index + 1);
    }
    /** @param event 当前触摸；坐标按节点缩放换算为设计像素。 */
    private begin(event: EventTouch): void {
        if (this.moving || this.touchId !== null) return;
        this.touchId = event.getID();
        const point = event.getUILocation();
        this.startX = point.x;
        this.startY = point.y;
        this.gesture.reset();
        this.scrolls.forEach(scroll => scroll.stopAutoScroll());
    }
    /** @param event 方向锁定后仅横向手势移动页面。 */
    private move(event: EventTouch): void {
        if (event.getID() !== this.touchId) return;
        const point = event.getUILocation();
        const scale = Math.max(.01, Math.abs(this.node.worldScale.x));
        const dx = (point.x - this.startX) / scale;
        const dy = (point.y - this.startY) / scale;
        if (this.gesture.move(dx, dy) !== 'horizontal') return;
        this.scrolls.forEach(scroll => { scroll.vertical = false; scroll.stopAutoScroll(); });
        const outside = (this.index === 0 && dx > 0) || (this.index === 1 && dx < 0);
        const travel = Math.max(-this.pagePitch, Math.min(this.pagePitch, dx)) * (outside ? .22 : 1);
        this.strip.setPosition(-this.index * this.pagePitch + travel, 0, 0);
    }
    /** @param event 松手后跨过16%宽度才换页。 */
    private end(event: EventTouch): void {
        this.finish(event, false);
    }
    /** @param event 系统取消或滚动组件合成取消。 */
    private cancel(event: EventTouch): void {
        if ((event as EventTouch & { simulate?: boolean }).simulate) return;
        // 页面随手指移动后，原触摸目标之外松手也会收到取消，仍按距离完成翻页。
        this.finish(event, false);
    }
    /** @param event 结束的触摸。 @param cancelled 系统取消时回到原页。 */
    private finish(event: EventTouch, cancelled: boolean): void {
        if (event.getID() !== this.touchId) return;
        const point = event.getUILocation();
        const scale = Math.max(.01, Math.abs(this.node.worldScale.x));
        this.gesture.move((point.x - this.startX) / scale, (point.y - this.startY) / scale);
        this.touchId = null;
        const width = this.node.getComponent(UITransform)!.width;
        const next = this.gesture.finish(this.index, width, cancelled);
        if (this.gesture.axis === 'horizontal') this.show(next);
        this.scrolls.forEach(scroll => { scroll.vertical = true; });
    }
}
