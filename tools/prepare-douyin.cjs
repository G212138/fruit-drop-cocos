const fs = require('node:fs'), path = require('node:path');
/** 仅对抖音专用AppID产物注入启动监听，不修改TikTok包。 */
function prepareDouyin(root = path.resolve(__dirname, '../build/douyin')) {
    const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'douyin-build.json'), 'utf8')).packages['bytedance-mini-game'].appid;
    const config = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
    if (config.appid !== expected) throw new Error('目标不是当前抖音AppID，拒绝修改');
    const entry = path.join(root, 'game.js');
    const code = fs.readFileSync(entry, 'utf8');
    const prefix = 'require("./douyin-bootstrap.js");';
    fs.copyFileSync(path.join(__dirname, 'douyin-bootstrap.js'), path.join(root, 'douyin-bootstrap.js'));
    if (!code.startsWith(prefix)) fs.writeFileSync(entry, prefix + '\n' + code, 'utf8');
}
module.exports = { prepareDouyin };
if (require.main === module) prepareDouyin();
