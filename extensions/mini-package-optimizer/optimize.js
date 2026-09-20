const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
    const report = { totalBytes: total, mainBytes: main, duplicateFontBytesRemoved: 0 };
    // 仅记录包体统计，不以本地固定门槛阻断构建。
    return report;
}
module.exports = { optimize };
if (require.main === module) console.log(optimize(process.argv[2]));
