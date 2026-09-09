const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 复现已检查的小游戏产物转换：单项数组展开变成 [].concat，不能假设输入是数组。 */
function looseSpread(context) {
    function visit(node) {
        if (ts.isArrayLiteralExpression(node) && node.elements.length === 1 && ts.isSpreadElement(node.elements[0])) {
            return ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createArrayLiteralExpression(), 'concat'),
                undefined, [ts.visitNode(node.elements[0].expression, visit)]);
        }
        return ts.visitEachChild(node, visit, context);
    }
    return source => ts.visitNode(source, visit);
}
const cc = { Component: class {}, _decorator: { ccclass: () => value => value, property: () => () => {} } };
/** 装载真实业务源码，只对渲染边界提供替身，并施加已确认有问题的数组展开转换。 */
function load(relative, mocks = {}) {
    const file = path.resolve(relative);
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
        transformers: { before: [looseSpread] },
    }).outputText;
    const exports = {};
    new Function('require', 'exports', output)(name => {
        if (name === 'cc') return cc;
        if (Object.hasOwn(mocks, name)) return mocks[name];
        return load(path.resolve(path.dirname(file), name + '.ts'), mocks);
    }, exports);
    return exports;
}
const base = 'assets/app-bundle/app-view/page/game/native/expansion/';
const { FruitSpawner } = load(base + 'board/FruitSpawner.ts', {
    '../../../../../../../app-builtin/app-model/expansion/GameTheme': {},
    '../ice/IceFruitView': {}, '../fruit/FruitItem': {},
    '../black-hole/BlackHoleFlow': { BlackHoleFlow: class {} },
});
const spawner = new FruitSpawner();
assert.deepEqual(spawner.getLive(), [], '空集合必须返回空数组，不能返回包含 Set 的数组');
const first = { waiting: true }, second = { waiting: false };
spawner.live.add(first); spawner.live.add(second);
assert.deepEqual(spawner.getLive(), [first, second]);
assert.deepEqual(spawner.getWaiting(), [first]);
const snapshot = spawner.getLive(); snapshot.pop();
assert.equal(spawner.getLive().length, 2);
const { BlackHoleFlow } = load(base + 'black-hole/BlackHoleFlow.ts', { '../fruit/FruitItem': {}, './BlackHoleView': {} });
const flow = new BlackHoleFlow();
assert.equal(flow.pendingCount, 0);
flow.groups.set(first, { pending: [{}, {}], view: { node: { position: { y: 120 } } } });
assert.equal(flow.pendingCount, 2);
assert.deepEqual(flow.getCenterYs(), [120]);
const { GameLanguage } = load('assets/app-builtin/app-model/expansion/GameLanguage.ts', {
    './platform/PlatformStorage': { PlatformStorage: { setItem() {} } },
});
let refreshed = 0;
GameLanguage.subscribe(() => refreshed++);
assert.equal(GameLanguage.select('en'), true);
assert.equal(refreshed, 1);
const { parseLevel } = load(base + 'level/LevelDefinition.ts');
assert.throws(() => parseLevel({ level: 1, m: 1, d: [{ n: 1, p: [0, 0] }] }), /成对/);
console.log('通过：模拟小游戏数组展开转换后，空棋盘、存活水果、待下落水果和黑洞集合读取正确。');
