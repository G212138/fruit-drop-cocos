import { UITransform, Vec3, isValid } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { EntryBounds, planEntry } from './EntryRules';

/** 开局位移协调器，操作已有水果，动画期间不运行匹配或生成。 */
export class EntryFlow {
    /** 参与入场的水果及最终坐标；全部恢复后释放引用。 */
    private targets: { fruit: FruitItem; position: Vec3; enabled: boolean }[] = [];
    /** 屏幕外相对最终坐标的位移，单位像素。 */
    private offset = { x: 0, y: 0 };
    /** 动画总时长，单位秒。 */
    private duration = 0;
    /** 已播放时长，单位秒。 */
    private elapsed = 0;

    /** 入场期间棋盘不能接收点击、自动释放或失败计时。 */
    get busy(): boolean {
        return this.targets.length > 0;
    }

    /** @param fruits 当前初始可见水果。 @param mode 原版模式。 @param bounds 棋盘对应屏幕范围。 @param finalDeltaY 安全落点相对关卡数据的纵向偏移，单位水果父节点像素。 @param immediate 是否直接显示在最终落点，省略屏幕外入场。 */
    begin(fruits: FruitItem[], mode: 1 | 2, bounds: EntryBounds, finalDeltaY = 0, immediate = false): void {
        this.cancel();
        if (!fruits.length) return;
        let bottom = Infinity, right = -Infinity;
        for (const fruit of fruits) {
            const size = fruit.node.getComponent(UITransform)!.contentSize;
            bottom = Math.min(bottom, fruit.node.position.y + finalDeltaY - size.height / 2);
            right = Math.max(right, fruit.node.position.x + size.width / 2);
        }
        const plan = planEntry(mode, bottom, right, bounds);
        if (immediate || (!plan.x && !plan.y)) {
            for (const fruit of fruits) {
                const position = fruit.node.position;
                fruit.node.setPosition(position.x, position.y + finalDeltaY, position.z);
            }
            return;
        }
        this.offset = plan;
        this.duration = plan.duration;
        this.elapsed = 0;
        this.targets = fruits.map(fruit => ({ fruit,
            position: new Vec3(fruit.node.position.x, fruit.node.position.y + finalDeltaY, fruit.node.position.z),
            enabled: fruit.body.enabled }));
        for (const target of this.targets) {
            // 停用整个刚体而不重复停用碰撞体，避免迁移后的碰撞代理重复移除。
            target.fruit.body.enabled = false;
            target.fruit.node.setPosition(target.position.x + plan.x, target.position.y + plan.y, target.position.z);
        }
    }

    /** @param dt 当前帧秒数；返回本帧是否刚完成入场。 */
    tick(dt: number): boolean {
        if (!this.busy) return false;
        this.elapsed = Math.min(this.duration, this.elapsed + dt);
        const remaining = 1 - Math.sin(this.elapsed / this.duration * Math.PI / 2);
        for (const target of this.targets) {
            target.fruit.node.setPosition(target.position.x + this.offset.x * remaining,
                target.position.y + this.offset.y * remaining, target.position.z);
        }
        if (this.elapsed < this.duration) return false;
        this.cancel();
        return true;
    }

    /** 正常完成或中断时恢复最终位置及刚体开关；重开不遗留动画状态。 */
    cancel(): void {
        for (const target of this.targets) {
            if (!isValid(target.fruit, true)) continue;
            target.fruit.node.setPosition(target.position);
            target.fruit.body.enabled = target.enabled;
        }
        this.targets = [];
        this.elapsed = 0;
    }
}
