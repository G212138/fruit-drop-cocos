import { _decorator, Component, Node, Label, Color } from 'cc';
const { ccclass, property } = _decorator;
/** 纸飞机沿真实加载进度飞向太阳，节点全部由预制体绑定。 */
@ccclass('LoadingFlight')
export class LoadingFlight extends Component {
    /** 飞机和下方百分比。 */
    @property(Node) plane: Node = null!;
    @property(Label) percent: Label = null!;
    /** 从左到右排列的航迹段。 */
    @property([Label]) trail: Label[] = [];
    /** 当前真实进度，范围零至一。 */
    private progress = 0;
    /** 浮动动画累计秒数。 */
    private elapsed = 0;
    /** 只更新已完成的进度，不以时间伪造加载。 */
    setProgress(value: number): void {
        this.progress = Math.max(this.progress, Math.min(1, Math.max(0, value)));
        this.trail.forEach((label, index) => {
            const done = index / this.trail.length < this.progress;
            label.color = done ? new Color(255, 190, 53) : new Color(248, 252, 255);
            label.outlineColor = done ? new Color(181, 119, 33, 190) : new Color(69, 136, 170, 190);
        });
        this.percent.string = `${Math.floor(this.progress * 100)}%`;
        this.place();
    }
    /** 仅上下浮动，不改变任务完成度。 */
    update(dt: number): void { this.elapsed += Math.min(dt, 0.1); this.place(); }
    /** 航线与编辑器预制体一致，单位为设计像素。 */
    private place(): void {
        const x = -245 + 490 * this.progress;
        const y = 100 * this.progress * this.progress;
        this.plane.setPosition(x, y + Math.sin(this.elapsed * 2) * 3, 0);
        this.percent.node.setPosition(x, y - 43, 0);
    }
}
