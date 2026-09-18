import { _decorator, CCFloat, Component, UITransform } from 'cc';
const { ccclass, property } = _decorator;
/** 游戏背景云：按风向缓慢平移，完整离屏后循环。 */
@ccclass('GameCloudMotion')
export class GameCloudMotion extends Component {
    /** 设计像素/秒；适配值 4，形成缓慢自然漂移。 */
    @property({ type: CCFloat }) speed = 4;
    /** 按帧时间移动；单帧最多计入 0.1 秒，避免切回游戏时跳跃。 */
    update(dt: number): void {
        const parent = this.node.parent?.getComponent(UITransform);
        const own = this.node.getComponent(UITransform);
        if (!parent || !own || parent.width <= 0) return;
        const bound = (parent.width + own.width * Math.abs(this.node.scale.x)) / 2 + 20;
        const p = this.node.position;
        let x = p.x + this.speed * Math.min(Math.max(dt, 0), 0.1);
        if (x > bound) x = -bound;
        if (x < -bound) x = bound;
        this.node.setPosition(x, p.y, p.z);
    }
}
