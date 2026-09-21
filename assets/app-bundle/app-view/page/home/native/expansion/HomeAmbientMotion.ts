import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
/** 首页装饰动效，不参与游戏物理和输入。 */
@ccclass('HomeAmbientMotion')
export class HomeAmbientMotion extends Component {
    /** 只缩放按钮文字，避免覆盖按钮原有按压反馈。 */
    @property(Node) playLabel: Node = null!;
    /** 当前动效时间，单位秒。 */
    private elapsed = 0;
    /** 文字原始缩放。 */
    private labelScale = new Vec3(1, 1, 1);
    /** 记录文字原始缩放并初始化。 */
    onLoad(): void {
        if (this.playLabel) this.labelScale.set(this.playLabel.scale);
        this.update(0);
    }
    /** 每五秒轻弹一次文字，幅度为原始缩放的4.5%。 */
    update(dt: number): void {
        this.elapsed += Math.min(dt, 0.1);
        if (this.playLabel) {
            const phase = this.elapsed % 5;
            const pulse = phase < 0.7 ? Math.sin(phase / 0.7 * Math.PI) * 0.045 : 0;
            this.playLabel.setScale(this.labelScale.x * (1 + pulse), this.labelScale.y * (1 + pulse), this.labelScale.z);
        }
    }
    /** 隐藏首页时恢复文字，避免影响后续界面。 */
    onDisable(): void {
        if (this.playLabel) this.playLabel.setScale(this.labelScale);
    }
}

