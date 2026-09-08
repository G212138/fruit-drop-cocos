const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 装载真实复活规则，无引擎依赖，不在测试中重写选择或摆放算法。 */
function load(name) {
    const file = path.resolve('assets/app-bundle/app-view/page/game/native/expansion/revive', name + '.ts');
    const module = { exports: {} };
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText;
    new Function('module', 'exports', output)(module, module.exports);
    return module.exports;
}
const { selectVerticalRevive, selectHorizontalRevivePair } = load('ReviveSelection');
const { planRevivePlacement, REVIVE_PLACEMENT } = load('RevivePlacement');
/** 构造有效触底水果；各案例显式覆盖原版特殊标记。 */
function fruit(id, kind, y, changes = {}) {
    return { id, kind, y, available: true, touchedFloor: true, pendingRemoval: false,
        spawning: false, insideBlackHole: false, ...changes };
}
/** 构造待点击区域占位圆，默认普通水果半径为二十像素。 */
function circle(id, x, y, changes = {}) {
    return { id, x, y, radius: 20, insideBlackHole: false, ...changes };
}
const normal = [fruit('low', 1, -300), fruit('top', 2, 40), fruit('middle', 3, 0), fruit('fourth', 4, -100)];
const before = JSON.stringify(normal);
assert.deepEqual(selectVerticalRevive(normal), { restoreIds: ['top', 'middle', 'fourth'], pairs: [] });
assert.equal(JSON.stringify(normal), before, '选择不能排序或修改调用方数组');
assert.deepEqual(selectVerticalRevive(normal, 0), { restoreIds: [], pairs: [] });
assert.deepEqual(selectVerticalRevive(normal, 1.9).restoreIds, ['top']);
assert.deepEqual(selectVerticalRevive([fruit('host', 1, 20, { blackHoleId: 2 }),
    fruit('member', 1, 10, { parentBlackHoleId: 2 }), fruit('normal', 2, 0)]),
{ restoreIds: ['normal'], pairs: [] }, '不足三颗时不补做回退配对');
assert.deepEqual(selectVerticalRevive([fruit('zero-host', 1, 0, { blackHoleId: 0, parentBlackHoleId: 2 })]).restoreIds,
    ['zero-host'], '宿主零值仍优先于成员标记，与原脚本空值回退一致');

const seedA = fruit('a', 1, 40, { parentBlackHoleId: 1 });
const seedB = fruit('b', 1, 30, { parentBlackHoleId: 1 });
assert.deepEqual(selectVerticalRevive([seedA, seedB]).pairs, [], '回退的两个种子不能互相配对');
assert.deepEqual(selectVerticalRevive([seedA, seedB,
    fruit('host', 1, 20, { blackHoleId: 1 }),
    fruit('inside', 1, 10, { parentBlackHoleId: 1, insideBlackHole: true }),
    fruit('appearing', 1, 5, { parentBlackHoleId: 1, spawning: true }),
    fruit('waiting-high', 1, 200, { touchedFloor: false }),
    fruit('waiting-low', 1, 100, { touchedFloor: false }),
]).pairs, [['a', 'waiting-low'], ['b', 'waiting-high']], '排除宿主、容器成员和出现动画，优先最低等待水果且不能复用');
assert.deepEqual(selectHorizontalRevivePair([fruit('highest-unmatched', 9, 100),
    fruit('pair-a', 1, 0), fruit('pair-b', 1, -10)]), null, '最高无匹配时不能越过它');
assert.deepEqual(selectHorizontalRevivePair([seedA, fruit('floor-low', 1, 0), fruit('floor-high', 1, 10),
    fruit('waiting', 1, -200, { touchedFloor: false })]), ['a', 'floor-high']);
assert.deepEqual(selectHorizontalRevivePair([fruit('pending', 1, 999, { pendingRemoval: true }),
    seedA, fruit('waiting-high', 1, 20, { touchedFloor: false }),
    fruit('waiting-low', 1, -20, { touchedFloor: false })]), ['a', 'waiting-low']);
const live = [fruit('host', 1, 50, { blackHoleId: 1 }), fruit('mate', 1, 0), fruit('next', 2, 10)];
const first = selectHorizontalRevivePair(live);
const refreshed = live.filter(item => !first.includes(item.id));
refreshed.push(fruit('new-member', 2, 30, { parentBlackHoleId: 1, touchedFloor: false, spawning: true }));
assert.deepEqual(selectHorizontalRevivePair(refreshed), ['next', 'new-member'], '两次查找之间重新采样才能包含新成员，横向原版不排除出现标记');

assert.deepEqual(planRevivePlacement([], [circle('waiting', 0, -100)]), { targets: [], lift: 0 });
assert.deepEqual(planRevivePlacement([circle('a', 0, -500), circle('b', 0, -600), circle('c', 0, -700)], []),
    { targets: [{ id: 'a', x: 0, y: 230 }, { id: 'b', x: 0, y: 150 }, { id: 'c', x: 0, y: 70 }], lift: 380 });
const crowded = [circle('waiting', 0, 100, { radius: 60 })];
const crowdedBefore = JSON.stringify(crowded);
const spread = planRevivePlacement([circle('a', 0, -500, { radius: 60 })], crowded);
assert.deepEqual(spread.targets, [{ id: 'a', x: 160, y: 70 }], '同列和左右八十像素均重叠时，先尝试右侧一百六十像素');
assert.equal(JSON.stringify(crowded), crowdedBefore);
const fallback = planRevivePlacement([circle('a', 0, -500, { radius: 10000 })], [circle('obstacle', 0, 100)]);
assert.equal(fallback.lift, 3250, '首行二十像素减三千二百后为负三千一百八十，抬升三千二百五十到七十');
assert.deepEqual(fallback.targets, [{ id: 'a', x: 0, y: 70 }]);
const group = planRevivePlacement([circle('a', 0, -500)], [circle('member', 0, -300, { insideBlackHole: true })], [-400]);
assert.equal(group.lift, 940, '黑洞容器的半速抬升也必须达到七十像素');
assert.equal(group.targets[0].y, 560);
assert.equal(REVIVE_PLACEMENT.duration, 0.5);
console.log('通过：纵向回收、黑洞回退互斥、横向动态重采样、同类优先级、占位搜索、保底位置、黑洞抬升及输入不变性。');
