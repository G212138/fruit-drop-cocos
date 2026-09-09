const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 从实际源码提取页面间的运行时依赖，防止测试只重复启动列表而漏掉间接依赖。 */
function checkPageDependencies(order) {
    const roots = {
        'page-home': 'assets/app-bundle/app-view/page/home/native',
        'page-game': 'assets/app-bundle/app-view/page/game/native',
        'pop-result': 'assets/app-bundle/app-view/pop/result/native',
    };
    const observed = new Set();
    /** 遍历本包脚本；转译后 require 不包含纯类型引用。 */
    function scan(folder, owner) {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            const file = path.join(folder, entry.name);
            if (entry.isDirectory()) { scan(file, owner); continue; }
            if (!file.endsWith('.ts') || file.endsWith('.d.ts')) continue;
            const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
                compilerOptions: { module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
            }).outputText;
            for (const match of code.matchAll(/require\(["']([^"']+)["']\)/g)) {
                if (!match[1].startsWith('.')) continue;
                const target = path.resolve(path.dirname(file), match[1]);
                for (const [dependency, root] of Object.entries(roots)) {
                    if (dependency === owner || !target.startsWith(path.resolve(root) + path.sep)) continue;
                    observed.add(owner + '->' + dependency);
                    assert.ok(order.indexOf(dependency) >= 0 && order.indexOf(dependency) < order.indexOf(owner),
                        `${owner} 的脚本依赖 ${dependency} 必须先注册：${file}`);
                }
            }
        }
    }
    for (const [owner, root] of Object.entries(roots)) scan(root, owner);
    assert.ok(observed.has('page-home->page-game'));
    assert.ok(observed.has('page-game->pop-result'));
}
/** 独立实例化启动脚本，不提供任何业务分包；复现 Native 冷启动的模块边界。 */
function instantiate(host) {
    const exports = {};
    const pending = [];
    const retries = [];
    let finishAnimation;
    let completed = 0;
    const chain = { to() { return this; }, delay() { return this; }, call(callback) { finishAnimation = callback; return this; }, start() {} };
    const cc = { sp: { Skeleton: class {} }, Node: class {}, UIOpacity: class {}, tween: () => chain,
        assetManager: { loadBundle(name, callback) { pending.push({ name, callback }); } },
        _decorator: { ccclass: () => value => value, property: () => () => {} } };
    const source = fs.readFileSync('assets/app-appinit/view/AppInit.ts', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } }).outputText;
    new Function('require', 'exports', 'TTMinis', code)(name => {
        if (name === 'cc') return cc;
        if (name.endsWith('/base/BaseAppInit')) return { default: class {} };
        throw new Error('启动包不能静态加载业务分包：' + name);
    }, exports, host);
    const init = new exports.AppInit();
    if (!host) checkPageDependencies([...init.startupBundles, 'page-home']);
    init.isValid = true;
    init.nextInit = () => completed++;
    init.scheduleOnce = (callback, seconds) => { assert.equal(seconds, 1); retries.push(callback); };
    init.logo = { getComponent: () => ({ opacity: 255 }) };
    init.node = { destroy() {} };
    init.onLoad();
    assert.equal(init.getUserAssetNum(), 2);
    finishAnimation();
    assert.equal(completed, 1);
    init.onUserInit();
    assert.equal(completed, 1, '资源包未注册前不能放行首页');
    const first = pending.shift();
    assert.equal(first.name, 'page-game-res');
    const originalWarn = console.warn;
    try {
        console.warn = () => {};
        first.callback(new Error('temporary network failure'));
    } finally { console.warn = originalWarn; }
    assert.equal(completed, 1, '失败不能计为完成');
    assert.equal(pending.length, 0);
    assert.equal(retries.length, 1);
    retries.shift()();
    for (const expected of ['page-game-res', 'page-home-res', 'pop-result-res', 'pop-result', 'page-game']) {
        const request = pending.shift();
        assert.equal(request.name, expected);
        assert.equal(completed, 1);
        request.callback(null);
    }
    assert.equal(completed, 2, '资源和跨包脚本全部注册后才能完成第二个初始化任务');
    assert.equal(pending.length, 0);
    init.onFinish();
}
instantiate(undefined);
const progress = [];
instantiate({ game: { setLoadingProgress: options => progress.push(options.progress) } });
assert.deepEqual(progress, [0, 1]);
instantiate({ game: { setLoadingProgress: () => { throw Error('SDK unavailable'); } } });
console.log('通过：Native 启动脚本不依赖业务分包，宿主进度上报缺失或失败不阻塞启动。');
