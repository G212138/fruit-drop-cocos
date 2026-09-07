const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../assets');
const uuids = new Set();
const prefabs = [];
/** 遍历工程资源文件，建立编辑器实际生成的 UUID 集合。 */
function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const file = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (entry.name.endsWith('.meta')) readMeta(JSON.parse(fs.readFileSync(file, 'utf8')));
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
    for (const [key, child] of Object.entries(value)) inspect(child, entries, location + '.' + key);
}
walk(root);
assert.equal(prefabs.length, 40);
for (const file of prefabs) {
    const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
    inspect(entries, entries, path.basename(file));
    console.log('引用有效：' + path.basename(file));
}
