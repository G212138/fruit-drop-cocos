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
/** 地块选择及两次广告解锁独立保存，不修改掉落物进度。 */
export class TerrainProgress {
    /** 沿用原键并升级结构为第二版，旧版自由选择不自动取得解锁权益。 */
    private readonly key = 'fruit-drop.terrain.v1';
    /** 默认只开放目录第一项。 */
    selected: string = terrainCatalog[0].id;
    /** 各地块完整观看次数，最大为两次。 */
    private views: Record<string, number> = {};
    /** 存储失败状态。 */
    warning = '';
    /** @param storage 平台持久化边界。 */
    constructor(private readonly storage: ProgressStorage) {
        try {
            const raw = storage.getItem(this.key);
            if (!raw) return;
            const value = JSON.parse(raw);
            if (value.version === 1) return;
            if (value.version !== 2) throw new Error('invalid terrain');
            for (const entry of terrainCatalog) {
                const count = value.views?.[entry.id];
                if (Number.isInteger(count) && count >= 0 && count <= 2) this.views[entry.id] = count;
            }
            if (this.isUnlocked(value.selected)) this.selected = value.selected;
        } catch { this.warning = 'read'; }
    }
    /** @param id 稳定地块编号。 */
    watched(id: string): number { return this.views[id] || 0; }
    /** @param id 只有默认项或完整观看两次的地块可使用。 */
    isUnlocked(id: string): boolean {
        return terrainCatalog.some(item => item.id === id) && (id === terrainCatalog[0].id || this.watched(id) >= 2);
    }
    /** @param id 已通过广告门禁校验的目标地块；写入成功才累计一次。 */
    recordReward(id: string): boolean {
        if (!terrainCatalog.some(item => item.id === id) || this.isUnlocked(id)) return false;
        const views = { ...this.views, [id]: this.watched(id) + 1 };
        return this.save(this.selected, views);
    }
    /** @param id 已解锁地块；保存失败不改变选择。 */
    select(id: string): boolean {
        return this.isUnlocked(id) && this.save(id, this.views);
    }
    /** @param selected 已确认选项。 @param views 已校验的完整观看次数。 */
    private save(selected: string, views: Record<string, number>): boolean {
        try {
            this.storage.setItem(this.key, JSON.stringify({ version: 2, selected, views }));
            this.selected = selected;
            this.views = views;
            this.warning = '';
            return true;
        } catch { this.warning = 'write'; return false; }
    }
}
