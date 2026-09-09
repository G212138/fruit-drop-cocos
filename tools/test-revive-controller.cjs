const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const completed = [], events = [];
const app = { store: {} };
/** 保留真实控制器与状态实现，只替换框架事件和存储边界。 */
function load(relative) {
    const module = { exports: {} };
    const file = path.resolve(relative);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
        if (name === 'cc') return { sys: { localStorage: {} } };
        if (name.endsWith('/PlatformStorage')) return { PlatformStorage: {} };
        if (name === 'db://app/base/BaseController') return { default: () => class {
            static Event = { Changed: 'changed' };
            emit(event) { events.push(event); }
        } };
        if (name.endsWith('/app/app')) return { app };
        if (name.endsWith('/LevelProgress')) return { LevelProgress: class {
            complete(level) { completed.push(level); }
        } };
        throw new Error('意外依赖：' + name);
    }, module, module.exports);
    return module.exports;
}
const Game = load('assets/app-builtin/app-model/store.game.ts').default;
app.store.game = new Game();
const { GameController } = load('assets/app-builtin/app-controller/GameController.ts');
const controller = new GameController();
controller.begin(4, 12);
controller.matched();controller.lose();
const before = events.length;
assert.equal(controller.revive(), true);
assert.equal(events.length, before + 1);
assert.equal(controller.revive(), false);
assert.equal(events.length, before + 1, '重复奖励不发布状态变化');
controller.matched();controller.matched();
assert.deepEqual(completed, [12], '复活后通关仍只保存一次本关进度');
controller.begin(2, 1, true);controller.lose();controller.revive();controller.matched();
assert.deepEqual(completed, [12], '编辑器试玩复活通关不写玩家存档');
console.log('通过：真实控制器复活通知、重复奖励拒绝、正式关通关存档与试玩隔离。');
