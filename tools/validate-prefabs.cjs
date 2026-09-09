const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../assets');
const uuids = new Set();
const prefabs = [];
const scriptTypes = new Map();
/** 根据资源真实 UUID 生成 Creator 脚本类标识，只用于只读校验，不修改资产。 */
function scriptId(uuid) {
    const hex = uuid.replace(/-/g, '');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = hex.slice(0, 5);
    for (let index = 5; index < hex.length; index += 3) {
        const value = parseInt(hex.slice(index, index + 3), 16);
        result += alphabet[value >> 6] + alphabet[value & 63];
    }
    return result;
}
/** 遍历工程资源文件，建立编辑器实际生成的 UUID 集合。 */
function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const file = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (entry.name.endsWith('.meta')) {
            const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
            readMeta(meta);
            if (entry.name.endsWith('.ts.meta') && fs.existsSync(file.slice(0, -5))) {
                scriptTypes.set(scriptId(meta.uuid), path.basename(file, '.ts.meta'));
            }
        }
        else if (entry.name.endsWith('.prefab') && file.includes('app-view')) prefabs.push(file);
    }
}
/** 包括图片子资源在内收集 UUID，不根据命名推测。 */
function readMeta(meta) {
    if (meta.uuid) uuids.add(meta.uuid);
    for (const sub of Object.values(meta.subMetas || {})) readMeta(sub);
}
/** 校验节点索引和跨资源引用，发现缺失时报告所在字段。 */
function inspect(value, entries, location) {
    if (!value || typeof value !== 'object') return;
    if ('__id__' in value) assert.ok(entries[value.__id__], '无效节点索引：' + location);
    if ('__uuid__' in value) assert.ok(uuids.has(value.__uuid__), '缺失资源：' + location + ' ' + value.__uuid__);
    if (value.node && value.__type__ && !value.__type__.startsWith('cc.') && !value.__type__.startsWith('sp.')) {
        assert.ok(scriptTypes.has(value.__type__), '缺失组件脚本：' + location + ' ' + value.__type__);
        const required = {
            GameBoard: ['spawner', 'removalEffectsRoot', 'lockWallRoot', 'levelHintRoot', 'leftBoundary', 'rightLine'],
            FruitSpawner: ['fruitRoot', 'hiddenFruitPrefab', 'iceFruitPrefab', 'blackHolePrefab'],
            PageGame: ['bottomProgressRoot', 'propToolbarRoot', 'boardRoot', 'hudRoot', 'gameBoardNode', 'gameHudNode', 'backgroundNode'],
            GameHud: ['topBar', 'direction', 'downFrame', 'rightFrame', 'fruitTopBoundary', 'title', 'hint'],
            FruitProgressView: ['remaining', 'percentage', 'progressRoot', 'dark', 'bright', 'frames'],
            PropToolbar: ['shuffleCount', 'eliminateCount', 'shuffleAd', 'eliminateAd'],
            RemovalEffects: ['explosionPrefab', 'audio', 'mergeAudio', 'bagRoot'],
            FruitBagView: ['body', 'target', 'audio'],
            NewbieGuideView: ['skeleton'],
            GroundImpactView: ['skeleton', 'audio'],
        }[scriptTypes.get(value.__type__)] || [];
        for (const field of required) assert.ok(value[field], '必填绑定为空：' + location + '.' + field);
    }
    for (const [key, child] of Object.entries(value)) inspect(child, entries, location + '.' + key);
}
walk(root);
assert.equal(prefabs.length, 81);
for (const file of process.argv.length > 2 ? process.argv.slice(2).map(file => path.resolve(file)) : prefabs) {
    const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
    inspect(entries, entries, path.basename(file));
    console.log('引用有效：' + path.basename(file));
}
