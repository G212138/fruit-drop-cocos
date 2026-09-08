import { sys } from 'cc';
import { ThemeProgress } from './ThemeProgress';
import { LevelProgress } from './LevelProgress';

/** 会话主题入口；只在页面入场读取一次正式进度，水果生成不重复读取磁盘。 */
export class GameTheme {
    /** 懒加载的主题模型。 */
    private static model: ThemeProgress | null = null;
    /** 当前页面已经确认的有效主题编号。 */
    static active: 1 | 2 = 1;
    /** 获取唯一主题存档模型。 */
    static get current(): ThemeProgress {
        if (!this.model) this.model = new ThemeProgress(sys.localStorage);
        return this.model;
    }
    /** 页面入场时以正式进度重新确认主题，试玩数据不参与解锁。 */
    static refresh(): void {
        this.active = this.current.resolve(new LevelProgress(sys.localStorage).level);
    }
}
