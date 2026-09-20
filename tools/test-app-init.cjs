const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 执行真实启动脚本，仅替换引擎资源接口，手动控制慢加载和失败回调。 */
const pending = [], retries = [], reports = [];
const resources=[];
let completed = 0, destroyed = false;
class Base {
    constructor() { this.isValid = true; this.node = { destroy() { destroyed = true; } }; }
    scheduleOnce(callback) { retries.push(callback); }
    nextInit() { completed += 1; }
}
const cc = {
    assetManager: {
        loadBundle(name, done) { pending.push({name, done}); },
        getBundle() { return { load(name, type, progress, done) {
            resources.push({name,progress,done});
        } }; }
    },
    sp: {Skeleton: class {}}, Node: class {}, UIOpacity: class {}, Prefab: class {},
    JsonAsset: class {},
    _decorator: {ccclass: () => target => target, property: () => () => {}}
};
const source = fs.readFileSync(path.resolve(__dirname, '../assets/app-appinit/view/AppInit.ts'), 'utf8');
const output = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true
}}).outputText;
const mod = {exports: {}};
new Function('require', 'module', 'exports', 'TTMinis', 'console', output)(
    name => name === 'cc/env' ? {DEV:true} : name === 'cc' ? cc : name === './FirstLaunch' ? {FirstLaunch: {page: 'PageHome', complete() {}}} : {default: Base}, mod, mod.exports,
    {game: {setLoadingProgress({progress}) {reports.push(progress);}}}, {warn() {}}
);
const init = new mod.exports.AppInit();
let value=0; init.flight={setProgress(p){value=p;}};
init.onLoad(); assert.equal(completed, 0);
init.onProgress(1, 5); init.onUserInit();
const first = pending.shift(); first.done(new Error('offline'));
assert.equal(completed, 0); assert.equal(pending.length, 0);
retries.shift()(); assert.equal(pending[0].name, first.name);
while (pending.length) pending.shift().done(null);
assert.equal(completed, 0, '分包注册完仍需等待首页依赖');
assert.ok(resources.some(r=>r.name==='PageGame'));
assert.ok(resources.some(r=>r.name==='levels/original-levels'));
const game=resources.find(r=>r.name==='PageGame');
for(const task of resources.filter(r=>r!==game))task.done(null);
assert.equal(completed,0,'游戏未加载完成不得进入首页');
game.progress(8,10);const before=value;game.progress(8,20);assert.equal(value,before);
game.done(new Error('offline'));assert.equal(completed,0);
retries.shift()();resources.at(-1).done(null);
assert.equal(completed,1);assert.ok(Math.abs(value-.95)<1e-9);
assert.equal(destroyed,false);
init.onFinish();assert.equal(value,1);assert.equal(destroyed,true);
assert.equal(reports.length, 0, '不调用 HTML5 专用进度接口');
console.log('AppInit：启动依赖顺序、失败重试、进度不倒退及首页完成门槛通过');
