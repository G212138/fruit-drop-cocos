import { ProgressStorage } from './LevelProgress';

/** 原版主题选择和图鉴解锁；关卡进度由已有模型提供，不重复保存奖励。 */
export class ThemeProgress {
    /** 当前甜品主题共30种物品；每通关一关开放一种，同时控制图鉴及结算提示。 */
    static readonly itemCount = 30;

    /** @param completedLevel 已通关关卡；全部解锁后返回-1，结算不再显示解锁提示。 */
    static unlockIndex(completedLevel: number): number {
        return Number.isInteger(completedLevel) && completedLevel >= 1 && completedLevel <= this.itemCount
            ? completedLevel - 1 : -1;
    }
    /** 独立版本化主题存档键。 */
    private readonly key = 'fruit-drop.theme.v1';
    /** 一为水果，二为甜品，沿用原版编号。 */
    selected: 1 | 2 = 1;
    /** 本次存储异常，供页面提示。 */
    warning = '';

    /** @param storage 平台本地存储边界。 */
    constructor(private readonly storage: ProgressStorage) {
        try {
            const raw = storage.getItem(this.key);
            if (!raw) return;
            const value = JSON.parse(raw);
            if (value.version !== 1 || [1, 2].indexOf(value.selected) < 0) throw new Error('主题存档无效');
            this.selected = value.selected;
        } catch { this.warning = '主题读取失败，已使用水果主题'; }
    }

    /** @param level 下一待挑战关卡；原版通关第30关后，即level大于30才允许甜品主题。 */
    resolve(level: number): 1 | 2 {
        return this.selected === 2 && level > ThemeProgress.itemCount ? 2 : 1;
    }

    /** @param theme 图鉴主题。 @param index 图鉴零起始下标。 @param level 下一待挑战关卡。 */
    unlocked(theme: 1 | 2, index: number, level: number): boolean {
        return index >= 0 && index < ThemeProgress.itemCount && (theme === 1 || level > index + 1);
    }

    /** @param theme 用户选择的主题。 @param level 正式关卡进度；试玩不能借此解锁。 */
    select(theme: 1 | 2, level: number): boolean {
        if (theme !== 1 && theme !== 2) throw new Error('主题编号无效');
        if (theme === 2 && level <= ThemeProgress.itemCount) return false;
        this.selected = theme;
        try {
            this.storage.setItem(this.key, JSON.stringify({ version: 1, selected: theme }));
            this.warning = '';
        } catch { this.warning = '主题暂时无法保存，重启后可能丢失'; }
        return true;
    }
}

