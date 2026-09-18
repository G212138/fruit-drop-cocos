import { _decorator, Component, Node, RigidBody2D, Button } from 'cc';
const { ccclass, property } = _decorator;

/** 独立锁墙预制体，解锁时先退出物理世界再隐藏图片。 */
@ccclass('LockWallView')
export class LockWallView extends Component {
    /** 原版锁墙刚体，碰撞盒为 80×90 设计像素。 */
    @property(RigidBody2D)
    body: RigidBody2D = null!;
    /** 原版锁墙图片子节点，尺寸 163×95 设计像素。 */
    @property(Node)
    visual: Node = null!;
    /** 解锁请求按钮，成功后不可重复操作。 */
    @property(Button)
    button: Button = null!;
    /** 本局是否已经扩槽，不持久化到下一局。 */
    private expanded = false;
    /** 前置格是否已开放；下格必须等待上格完成广告。 */
    private available = true;
    /** 独立广告图标和文字，仅轮到此格时显示，地块始终保持原亮度。 */
    @property(Node)
    promptRoot: Node = null!;

    /** @param available 是否轮到此格观看广告。 */
    setAvailable(available: boolean): void {
        this.available = available;
        this.button.interactable = available && !this.expanded;
        if (this.promptRoot) this.promptRoot.active = available && !this.expanded;
    }

    /** 返回本局扩槽状态，失败与危险反馈共同读取。 */
    get unlocked(): boolean {
        return this.expanded;
    }

    /** 按钮只发布请求，不能直接隐藏锁墙或改变阈值。 */
    requestUnlock(): void {
        if (!this.expanded && this.available) this.node.emit('unlock-request');
    }

    /** 页面复用时恢复未解锁状态、碰撞和按钮，不沿用上一局扩槽。 */
    reset(): void {
        this.expanded = false;
        this.body.enabled = true;
        this.visual.active = true;
        this.setAvailable(true);
    }

    /** 已验证奖励后执行一次扩槽，重复调用返回失败。 */
    unlock(): boolean {
        if (this.expanded || !this.available) return false;
        this.expanded = true;
        this.body.enabled = false;
        this.visual.active = false;
        this.button.interactable = false;
        return true;
    }
}
