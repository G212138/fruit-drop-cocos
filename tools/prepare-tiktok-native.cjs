const fs = require('node:fs');
const path = require('node:path');
/** Cocos 基础构建目录与适配后的输出目录，均限定在当前仓库 build 下。 */
const base = path.resolve(__dirname, '../build/tiktok-base');
const output = path.resolve(__dirname, '../build/tiktok-native');
/** @param directory 已验证的本地目录，计算未压缩文件字节数。 */
function bytes(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
        const file = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error('代码包禁止包含符号链接：' + file);
        return total + (entry.isDirectory() ? bytes(file) : fs.statSync(file).size);
    }, 0);
}
/** 检查、复制构建产物并添加 Native SDK 命名空间兼容入口。 */
function prepare() {
    const settings = JSON.parse(fs.readFileSync(path.join(base, 'src/settings.json'), 'utf8'));
    if (settings.engine.platform !== 'bytedance-mini-game' || settings.engine.debug) throw new Error('必须先使用正式 Cocos 小游戏基础构建');
    if (fs.existsSync(output)) throw new Error('输出目录已存在，请保留或重命名旧包后再执行：' + output);
    const config = JSON.parse(fs.readFileSync(path.join(base, 'game.json'), 'utf8'));
    const project = JSON.parse(fs.readFileSync(path.join(base, 'project.config.json'), 'utf8'));
    if (project.appid !== 'mg1swkarpsswyb0z') throw new Error('Client Key 不匹配');
    let subpackageBytes = 0;
    for (const item of config.subpackages || []) {
        const directory = path.resolve(base, item.root);
        if (!directory.startsWith(base + path.sep) || !fs.statSync(directory).isDirectory()) throw new Error('分包目录无效');
        const size = bytes(directory);
        if (item.independent && size > 4 * 1024 * 1024) throw new Error('独立分包超过 4 MiB');
        subpackageBytes += size;
    }
    const total = bytes(base);
    // 官方 Native 非 Unity 限制：总包 30 MiB，主包 4 MiB；为入口预留 4 KiB。
    if (total + 4096 > 30 * 1024 * 1024 || total - subpackageBytes + 4096 > 4 * 1024 * 1024) throw new Error('代码包超过 TikTok 大小限制');
    fs.cpSync(base, output, { recursive: true, errorOnExist: true, force: false });
    const entry = path.join(output, 'game.js');
    // 官方 Native FAQ 支持 TTMinis.game、tt、wx 等价命名空间；Cocos 基础适配器使用 tt。
    // 仅在专用 Native 代码包入口桥接，浏览器及其他平台业务不做全局别名修改。
    const bridge = `/* Tumble Match: TikTok Native namespace adapter */
(function () {
    var api = typeof TTMinis !== 'undefined' && TTMinis.game ? TTMinis.game : typeof tt !== 'undefined' ? tt : null;
    if (!api) throw new Error('TikTok Native runtime is required');
    if (typeof TTMinis === 'undefined') globalThis.TTMinis = { game: api };
    if (typeof tt === 'undefined') globalThis.tt = api;
})();
`;
    fs.writeFileSync(entry, bridge + fs.readFileSync(entry, 'utf8'));
    console.log(JSON.stringify({ output, totalMiB: bytes(output) / 1048576, mainMiB: (bytes(output) - subpackageBytes) / 1048576, status: 'prepared-not-device-verified' }, null, 2));
}
prepare();
