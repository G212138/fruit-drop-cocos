import { sys } from 'cc';
/** 启动层只使用宿主存储，不引用尚未注册的业务分包。 */
declare const TTMinis: { game?: {
    /** @param key 本地存档键。 */
    getStorageSync?: (key: string) => unknown;
    /** @param key 本地存档键。 @param value 已进入游戏的标记。 */
    setStorageSync?: (key: string, value: string) => void;
} } | undefined;
/** 抖音独立存储；TikTok原生桥接存在时仍优先走TTMinis。 */
declare const tt: NonNullable<NonNullable<typeof TTMinis>['game']> | undefined;
/** 启动层最小宿主选择，不加载业务分包。 */
function startupStorage() {
    return typeof TTMinis !== 'undefined' && TTMinis.game ? TTMinis.game
        : typeof tt !== 'undefined' ? tt : null;
}
/** 首次启动路由；只在页面实际显示后记录完成，加载失败不消耗首次机会。 */
export class FirstLaunch {
    /** 独立本地标记，不覆盖关卡、道具或语言存档。 */
    private static readonly key = 'fruit-drop.first-entry.v1';
    /** 本次启动固定的目标，防止初始化过程中读到不同结果。 */
    private static selected: 'PageHome' | 'PageGame' | null = null;
    /** 获取本次首屏；已有有效关卡存档的老玩家继续使用首页。 */
    static get page(): 'PageHome' | 'PageGame' {
        if (this.selected) return this.selected;
        try {
            if (this.read(this.key) === '1') return this.selected = 'PageHome';
            const raw = this.read('fruit-drop.progress.v1');
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved.version === 1 && Number.isSafeInteger(saved.level) && saved.level >= 1) {
                    return this.selected = 'PageHome';
                }
            }
        } catch { /* 无存储或坏档仍允许首次直接体验，不阻塞启动。 */ }
        return this.selected = 'PageGame';
    }
    /** 页面成功显示后写入标记；存储异常不影响本次体验。 */
    static complete(): void {
        if (this.page !== 'PageGame') return;
        try {
            const api = startupStorage();
            if (api) {
                if (!api.setStorageSync) return;
                api.setStorageSync(this.key, '1');
            } else sys.localStorage.setItem(this.key, '1');
        } catch { /* 无法保存时，下次仍按首次流程进入游戏。 */ }
    }
    /** @param key 启动相关本地键；宿主可用时不混用浏览器存档。 */
    private static read(key: string): string | null {
        const api = startupStorage();
        if (!api) return sys.localStorage.getItem(key);
        if (!api.getStorageSync) throw Error('宿主存储不可用');
        const value = api.getStorageSync(key);
        return typeof value === 'string' ? value : null;
    }
}
