const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
/** 将构建配置中的压缩 UUID 还原为资源文件夹名。 */
function decode(uuid) {
    if (uuid.length !== 22) return uuid;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let hex = uuid.slice(0, 2);
    for (let i = 2; i < 22; i += 2) hex += ((alphabet.indexOf(uuid[i]) << 6) | alphabet.indexOf(uuid[i + 1])).toString(16).padStart(3, '0');
    return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
/** 只遍历指定构建目录下的普通文件，拒绝符号链接。 */
function files(root) {
    const result = [];
    for (const item of fs.readdirSync(root, { withFileTypes: true })) {
        if (item.isSymbolicLink()) throw new Error('构建目录包含符号链接：' + item.name);
        const file = path.join(root, item.name);
        result.push(...(item.isDirectory() ? files(file) : [file]));
    }
    return result;
}
/** 优化当前字节小游戏输出；参数必须是含 game.json 的完整构建目录。 */
function optimize(output) {
    const root = path.resolve(output);
    if (!fs.existsSync(path.join(root, 'game.json'))) throw new Error('不是小游戏构建目录');
    const ownerName = fs.existsSync(path.join(root, 'subpackages', 'shared-ui', 'config.json')) ? 'shared-ui' : 'page-home-res';
    const bundleRoot = path.join(root, 'subpackages');
    const ownerFile = path.join(bundleRoot, ownerName, 'config.json');
    if (!fs.existsSync(ownerFile)) throw new Error('缺少未启用MD5的字体所属包配置');
    const owner = JSON.parse(fs.readFileSync(ownerFile));
    const fontIds = new Set(Object.entries(owner.paths).filter(([,p]) => /^(font\/(Bold|XESENGLISHFONT_REGULAR)|fonts\/resources-font-(Bold|XESENGLISHFONT_REGULAR))$/.test(p[0])).map(([i]) => owner.uuids[i]));
    if (fontIds.size !== 2) throw new Error('共享字体列表不完整');
    let removed = 0;
    for (const entry of fs.readdirSync(bundleRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === ownerName) continue;
        const folder = path.join(bundleRoot, entry.name);
        const configFile = path.join(folder, 'config.json');
        if (!fs.existsSync(configFile)) continue;
        const config = JSON.parse(fs.readFileSync(configFile));
        const indices = config.uuids.map((u,i) => fontIds.has(u) ? i : -1).filter(i => i >= 0);
        if (!indices.length) continue;
        const deps = config.deps || [];
        let target = deps.indexOf(ownerName);
        if (target < 0) { target = deps.length; deps.push(ownerName); }
        const redirects = new Map();
        for (let i = 0; i < config.redirect.length; i += 2) redirects.set(Number(config.redirect[i]), Number(config.redirect[i+1]));
        indices.forEach(i => redirects.set(i, target));
        const used = [...new Set(redirects.values())];
        config.deps = used.map(i => deps[i]);
        config.redirect = [...redirects].flatMap(([i,d]) => [i, String(used.indexOf(d))]);
        fs.writeFileSync(configFile, JSON.stringify(config));
        // 只有所属包中存在完全相同文件时才删除当前包的冗余字体文件。
        for (const uuid of fontIds) {
            const expanded = decode(uuid);
            const native = path.join(folder, 'native', expanded.slice(0,2), expanded);
            const ownerNative = path.join(bundleRoot, ownerName, 'native', expanded.slice(0,2), expanded);
            if (!fs.existsSync(native) || !fs.existsSync(ownerNative)) continue;
            for (const file of files(native)) {
                const equivalent = path.join(ownerNative, path.relative(native, file));
                if (fs.existsSync(equivalent) && fs.readFileSync(file).equals(fs.readFileSync(equivalent))) {
                    removed += fs.statSync(file).size;
                    fs.unlinkSync(file);
                }
            }
        }
    }
    const settingsFile = path.join(root, 'src', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsFile));
    const background = settings.splashScreen?.background;
    const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'splash-source.json'))).sha256;
    if (background?.base64?.startsWith('data:image/png;base64,')) {
        const bytes = Buffer.from(background.base64.split(',')[1], 'base64');
        if (crypto.createHash('sha256').update(bytes).digest('hex') === expected) {
            background.base64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'splash-background.jpg')).toString('base64');
            fs.writeFileSync(settingsFile, JSON.stringify(settings));
        } else console.warn('启动背景已变化，保留新图，请重新检查主包体积。');
    }
    const all = files(root);
    const total = all.reduce((n,f) => n + fs.statSync(f).size, 0);
    const main = all.filter(f => !path.relative(root,f).startsWith('subpackages' + path.sep)).reduce((n,f) => n + fs.statSync(f).size, 0);
    const report = { totalBytes: total, mainBytes: main, duplicateFontBytesRemoved: removed };
    // 仅记录包体统计，不以本地固定门槛阻断构建。
    return report;
}
module.exports = { optimize };
if (require.main === module) console.log(optimize(process.argv[2]));
