const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../assets/app-builtin/app-model/expansion/GamePreferences.ts'), 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
}).outputText;
const result = {};
new Function('exports', output)(result);
const {GamePreferences} = result;
const entries = new Map([['fruit-drop.progress.v1', '关卡存档不应改变']]);
const storage = {getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value)};
const state = new GamePreferences(storage);
assert.deepEqual(state.snapshot, {music: true, sound: true, vibrate: true});
assert.equal(state.toggle('music'), false);
assert.deepEqual(state.snapshot, {music: false, sound: true, vibrate: true});
state.toggle('sound'); state.toggle('vibrate');
assert.deepEqual(new GamePreferences(storage).snapshot, {music: false, sound: false, vibrate: false});
assert.equal(entries.get('fruit-drop.progress.v1'), '关卡存档不应改变');
const snapshot = state.snapshot;
snapshot.music = true;
assert.equal(state.snapshot.music, false);
for (const raw of ['null', '{}', '{', '{"version":2,"music":false,"sound":false,"vibrate":false}', '{"version":1,"music":"false","sound":false,"vibrate":false}']) {
    const invalid = new GamePreferences({getItem: () => raw, setItem: () => {}});
    assert.deepEqual(invalid.snapshot, {music: true, sound: true, vibrate: true});
    assert.ok(invalid.warning);
}
let fail = true;
const unavailable = new GamePreferences({getItem: () => null, setItem: () => {if (fail) throw new Error('容量不足');}});
assert.equal(unavailable.toggle('sound'), false);
assert.ok(unavailable.warning);
fail = false;
assert.equal(unavailable.toggle('sound'), true);
assert.equal(unavailable.warning, '');
assert.throws(() => state.toggle('unknown'));
console.log('通过：默认开关、独立切换、关闭状态持久化、存档隔离、快照保护、坏档和写入失败恢复。');
