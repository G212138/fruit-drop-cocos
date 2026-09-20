import { TerrainProgress, terrainCatalog } from './TerrainProgress';
import { PlatformStorage } from './platform/PlatformStorage';
/** 地块会话服务，与 GameTheme 的掉落物选择完全独立。 */
export class GameTerrain {
    /** 延迟创建的存档模型。 */
    private static model: TerrainProgress | null = null;
    /** 获取当前地块偏好。 */
    static get current(): TerrainProgress {
        if (!this.model) this.model = new TerrainProgress(PlatformStorage);
        return this.model;
    }
    /** 获取已确认地块配置。 */
    static get entry(): typeof terrainCatalog[number] {
        return terrainCatalog.find(item => item.id === this.current.selected) || terrainCatalog[0];
    }
}
