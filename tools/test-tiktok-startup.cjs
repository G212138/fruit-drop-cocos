const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 独立实例化启动脚本，不提供任何业务分包；复现 Native 冷启动的模块边界。 */
function instantiate(host) {
    const exports = {};
    const chain = { to() { return this; }, delay() { return this; }, call() { return this; }, start() {} };
    const cc = { sp: { Skeleton: class {} }, Node: class {}, UIOpacity: class {}, tween: () => chain,
        _decorator: { ccclass: () => value => value, property: () => () => {} } };
    const source = fs.readFileSync('assets/app-appinit/view/AppInit.ts', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } }).outputText;
    new Function('require', 'exports', 'TTMinis', code)(name => {
        if (name === 'cc') return cc;
        if (name.endsWith('/base/BaseAppInit')) return { default: class {} };
        throw new Error('启动包不能静态加载业务分包：' + name);
    }, exports, host);
    const init = new exports.AppInit();
    init.logo = { getComponent: () => ({ opacity: 255 }) };
    init.node = { destroy() {} };
    init.onLoad();
    init.onFinish();
}
instantiate(undefined);
const progress = [];
instantiate({ game: { setLoadingProgress: options => progress.push(options.progress) } });
assert.deepEqual(progress, [0, 1]);
instantiate({ game: { setLoadingProgress: () => { throw Error('SDK unavailable'); } } });
console.log('通过：Native 启动脚本不依赖业务分包，宿主进度上报缺失或失败不阻塞启动。');
