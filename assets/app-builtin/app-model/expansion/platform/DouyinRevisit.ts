import { getDouyinGame, DouyinLaunchOptions } from './DouyinRuntime';
import { DouyinMission, DouyinMissionRewards } from './DouyinMissionRewards';
/** game.js最早注册的入口缓存，不存用户身份或完整启动参数。 */
interface EntryState {
    /** 最新入口，普通返回必须覆盖旧的侧边栏入口。 */
    latest: DouyinLaunchOptions;
    /** 入口发生的本地自然日。 */
    day: string;
}
/** 独立抖音回访服务：探测、导航和发奖校验不使用TikTok接口。 */
export class DouyinRevisit {
    /** 单例保证整个游戏只维护一份能力和来源状态。 */
    static readonly shared = new DouyinRevisit();
    /** 当前入口能力与桌面状态。 */
    sidebarSupported = false;
    shortcutSupported = false;
    shortcutExists = false;
    /** 安装标记与合并中的能力查询。 */
    private installed = false;
    private pending: Promise<void> | null = null;
    /** 无构建引导时的冷启动兼容缓存。 */
    private fallback: EntryState = { latest: {}, day: '' };
    /** 可见界面的刷新订阅。 */
    private readonly listeners = new Set<() => void>();
    /** 最新前台事件必须覆盖旧来源，并重新探测桌面状态。 */
    private readonly returned = (options: DouyinLaunchOptions = {}): void => {
        this.fallback = { latest: options, day: DouyinMissionRewards.day() };
        this.notify();
        void this.refresh();
    };
    /** 启动和首页均可幂等安装；正式包由game.js提前缓存入口。 */
    install(): void {
        const api = getDouyinGame();
        if (!api || this.installed) return;
        this.installed = true;
        try { this.fallback = { latest: api.getLaunchOptionsSync?.() || {}, day: DouyinMissionRewards.day() }; } catch { /* 无来源不允许领奖。 */ }
        api.onShow?.(this.returned);
        void this.refresh();
    }
    /** 首页及弹窗订阅能力与入口变化。 */
    subscribe(listener: () => void): void { this.listeners.add(listener); }
    /** 界面隐藏立即解除订阅。 */
    unsubscribe(listener: () => void): void { this.listeners.delete(listener); }
    /** 只通知当前订阅者，不自动发奖或导航。 */
    private notify(): void { for (const listener of this.listeners) listener(); }
    /** 按最新入口验证侧边栏；未跨日才可领取当日奖励。 */
    eligible(mission: DouyinMission): boolean {
        if (mission === 'shortcut') return this.shortcutSupported && this.shortcutExists;
        const entry = (globalThis as unknown as { __tumbleDouyinEntry?: EntryState }).__tumbleDouyinEntry || this.fallback;
        return this.sidebarSupported && entry.day === DouyinMissionRewards.day()
            && entry.latest.launch_from === 'homepage' && entry.latest.location === 'sidebar_card';
    }
    /** 查询接口有10秒上限，失败隐藏不支持入口，不以成功回调本身认定完成。 */
    private query<T>(invoke: (success: (value: T) => void, fail: () => void) => void, fallback: T): Promise<T> {
        return new Promise(resolve => {
            let settled = false;
            const finish = (value: T): void => { if (settled) return; settled = true; clearTimeout(timer); resolve(value); };
            const timer = setTimeout(() => finish(fallback), 10000);
            try { invoke(value => finish(value), () => finish(fallback)); } catch { finish(fallback); }
        });
    }
    /** 能力探测不做宿主白名单限制侧边栏；桌面按照官方Android与宿主范围显示。 */
    refresh(): Promise<void> {
        if (this.pending) return this.pending;
        const api = getDouyinGame();
        if (!api) return Promise.resolve();
        this.pending = (async () => {
            let desktop = false;
            try {
                const system = api.getSystemInfoSync?.();
                desktop = system?.platform === 'android' && ['Douyin', 'douyin_lite', 'aweme_hotsoon'].indexOf(system.appName || '') >= 0;
            } catch { /* 未知系统不显示桌面任务。 */ }
            const [sidebar, shortcut] = await Promise.all([
                api.checkScene && api.navigateToScene ? this.query<{ isExist?: boolean }>((success, fail) => api.checkScene!({ scene: 'sidebar', success, fail }), {}) : Promise.resolve({ isExist: false }),
                desktop && api.addShortcut && api.checkShortcut ? this.query<{ status?: { exist?: boolean } }>((success, fail) => api.checkShortcut!({ success, fail }), {}) : Promise.resolve<{ status?: { exist?: boolean } }>({}),
            ]);
            this.sidebarSupported = sidebar.isExist === true;
            this.shortcutSupported = desktop && !!api.addShortcut && !!api.checkShortcut && !!shortcut.status;
            this.shortcutExists = this.shortcutSupported && shortcut.status?.exist === true;
            this.notify();
        })().then(() => { this.pending = null; }, () => { this.pending = null; });
        return this.pending;
    }
    /** 必须从用户点击同步调用；导航成功只更新提示，不发放奖励。 */
    open(mission: DouyinMission): Promise<boolean> {
        const api = getDouyinGame();
        if (!api || !(mission === 'profile' ? this.sidebarSupported : this.shortcutSupported)) return Promise.resolve(false);
        return this.query<boolean>((success, fail) => {
            if (mission === 'profile') api.navigateToScene!({ scene: 'sidebar', success: () => success(true), fail });
            else api.addShortcut!({ success: () => success(true), fail });
        }, false);
    }
    /** 领奖时重新校验，侧边栏使用最新入口，桌面重新查询系统真实状态。 */
    async claim(mission: DouyinMission): Promise<'granted' | 'already' | 'failed' | 'incomplete'> {
        if (mission === 'shortcut') await this.refresh();
        if (!this.eligible(mission)) return 'incomplete';
        return DouyinMissionRewards.grant(mission);
    }
}
