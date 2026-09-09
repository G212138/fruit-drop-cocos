import { sys } from 'cc';
import { GamePreferences } from './GamePreferences';
import { PlatformStorage } from './platform/PlatformStorage';

/** 会话共用设置入口；模型延迟加载，避免在引擎初始化前读取平台存储。 */
export class GameSettings {
    /** 当前进程唯一设置模型，页面重开不重置用户选择。 */
    private static preferences: GamePreferences | null = null;

    /** 返回供控制器更新、表现层只读的设置模型。 */
    static get current(): GamePreferences {
        if (!this.preferences) this.preferences = new GamePreferences(PlatformStorage);
        return this.preferences;
    }
}
