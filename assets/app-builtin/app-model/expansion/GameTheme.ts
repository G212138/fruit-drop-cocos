import { PREVIEW } from 'cc/env';
import { sys } from 'cc';
import { ThemeProgress } from './ThemeProgress';
import { PlatformStorage } from './platform/PlatformStorage';
import { LevelProgress } from './LevelProgress';

/** 会话主题入口；只在页面入场读取一次正式进度，水果生成不重复读取磁盘。 */
export class GameTheme {
    /** 懒加载的主题模型。 */
    private static model: ThemeProgress | null = null;
    /** 当前页面已经确认的有效主题编号。 */
    static active: 1 | 2 = 1;
    /** 获取唯一主题存档模型。 */
    static get current(): ThemeProgress {
        if (!this.model) this.model = new ThemeProgress(PlatformStorage);
        return this.model;
    }
    /** 页面入场时以正式进度重新确认主题，试玩数据不参与解锁。 */
    static refresh(): void {
        this.active = this.current.resolve(new LevelProgress(PlatformStorage).level);
    }
}

/** 本地试玩入口：仅编辑器预览接受参数，保留原始存档以便测试后恢复。 */
function applyPreviewUnlock(): void {
    if (!PREVIEW || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('unlock-items') !== 'all') return;
    const backupKey = 'fruit-drop.preview-unlock-backup.v1';
    const progressKey = 'fruit-drop.progress.v1';
    const themeKey = 'fruit-drop.theme.v1';
    if (!sys.localStorage.getItem(backupKey)) {
        sys.localStorage.setItem(backupKey, JSON.stringify({
            progress: sys.localStorage.getItem(progressKey),
            theme: sys.localStorage.getItem(themeKey),
        }));
    }
    const progress = new LevelProgress(PlatformStorage);
    progress.complete(ThemeProgress.itemCount);
    GameTheme.current.select(2, progress.level);
    url.searchParams.delete('unlock-items');
    window.history.replaceState(null, '', url.toString());
}
applyPreviewUnlock();
