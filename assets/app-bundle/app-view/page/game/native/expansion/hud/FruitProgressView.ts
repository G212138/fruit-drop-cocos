import { _decorator, Component, Label, Node, Sprite, SpriteFrame, isValid } from 'cc';
const { ccclass, property } = _decorator;

/** 原版剩余数量与双层进度图，脚本挂在游戏界面的普通节点上。 */
@ccclass('FruitProgressView')
export class FruitProgressView extends Component {
    /** 左侧白色描边剩余数量。 */
    @property(Label) remaining: Label = null!;
    /** 右侧白色描边百分比。 */
    @property(Label) percentage: Label = null!;
    /** 进度图挂载点，也是星星的抵达位置。 */
    @property(Node) progressRoot: Node = null!;
    /** 灰色未完成层，从当前比例向上填充。 */
    @property(Sprite) dark: Sprite = null!;
    /** 原色已完成层，从底部填充至当前比例。 */
    @property(Sprite) bright: Sprite = null!;
    /** 原版31至60号进度图片，按关卡顺序绑定。 */
    @property([SpriteFrame]) frames: SpriteFrame[] = [];
    /** 最近的真实进度，范围0至1，用于闪烁结束时恢复。 */
    private ratio = 0;
    /** 并发抵达计数，最后一次闪烁结束才恢复双层显示。 */
    private flashes = 0;

    /** @param level 累计关卡编号。 @param remaining 剩余水果个数。 @param total 本关水果总数，0表示未加载。 */
    render(level: number, remaining: number, total: number): void {
        const percent = total > 0 ? Math.max(0, Math.min(100, Math.floor((total - remaining) / total * 100))) : 0;
        this.ratio = percent / 100;
        this.remaining.string = total > 0 ? String(remaining) : '—';
        this.percentage.string = percent + '%';
        const frame = this.frames[Math.max(0, level - 1) % this.frames.length];
        if (frame) this.dark.spriteFrame = this.bright.spriteFrame = frame;
        // 原版HideExtraUILevelThreshold默认60；31至60关复用现有30张图，避免缺图。
        this.progressRoot.active = level <= 60;
        if (!this.flashes) this.restoreFill();
    }

    /** @param completed 原版0.15秒全亮反馈结束后的计数通知。 */
    flash(completed: () => void): void {
        this.flashes++;
        this.dark.node.active = false;
        this.bright.fillStart = 0;
        this.bright.fillRange = 1;
        this.scheduleOnce(() => {
            if (--this.flashes === 0) this.restoreFill();
            completed();
        }, 0.15);
    }

    /** Creator3禁止负fillStart，使用等效的起点加范围恢复原版上下分界。 */
    private restoreFill(): void {
        this.dark.node.active = true;
        this.dark.fillStart = this.ratio;
        this.dark.fillRange = 1 - this.ratio;
        this.bright.fillStart = 0;
        this.bright.fillRange = this.ratio;
    }

    /** 清局取消闪烁通知，恢复当前数值对应的填充状态。 */
    clear(): void {
        this.unscheduleAllCallbacks();
        this.flashes = 0;
        if (isValid(this.dark, true) && isValid(this.bright, true)) this.restoreFill();
    }

    /** 销毁时取消上一局的抵达回调。 */
    onDestroy(): void {
        this.clear();
    }
}
