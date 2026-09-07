const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 装载实际纯规则模块，不替换关卡解析或提示选择逻辑。 */
function load(file) {
    const module = {exports: {}};
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
    new Function('require', 'module', 'exports', output)(name => load(path.resolve(path.dirname(file), name + '.ts')), module, module.exports);
    return module.exports;
}
const base = path.resolve(__dirname, '../assets/app-bundle/app-view/page/game');
const {chooseHint} = load(base + '/native/expansion/hint/HintRules.ts');
const {parseLevel} = load(base + '/native/expansion/level/LevelDefinition.ts');
const levels = JSON.parse(fs.readFileSync(base + '/resources/levels/original-levels.json', 'utf8')).levels;
for (let index = 0; index < levels.length; index++) {
    const raw = levels[index];
    const expected = raw.d.some(f => Number(f.BlackHoleID) > 0 || Number(f.FatherBlackHoleID) > 0) ? 4
        : raw.d.some(f => Number(f.ice) > 0) ? 3 : raw.d.some(f => f.h === 't') ? 2 : Number(raw.m) === 2 ? 1 : 0;
    assert.equal(chooseHint(parseLevel(raw, index + 1)), expected, '原关卡 ' + (index + 1));
}
const fruit = {kind: 1, x: 0, y: 0, iceLayers: 2, hidden: true, blackHoleId: 1};
const mixed = {number: 1, mode: 2, fruits: [fruit]};
assert.equal(chooseHint(mixed), 4);
delete fruit.blackHoleId;
assert.equal(chooseHint(mixed), 3);
fruit.iceLayers = 0;
assert.equal(chooseHint(mixed), 2);
fruit.hidden = false;
assert.equal(chooseHint(mixed), 1);
mixed.mode = 1;
assert.equal(chooseHint(mixed), 0);
console.log('通过：45关原始配置提示选择与五种混合机制优先级。');
