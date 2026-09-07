/** 设置专用存储边界，与引擎及音频播放分离。 */
export interface PreferencesStorage {
    /** @param key 独立存档键；不存在时返回空值。 */
    getItem(key: string): string | null;
    /** @param key 独立存档键。 @param value 已序列化设置。 */
    setItem(key: string, value: string): void;
}

/** 原版三个独立开关；首次进入默认全部开启。 */
export interface PreferencesSnapshot {
    /** 是否允许背景音乐；不影响音效。 */
    music: boolean;
    /** 是否允许短音效；不影响背景音乐。 */
    sound: boolean;
    /** 是否允许平台震动反馈；平台不支持时不伪装已震动。 */
    vibrate: boolean;
}

/** 三项原版设置的持久化模型；播放与震动由调用方根据结果执行。 */
export class GamePreferences {
    /** 新项目版本化设置键，不覆盖原版和 XForge 的存档。 */
    private readonly key = 'fruit-drop.preferences.v1';
    /** 当前会话设置，写入失败时仍保持本次选择有效。 */
    private current: PreferencesSnapshot = { music: true, sound: true, vibrate: true };
    /** 供设置面板显示的真实存储错误；空字符串表示没有错误。 */
    warning = '';

    /** @param storage 控制器注入的平台本地存储，不直接依赖 cc。 */
    constructor(private readonly storage: PreferencesStorage) {
        try {
            const raw = storage.getItem(this.key);
            if (raw === null) return;
            const saved = JSON.parse(raw);
            if (!saved || saved.version !== 1 || typeof saved.music !== 'boolean'
                || typeof saved.sound !== 'boolean' || typeof saved.vibrate !== 'boolean') {
                throw new Error('设置格式无效');
            }
            this.current = { music: saved.music, sound: saved.sound, vibrate: saved.vibrate };
        } catch {
            this.warning = '设置读取失败，本次使用默认设置';
        }
    }

    /** 返回独立快照，调用方不能绕过保存流程改写设置。 */
    get snapshot(): PreferencesSnapshot {
        return { ...this.current };
    }

    /** @param key 要切换的单个设置；返回切换后的布尔值。 */
    toggle(key: keyof PreferencesSnapshot): boolean {
        if (key !== 'music' && key !== 'sound' && key !== 'vibrate') throw new Error('未知设置项');
        this.current[key] = !this.current[key];
        try {
            this.storage.setItem(this.key, JSON.stringify({ version: 1, ...this.current }));
            this.warning = '';
        } catch {
            this.warning = '设置暂时无法保存，关闭游戏后可能丢失';
        }
        return this.current[key];
    }
}
