import { _decorator, Component, Sprite, Node, Label, Vec3, isValid } from 'cc';
const { ccclass, property } = _decorator;

/** 原版黑洞图片与数量标记；节点和绑定均来自编辑器预制体。 */
@ccclass('BlackHoleView')
export class BlackHoleView extends Component {
    /** 七十设计像素的原版黑洞图片。 */
    @property(Sprite)
    ring: Sprite = null!;
    /** 右下角数量底图节点，原版缩放零点八。 */
    @property(Node)
    badge: Node = null!;
    /** 数量包含当前水果和所有待释放成员。 */
    @property(Label)
    countLabel: Label = null!;

    /** @param parent 水果公共容器；原版为底图、水果、数量三层，迁移时只重排预制体已有节点。 */
    arrangeLayers(parent: Node): void {
        this.ring.node.parent = parent;
        this.ring.node.setSiblingIndex(0);
        this.moveTo(this.node.position);
    }

    /** @param position 当前水果的局部设计坐标，同步底图与前景数量标记。 */
    moveTo(position: Readonly<Vec3>): void {
        this.node.setPosition(position);
        this.ring.node.setPosition(position);
    }

    /** @param count 当前黑洞剩余水果数；最后一个水果时隐藏黑洞及数量底图。 */
    setCount(count: number): void {
        this.countLabel.string = String(count);
        this.ring.enabled = count > 1;
        this.badge.active = count > 1;
    }

    /** 清理为正确前后层级而移到同级容器的底图，不遗留旧局节点。 */
    onDestroy(): void {
        if (isValid(this.ring?.node, true)) this.ring.node.destroy();
    }
}
