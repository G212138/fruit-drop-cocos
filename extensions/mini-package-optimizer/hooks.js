exports.title = '小游戏启动图优化与包体统计';
exports.throwError = false;
/** 每次构建重新读取优化器；可选优化失败不阻断游戏构建。 */
exports.onAfterBuild = async (options, result) => {
    if (options.md5Cache) {
        console.warn('[mini-package-optimizer] MD5 Cache 已开启，跳过可选优化。');
        return;
    }
    try {
        const modulePath = require.resolve('./optimize');
        delete require.cache[modulePath];
        const { optimize } = require(modulePath);
        console.log('[mini-package-optimizer]', optimize(result.dest));
    } catch (error) {
        console.warn('[mini-package-optimizer] 可选优化未完成，保留构建结果：', error);
    }
};
