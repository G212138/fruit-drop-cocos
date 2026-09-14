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
/** 独立实例化当前实际资源进度启动流程，不引入业务分包。 */
function instantiate(host, first = false) {
    const saved = new Map(first ? [] : [['fruit-drop.first-entry.v1', '1']]);
    const localStorage = { getItem: key => saved.get(key) || null, setItem: (key,value) => saved.set(key,value) };
    if (host?.game) Object.assign(host.game, { getStorageSync: localStorage.getItem, setStorageSync: localStorage.setItem });
    const exports = {};
    const pending = [];
    const retries = [];
    let completed = 0;
    let homeLoad;
    const cc = { sys: { localStorage }, sp: { Skeleton: class {} }, Node: class {}, UIOpacity: class {}, Prefab: class {}, ProgressBar: class {}, Label: class {},
        assetManager: {
            loadBundle(name, callback) { pending.push({ name, callback }); },
            getBundle(name) {
                assert.equal(name, first ? 'page-game' : 'page-home');
                return { load(asset, type, progress, callback) { homeLoad = { asset, progress, callback }; } };
            },
        },
        _decorator: { ccclass: () => value => value, property: () => () => {} } };
    const source = fs.readFileSync('assets/app-appinit/view/AppInit.ts', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } }).outputText;
    new Function('require', 'exports', 'TTMinis', code)(name => {
        if (name === './FirstLaunch') {
            const route = {};
            const routeCode = ts.transpileModule(fs.readFileSync('assets/app-appinit/view/FirstLaunch.ts','utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText;
            new Function('require','exports','TTMinis',routeCode)(() => cc, route, host);
            return route;
        }
        if (name === 'cc') return cc;
        if (name.endsWith('/base/BaseAppInit')) return { default: class {} };
        throw new Error('启动包不能静态加载业务分包：' + name);
    }, exports, host);
    const init = new exports.AppInit();
    if (!host) checkPageDependencies(init.startupBundles);
    init.isValid = true;
    init.nextInit = () => completed++;
    init.scheduleOnce = (callback, seconds) => { assert.equal(seconds, 1); retries.push(callback); };
    init.logo = { getComponent: () => ({ opacity: 255 }) };
    init.loadingBar = { progress: 0 };
    init.progressLabel = { string: '' };
    init.node = { destroy() {} };
    init.onLoad();
    assert.equal(init.getUserAssetNum(), 1);
    assert.equal(completed, 0);
    init.onUserInit();
    const firstRequest = pending.shift();
    assert.equal(firstRequest.name, 'page-game-res');
    const warn = console.warn;
    try { console.warn = () => {}; firstRequest.callback(new Error('temporary network failure')); }
    finally { console.warn = warn; }
    assert.equal(completed, 0, '分包失败不能放行首页');
    retries.shift()();
    for (const expected of ['page-game-res', 'page-home-res', 'pop-result-res', 'pop-result', 'page-game', 'page-home']) {
        const request = pending.shift();
        assert.equal(request.name, expected);
        request.callback(null);
    }
    assert.equal(completed, 0, '脚本就绪但首页图片未加载不能放行');
    assert.equal(homeLoad.asset, first ? 'PageGame' : 'PageHome');
    homeLoad.progress(2, 4);
    const progress = init.loadingBar.progress;
    homeLoad.progress(1, 10);
    assert.equal(init.loadingBar.progress, progress, '加载总量变化时进度不得倒退');
    homeLoad.callback(null);
    assert.equal(completed, 1);
    assert.equal(init.loadingBar.progress, .95);
    if (first) assert.equal(saved.has('fruit-drop.first-entry.v1'), false);
    init.onFinish();
    assert.equal(saved.get('fruit-drop.first-entry.v1'), '1');
    assert.equal(init.loadingBar.progress, 1);
}
instantiate(undefined);
instantiate(undefined, true);
instantiate({game:{}}, true);
const progress = [];
instantiate({ game: { setLoadingProgress: options => progress.push(options.progress) } });
assert.equal(progress[0], 0);
assert.equal(progress.at(-1), 1);
assert.ok(progress.every((value, index) => index === 0 || value >= progress[index - 1]));
instantiate({ game: { setLoadingProgress: () => { throw Error('SDK unavailable'); } } });
console.log('通过：Native 启动包边界、分包失败重试、首页依赖加载后放行、实际进度不倒退及宿主进度接口失败。');
