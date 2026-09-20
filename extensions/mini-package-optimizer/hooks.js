const { optimize } = require('./optimize');
exports.title = '小游戏资源去重与包体统计';
exports.throwError = true;
/** 构建结束后处理输出目录，不更改工程图片或引擎代码。 */
exports.onAfterBuild = async (options, result) => {
    if (options.md5Cache) throw new Error('包体优化暂不支持 MD5 Cache，请关闭后构建。');
    console.log('[mini-package-optimizer]', optimize(result.dest));
};
