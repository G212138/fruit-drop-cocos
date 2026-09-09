import { TikTokConfig } from './TikTokConfig';
import { TikTokSession } from './TikTokLogin';
import { getTikTokGame, supportsTikTok } from './TikTokRuntime';

/** 自有后端客户端，仅传临时码，平台密钥与 OAuth Token 均不进入游戏包。 */
export class TikTokLoginBackend {
    /** @param code 本次 SDK 临时登录码。 @param clientKey 当前小游戏公开标识。 */
    static exchange(code: string, clientKey: string): Promise<TikTokSession> {
        const api = getTikTokGame();
        if (!/^https:\/\/[^/]+\//.test(TikTokConfig.loginEndpoint) || !supportsTikTok(api, 'request')) {
            return Promise.reject(new Error('Login backend unavailable'));
        }
        return new Promise((resolve, reject) => {
            try {
                api!.request!({
                    url: TikTokConfig.loginEndpoint,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: { code, clientKey },
                    // 适配超时 10 秒，短于完整登录链路的 15 秒超时。
                    timeout: 10000,
                    success: response => {
                        if (response.statusCode !== 200 || !response.data || typeof response.data !== 'object') {
                            reject(new Error('Login backend rejected'));
                            return;
                        }
                        resolve(response.data as TikTokSession);
                    },
                    fail: () => reject(new Error('Login network failed')),
                });
            } catch { reject(new Error('Login request failed')); }
        });
    }
}
