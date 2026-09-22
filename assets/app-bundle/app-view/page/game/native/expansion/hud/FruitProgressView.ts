import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, isValid } from 'cc';
import { ThemeProgress } from '../../../../../../../app-builtin/app-model/expansion/ThemeProgress';
import { EditorSession } from '../../../../../../../app-builtin/app-model/expansion/level/EditorSession';
const { ccclass, property } = _decorator;

/** 原版剩余数量与双层进度图，脚本挂在游戏界面的普通节点上。 */
@ccclass('FruitProgressView')
export class FruitProgressView extends Component {
    /** 左侧白色描边剩余数量。 */
    @property(Label) remaining: Label = null!;
    /** 右侧白色描边百分比。 */
    @property(Label) percentage: Label = null!;
    /** 进度卡片挂载点，用于整组显示与隐藏。 */
    @property(Node) progressRoot: Node = null!;
    /** 灰色未完成扇区，覆盖顺时针进度以外的部分。 */
    @property(Sprite) dark: Sprite = null!;
    /** 原色已完成扇区，从顶部顺时针填充。 */
    @property(Sprite) bright: Sprite = null!;
    /** 可解锁物品图片，顺序与主题解锁规则一致。 */
    @property([SpriteFrame]) frames: SpriteFrame[] = [];
    /** 最近的真实进度，范围0至1，用于闪烁结束时恢复。 */
    private ratio = 0;
    /** 提亮动画经过秒数；负数表示未播放。 */
    private glowTime = -1;
    /** 连续星星从当前亮度继续过渡，避免重新起播时跳变。 */
    private glowStart = 0;
    /** 当前柔光强度，范围0至1。 */
    private glow = 0;
    /** 保存编辑器配置的灰色，清局和动画结束时恢复。 */
    private darkColor: Color | null = null;

    /** @param level 累计关卡编号。 @param remaining 剩余水果个数。 @param total 本关水果总数，0表示未加载。 */
    render(level: number, remaining: number, total: number): void {
        const percent = total > 0 ? Math.max(0, Math.min(100, Math.floor((total - remaining) / total * 100))) : 0;
        this.ratio = percent / 100;
        this.remaining.string = total > 0 ? String(remaining) : '—';
        this.percentage.string = percent + '%';
        const index = ThemeProgress.unlockIndex(level);
        const frame = index >= 0 ? this.frames[index] : null;
        if (frame) this.dark.spriteFrame = this.bright.spriteFrame = frame;
        // 整张卡片由同一根节点控制，试玩或没有解锁奖励时隐藏底框、图标与百分比。
        this.progressRoot.active = !EditorSession.trial && !!frame;
        this.restoreFill();
    }

    /** @param completed 保留原有0.15秒抵达计数时序，视觉渐变独立播放。 */
    flash(completed: () => void): void {
        if (!this.darkColor) this.darkColor = this.dark.color.clone();
        this.glowStart = this.glow;
        this.glowTime = 0;
        this.scheduleOnce(completed, 0.15);
    }

    /** @param dt 帧间隔秒数；0.12秒柔和提亮、0.32秒淡出，最多混入28%的原色亮度。 */
    update(dt: number): void {
        if (this.glowTime < 0 || !this.darkColor) return;
        this.glowTime += dt;
        const attack = 0.12;
        const release = 0.32;
        if (this.glowTime < attack) {
            const t = this.glowTime / attack;
            this.glow = this.glowStart + (1 - this.glowStart) * (t * t * (3 - 2 * t));
        } else {
            const t = Math.min(1, (this.glowTime - attack) / release);
            this.glow = 1 - t * t * (3 - 2 * t);
        }
        const base = this.darkColor;
        const amount = this.glow * 0.28;
        this.dark.color = new Color(
            Math.round(base.r + (255 - base.r) * amount),
            Math.round(base.g + (255 - base.g) * amount),
            Math.round(base.b + (255 - base.b) * amount), base.a);
        if (this.glowTime >= attack + release) this.glowTime = -1;
    }
    /** 顶部对应0.25圈，负范围表示顺时针；灰色与原色扇区互补。 */
    private restoreFill(): void {
        this.dark.node.active = true;
        this.dark.fillStart = (1.25 - this.ratio) % 1;
        this.dark.fillRange = -(1 - this.ratio);
        this.bright.fillStart = 0.25;
        this.bright.fillRange = -this.ratio;
    }

    /** 清局取消闪烁通知，恢复当前数值对应的填充状态。 */
    clear(): void {
        this.unscheduleAllCallbacks();
        this.glowTime = -1;
        this.glow = 0;
        if (this.darkColor && isValid(this.dark, true)) this.dark.color = this.darkColor.clone();
        if (isValid(this.dark, true) && isValid(this.bright, true)) this.restoreFill();
    }

    /** 销毁时取消上一局的抵达回调。 */
    onDestroy(): void {
        this.clear();
    }
}
