const fs = require('node:fs');
const path = require('node:path');
/** 抖音独立构建检查，不修改TikTok产物，也不注入TTMinis桥接。 */
function checkDouyinBuild() {
    const root = path.resolve(__dirname, '../build/douyin');
    const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'douyin-build.json'), 'utf8'));
    const appId = config.packages['bytedance-mini-game'].appid;
    if (!appId) throw new Error('请先填写 tools/douyin-build.json 的抖音 App ID');
    if (!/^tt[0-9a-z]+$/i.test(appId)) throw new Error('抖音 App ID 格式不正确，不能使用 TikTok Client Key');
    const project = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
    if (project.appid !== appId) throw new Error('构建产物与抖音配置的 App ID 不一致');
    const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
    if (!game.startsWith('require("./douyin-bootstrap.js");')) throw new Error('缺少game.js首行入口监听，请运行node tools/prepare-douyin.cjs');
    if (!fs.existsSync(path.join(root, 'douyin-bootstrap.js'))) throw new Error('缺少抖音入口监听文件');
    if (game.includes('TikTok Native namespace adapter') || /globalThis\.TTMinis\s*=/.test(game)) {
        throw new Error('抖音产物中不能包含 TikTok Native 桥接');
    }
    console.log('抖音构建目录与 App ID 检查通过：' + root);
}
checkDouyinBuild();
