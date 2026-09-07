import { _decorator, Component, Node } from 'cc';
import { BoardEvents } from '../board/BoardEvents';
import { shouldRevealHiddenFruit } from './HiddenFruitRules';
const { ccclass } = _decorator;

/** 独立花朵遮罩预制体，只监听所属水果，不修改水果类型或物理。 */
@ccclass('HiddenFruitView')
export class HiddenFruitView extends Component {
    /** 所属水果节点，绑定后用于解除局部事件监听。 */
    private owner: Node | null = null;

    /** 挂入水果后保存所属实例，图片和尺寸均来自预制体。 */
    onLoad(): void {
        this.owner = this.node.parent;
    }

    /** 首次显示和复活重新显示时都恢复监听，先解除旧绑定避免重复回调。 */
    onEnable(): void {
        this.owner?.targetOff(this);
        this.owner?.on(BoardEvents.FirstFloorContact, this.onFloorContact, this);
        this.owner?.on(BoardEvents.Removing, this.onRemoving, this);
    }

    /** 隐藏或页面退出时解除监听，复活激活时由 onEnable 重新绑定。 */
    onDisable(): void {
        this.owner?.targetOff(this);
    }

    /** @param dynamic 首次接触地形时是否处于真实动态下落状态。 */
    private onFloorContact(dynamic: boolean): void {
        if (shouldRevealHiddenFruit(true, dynamic, false)) this.reveal();
    }

    /** 原版消除流程会清除双方遮罩，即使其中一方尚未触底。 */
    private onRemoving(): void {
        if (shouldRevealHiddenFruit(false, false, true)) this.reveal();
    }

    /** 立即隐藏已有遮罩，保持原版无额外揭示延迟的行为。 */
    private reveal(): void {
        this.owner?.targetOff(this);
        this.node.active = false;
    }

    /** 切关、重开或水果销毁时清理监听，避免旧局事件残留。 */
    onDestroy(): void {
        this.owner?.targetOff(this);
        this.owner = null;
    }
}
