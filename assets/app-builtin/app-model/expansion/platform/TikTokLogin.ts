import { TikTokConfig } from './TikTokConfig';
import { getTikTokGame, supportsTikTok, TikTokGameApi } from './TikTokRuntime';

/** 自有后端交换登录码后返回的游戏会话，不包含 TikTok access_token。 */
export interface TikTokSession {
    /** 自有后端校验过的玩家标识。 */
    playerId: string;
    /** 自有游戏会话令牌，仅保存在当前进程。 */
    sessionToken: string;
    /** 游戏会话有效期，Unix 毫秒，由自有后端签发。 */
    expiresAt: number;
}

/** 自有后端交换边界；最终服务器实现确认后注入，不在客户端放 Client Secret。 */
export type TikTokCodeExchange = (code: string, clientKey: string) => Promise<TikTokSession>;

/** 静默登录与业务会话分离；未接后端不伪造已登录状态。 */
export class TikTokLogin {
    /** 全游戏共用的短期登录会话。 */
    static readonly shared = new TikTokLogin();
    /** 当前启动周期的会话，只读入口会检查有效期。 */
    private session: TikTokSession | null = null;
    /** 合并同时发起的静默登录请求。 */
    private pending: Promise<TikTokSession | null> | null = null;
    /** 经确认的自有后端实现，尚未部署时为空。 */
    private exchange: TikTokCodeExchange | null = null;

    /** @param runtime SDK 获取函数，测试可替换平台能力。 */
    constructor(private readonly runtime: () => TikTokGameApi | null = getTikTokGame) {}

    /** @param exchange 将临时登录码交给自有后端的 HTTPS 实现。 */
    configure(exchange: TikTokCodeExchange): void {
        this.exchange = exchange;
    }

    /** 返回仍有效的会话；过期后要求重新静默登录。 */
    get current(): TikTokSession | null {
        return this.session && this.session.expiresAt > Date.now() ? this.session : null;
    }

    /** 获取平台临时码后立即交给后端；未配置后端或失败时返回空值。 */
    login(): Promise<TikTokSession | null> {
        if (this.current) return Promise.resolve(this.current);
        if (this.pending) return this.pending;
        const api = this.runtime();
        const exchange = this.exchange;
        if (!exchange || !supportsTikTok(api, 'login')) return Promise.resolve(null);
        this.pending = new Promise<TikTokSession | null>(resolve => {
            let settled = false;
            let exchanging = false;
            /** 适配超时 15 秒，包含平台取码及后端请求，避免阻塞启动。 */
            const timer = setTimeout(() => finish(null), 15000);
            /** @param session 仅保存后端成功签发且仍有效的游戏会话。 */
            const finish = (session: TikTokSession | null): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                this.session = session;
                resolve(session);
            };
            try {
                api!.login!({
                    success: result => {
                        if (settled || exchanging) return;
                        exchanging = true;
                        if (!result || typeof result.code !== 'string' || !result.code) { finish(null); return; }
                        Promise.resolve().then(() => exchange(result.code, TikTokConfig.clientKey)).then(session => {
                            const valid = session && typeof session.playerId === 'string' && !!session.playerId
                                && typeof session.sessionToken === 'string' && !!session.sessionToken
                                && Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
                            finish(valid ? session : null);
                        }, () => finish(null));
                    },
                    fail: () => finish(null),
                });
            } catch { finish(null); }
        }).then(session => { this.pending = null; return session; });
        return this.pending;
    }
}
