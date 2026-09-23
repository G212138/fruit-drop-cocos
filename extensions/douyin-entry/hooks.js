const fs = require('node:fs'), path = require('node:path');
exports.throwError = true;
/** 正式抖音包在game.js第一条语句安装onShow监听，其他AppID不处理。 */
exports.onAfterBuild = async (_options, result) => {
    const config = JSON.parse(fs.readFileSync(path.join(result.dest, 'project.config.json'), 'utf8'));
    const expected = require('../../tools/douyin-build.json').packages['bytedance-mini-game'].appid;
    if (config.appid !== expected) return;
    require('../../tools/prepare-douyin.cjs').prepareDouyin(result.dest);
};
