/** 存储接口与引擎分离，便于验证坏档和写入失败。 */
export interface ProgressStorage {
    /** @param key 存档键名；返回原始字符串或空值。 */
    getItem(key: string): string | null;
    /** @param key 存档键名。 @param value 已序列化进度。 */
    setItem(key: string, value: string): void;
}

/** 版本化关卡进度，保存下次从首页继续的关卡。 */
export class LevelProgress {
    /** 独立业务键，不覆盖原项目或框架其他存档。 */
    private readonly key = 'fruit-drop.progress.v1';
    /** 当前会话进度；存储不可用时仍可继续玩。 */
    private current = 1;
    /** 读写错误信息；页面展示提示，不影响单局结果。 */
    warning = '';

    /** @param storage 由控制器注入的平台本地存储接口。 */
    constructor(private readonly storage: ProgressStorage) {
        try {
            const raw = storage.getItem(this.key);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved.version !== 1 || !Number.isSafeInteger(saved.level) || saved.level < 1) {
                throw new Error('存档格式无效');
            }
            this.current = saved.level;
        } catch {
            this.warning = '进度读取失败，本次从第 1 关开始';
        }
    }

    /** 返回从一开始的关卡序号，不把未知关卡静默改成第一关。 */
    get level(): number {
        return this.current;
    }

    /** @param completed 已真正胜利的关卡编号；重放旧关不能降低进度。 */
    complete(completed: number): void {
        if (!Number.isSafeInteger(completed) || completed < 1) throw new Error('完成关卡编号无效');
        this.current = Math.max(this.current, completed + 1);
        try {
            this.storage.setItem(this.key, JSON.stringify({ version: 1, level: this.current }));
            this.warning = '';
        } catch {
            this.warning = '进度暂时无法保存，关闭游戏后可能丢失';
        }
    }
}
