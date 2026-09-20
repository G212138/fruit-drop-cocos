import { ProgressStorage } from './LevelProgress';
/** 地块目录；稳定编号用于存档，文件名集中维护，淘汰稿不参与选择。 */
export const terrainCatalog = [
    {
        "id": "grass",
        "zh": "晴日草坡",
        "en": "Sunny Grass",
        "file": "01-sunny-grass-current"
    },
    {
        "id": "cream",
        "zh": "奶油饼干谷",
        "en": "Cream Biscuit",
        "file": "02-cream-biscuit-draft"
    },
    {
        "id": "coast",
        "zh": "海岸沙丘",
        "en": "Coastal Dunes",
        "file": "03-coastal-dunes-draft"
    },
    {
        "id": "snow",
        "zh": "冬日雪坡",
        "en": "Winter Snow",
        "file": "04-winter-slope-draft"
    },
    {
        "id": "forest",
        "zh": "苔石森林",
        "en": "Moss Forest",
        "file": "05-moss-forest-draft"
    },
    {
        "id": "canyon",
        "zh": "赤岩峡谷",
        "en": "Red Canyon",
        "file": "06-red-canyon-draft"
    },
    {
        "id": "ice",
        "zh": "蓝冰裂谷",
        "en": "Blue Glacier",
        "file": "08-blue-ice-draft"
    },
    {
        "id": "wood",
        "zh": "古树树洞",
        "en": "Ancient Tree",
        "file": "09-ancient-wood-draft"
    },
    {
        "id": "cake",
        "zh": "奶油夹层蛋糕",
        "en": "Cream Layer Cake",
        "file": "11-cream-cake-v2-draft"
    },
    {
        "id": "lava",
        "zh": "熔岩巨龙",
        "en": "Lava Dragon",
        "file": "12-lava-dragon-draft"
    },
    {
        "id": "aurora",
        "zh": "极光冰龙",
        "en": "Aurora Dragon",
        "file": "14-aurora-dragon-draft"
    }
] as const;
/** 地块偏好独立保存，不读取或修改掉落物解锁进度。 */
export class TerrainProgress {
    /** 地块存档版本键，不沿用旧物品主题键。 */
    private readonly key = 'fruit-drop.terrain.v1';
    /** 当前地块稳定编号，旧玩家默认保留草坡。 */
    selected: string = 'grass';
    /** 存储异常提示状态。 */
    warning = '';
    /** @param storage 平台存储边界。 */
    constructor(private readonly storage: ProgressStorage) {
        try {
            const raw = storage.getItem(this.key);
            if (!raw) return;
            const value = JSON.parse(raw);
            if (value.version !== 1 || !terrainCatalog.some(item => item.id === value.selected)) throw new Error('invalid terrain');
            this.selected = value.selected;
        } catch { this.warning = 'read'; }
    }
    /** @param id 地块编号；持久化成功后才应用，写入失败保留旧选择。 */
    select(id: string): boolean {
        if (!terrainCatalog.some(item => item.id === id)) return false;
        try {
            this.storage.setItem(this.key, JSON.stringify({ version: 1, selected: id }));
            this.selected = id;
            this.warning = '';
            return true;
        } catch {
            this.warning = 'write';
            return false;
        }
    }
}
