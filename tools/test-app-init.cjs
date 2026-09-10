const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 执行真实启动脚本，仅替换引擎资源接口，手动控制慢加载和失败回调。 */
const pending = [], retries = [], reports = [];
let resourceProgress, resourceDone, completed = 0, destroyed = false;
class Base {
    constructor() { this.isValid = true; this.node = { destroy() { destroyed = true; } }; }
    scheduleOnce(callback) { retries.push(callback); }
    nextInit() { completed += 1; }
}
const cc = {
    assetManager: {
        loadBundle(name, done) { pending.push({name, done}); },
        getBundle() { return { load(name, type, progress, done) {
            assert.equal(name, 'PageHome'); resourceProgress = progress; resourceDone = done;
        } }; }
    },
    sp: {Skeleton: class {}}, Node: class {}, UIOpacity: class {}, Prefab: class {},
    ProgressBar: class {}, Label: class {},
    _decorator: {ccclass: () => target => target, property: () => () => {}}
};
const source = fs.readFileSync(path.resolve(__dirname, '../assets/app-appinit/view/AppInit.ts'), 'utf8');
const output = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true
}}).outputText;
const mod = {exports: {}};
new Function('require', 'module', 'exports', 'TTMinis', 'console', output)(
    name => name === 'cc' ? cc : {default: Base}, mod, mod.exports,
    {game: {setLoadingProgress({progress}) {reports.push(progress);}}}, {warn() {}}
);
const init = new mod.exports.AppInit();
init.loadingBar = {progress: 0}; init.progressLabel = {string: ''};
init.onLoad(); assert.equal(completed, 0);
init.onProgress(1, 5); init.onUserInit();
const first = pending.shift(); first.done(new Error('offline'));
assert.equal(completed, 0); assert.equal(pending.length, 0);
retries.shift()(); assert.equal(pending[0].name, first.name);
while (pending.length) pending.shift().done(null);
assert.equal(completed, 0, '分包注册完仍需等待首页依赖');
resourceProgress(8, 10); const before = init.loadingBar.progress;
resourceProgress(8, 20); assert.equal(init.loadingBar.progress, before, '资源总数增长不倒退');
resourceDone(new Error('offline')); assert.equal(completed, 0);
retries.shift()(); resourceProgress(1, 1); resourceDone(null);
assert.equal(completed, 1); assert.equal(init.loadingBar.progress, 0.95);
assert.equal(destroyed, false, '首页尚未展示不能释放启动画面');
init.onFinish(); assert.equal(init.loadingBar.progress, 1);
assert.equal(init.progressLabel.string, '100%'); assert.equal(destroyed, true);
assert.ok(reports.every((value, index) => index === 0 || value >= reports[index - 1]));
console.log('AppInit：启动依赖顺序、失败重试、进度不倒退及首页完成门槛通过');
