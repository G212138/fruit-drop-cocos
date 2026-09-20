import { _decorator, CCFloat, Component, UITransform } from 'cc';
const { ccclass, property } = _decorator;
/** 首页装饰云，仅移动子图；适配容器及纵向布局由 Widget 控制。 */
@ccclass('HomeCloudMotion')
export class HomeCloudMotion extends Component {
    /** 横向速度，单位设计像素/秒；适配值 10，可在编辑器调节。 */
    @property({ type: CCFloat }) speed = 10;
    /** 每帧按实际容器宽度移动，完全离屏后从另一侧进入。 @param dt 帧间隔，单位秒。 */
    update(dt: number): void {
        const parent = this.node.parent?.getComponent(UITransform);
        const own = this.node.getComponent(UITransform);
        if (!parent || !own || parent.width <= 0) return;
        const bound = (parent.width + own.width * Math.abs(this.node.scale.x)) / 2 + 20;
        const position = this.node.position;
        let x = position.x + this.speed * Math.min(dt, 0.1);
        if (x > bound) x = -bound;
        if (x < -bound) x = bound;
        this.node.setPosition(x, position.y, position.z);
    }
}
