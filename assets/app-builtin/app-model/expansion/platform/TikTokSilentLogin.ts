import { getTikTokGame, TikTokGameApi, supportsTikTok } from './TikTokRuntime';

/** 无后端模式仅确认宿主静默登录成功，不伪造 OpenID 或业务会话。 */
export class TikTokSilentLogin {
    /** 全游戏共用的静默登录入口。 */
    static readonly shared = new TikTokSilentLogin();
    /** 最近一次宿主登录是否成功，仅用于紧接着调用任务接口。 */
    ready = false;
    /** 合并同时触发的登录请求。 */
    private pending: Promise<boolean> | null = null;

    /** @param runtime 官方 SDK 获取函数，测试可注入。 */
    constructor(private readonly runtime: () => TikTokGameApi | null = getTikTokGame) {}

    /** 调用官方静默登录；临时 code 只校验存在，不落盘、不作为玩家标识。 */
    login(): Promise<boolean> {
        if (this.pending) return this.pending;
        const api = this.runtime();
        this.ready = false;
        if (!supportsTikTok(api, 'login')) return Promise.resolve(false);
        this.pending = new Promise<boolean>(resolve => {
            let finished = false;
            /** 适配超时 15 秒，防止接口无回调时锁住弹窗。 */
            const timer = setTimeout(() => finish(false), 15000);
            /** @param success 宿主真实登录结果，重复回调忽略。 */
            const finish = (success: boolean): void => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                this.ready = success;
                resolve(success);
            };
            try {
                api!.login!({
                    success: result => finish(typeof result?.code === 'string' && result.code.length > 0),
                    fail: () => finish(false),
                });
            } catch {
                finish(false);
            }
        }).then(success => {
            this.pending = null;
            return success;
        });
        return this.pending;
    }
}
