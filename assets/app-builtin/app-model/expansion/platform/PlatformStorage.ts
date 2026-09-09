import { sys } from 'cc';
import { getTikTokGame, supportsTikTok } from './TikTokRuntime';

/** 统一业务本地存档入口；保留原存档键和 JSON 格式，不伪装成云存档。 */
export const PlatformStorage = {
    /** @param key 业务存档键；平台存储失败向上抛错，不回退到另一份存档。 */
    getItem(key: string): string | null {
        const api = getTikTokGame();
        if (!api) return sys.localStorage.getItem(key);
        if (!supportsTikTok(api, 'getStorageSync')) throw new Error('TikTok storage unavailable');
        const value = api.getStorageSync!(key);
        if (value === null || value === undefined || value === '') return null;
        if (typeof value !== 'string') throw new Error('TikTok storage format invalid');
        return value;
    },
    /** @param key 业务存档键。 @param value 业务已序列化的数据；同步写入成功才允许发奖或扣道具。 */
    setItem(key: string, value: string): void {
        const api = getTikTokGame();
        if (!api) { sys.localStorage.setItem(key, value); return; }
        if (!supportsTikTok(api, 'setStorageSync')) throw new Error('TikTok storage unavailable');
        api.setStorageSync!(key, value);
    },
};
