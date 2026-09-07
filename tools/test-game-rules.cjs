const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const root = path.resolve(__dirname, '../assets');
const expansion = root + '/app-bundle/app-view/page/game/native/expansion';
const cache = new Map();
/** 将纯业务 TypeScript 装入测试环境，不模拟引擎物理。 */
function load(file) {
    if (cache.has(file)) return cache.get(file);
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 },
    });
    const module = { exports: {} };
    new Function('require', 'module', 'exports', result.outputText)(
        relative => load(path.resolve(path.dirname(file), relative + '.ts')), module, module.exports,
    );
    cache.set(file, module.exports);
    return module.exports;
}
const { canMatch } = load(expansion + '/matching/MatchRules.ts');
const { MatchQueue } = load(expansion + '/matching/MatchQueue.ts');
const { parseLevel, countFruits } = load(expansion + '/level/LevelDefinition.ts');
const Game = load(root + '/app-builtin/app-model/store.game.ts').default;
const candidate = { kind: 21, y: -100, touchedFloor: true, removing: false };
assert.equal(canMatch(candidate, { ...candidate }), true);
assert.equal(canMatch(candidate, candidate), false);
assert.equal(canMatch(candidate, { ...candidate, kind: 22 }), false);
assert.equal(canMatch(candidate, { ...candidate, y: -80 }), false);
assert.equal(canMatch(candidate, { ...candidate, removing: true }), false);
assert.equal(canMatch({ ...candidate, touchedFloor: false }, { ...candidate, touchedFloor: false }), false);
/** 构造能观察锁定状态的水果句柄。 */
function fruit() {
    return { removing: false, getMatchCandidate() { return { ...candidate, removing: this.removing }; } };
}
const queue = new MatchQueue();
const first = fruit();
const second = fruit();
assert.equal(queue.enqueue(first, second), true);
assert.equal(queue.enqueue(second, first), false);
assert.equal(queue.enqueue(first, fruit()), false);
assert.equal(queue.drain().length, 1);
assert.equal(queue.drain().length, 0);
const level = parseLevel(JSON.parse(fs.readFileSync(root + '/app-bundle/app-view/page/game/resources/levels/level-001.json')));
assert.equal(countFruits(level), 12);
assert.throws(() => parseLevel({ waves: [] }));
assert.throws(() => parseLevel({ waves: [[{ kind: 21, x: 0, y: 0 }]] }));
assert.throws(() => parseLevel({ waves: [[{ kind: 999, x: 0, y: 0 }]] }));
const game = new Game();
assert.throws(() => game.begin(0));
game.begin(12);
for (let i = 0; i < 6; i++) game.removePair();
assert.equal(game.phase, 'won');
assert.equal(game.remaining, 0);
game.lose();
game.removePair();
assert.equal(game.phase, 'won');
game.begin(4);
game.lose();
game.removePair();
assert.equal(game.phase, 'lost');
assert.equal(game.remaining, 4);
console.log('通过：配对边界、重复接触锁定、队列清空、关卡校验、胜负终态与重开。');

const { FloorFailureRules, canEliminateAtFloor } = load(expansion + '/failure/FloorFailureRules.ts');
/** 构造互不相同且已经触底静止的水果，隔离计时和接触边界。 */
function pile(count) {
    return Array.from({ length: count }, (_, index) => ({
        id: String(index), kind: index + 1, y: -300 - index * 70,
        touchedFloor: true, removing: false, settled: true,
    }));
}
const failure = new FloorFailureRules();
assert.equal(failure.tick(pile(3), 10), false);
assert.equal(failure.tick(pile(4), 0.49), false);
assert.equal(failure.tick(pile(4), 0.011), true);
assert.equal(failure.tick(pile(5), 0.14), false);
assert.equal(failure.tick(pile(5), 0.011), true);
failure.reset();
assert.equal(failure.tick(pile(4), 0.4), false);
const moving = pile(4);
moving[0].settled = false;
assert.equal(failure.tick(moving, 1), false);
assert.equal(failure.tick(pile(4), 0.2), false);
assert.equal(failure.tick(pile(3), 1), false);
assert.equal(failure.tick(pile(4), 0.3), false);
const merging = pile(4);
merging[0].removing = true;
assert.equal(failure.tick(merging, 1), false);
assert.equal(failure.tick(pile(4), 0.3), false);
const pair = pile(4);
pair[1].kind = pair[0].kind;
assert.equal(canEliminateAtFloor(pair), true);
assert.equal(failure.tick(pair, 1), false);
assert.equal(failure.losesOnContact(pair, '0', '1'), false);
assert.equal(failure.losesOnContact(pile(4), '0', '1'), true);
assert.equal(failure.losesOnContact(pile(4), '1', '0'), true);
assert.equal(failure.losesOnContact(pile(4), '1', '2'), false);
assert.equal(failure.losesOnContact(pile(3), '0', '1'), false);
const boundary = pile(4);
boundary[0].y = -250;
assert.equal(failure.losesOnContact(boundary, '1', '2'), false);
const airborne = pile(4).map(fruit => ({ ...fruit, touchedFloor: false }));
assert.equal(failure.tick(airborne, 10), false);
assert.equal(failure.losesOnContact(airborne, '0', '1'), true);
assert.equal(failure.losesOnContact(pile(4), '0', '1', 5), false);
failure.reset();
assert.equal(failure.tick(pile(4), 10, 5), false);
assert.equal(failure.tick(pile(5), 0.49, 5), false);
assert.equal(failure.tick(pile(5), 0.011, 5), true);
failure.reset();
assert.equal(failure.tick(pile(4), 0.3), false);
failure.reset();
assert.equal(failure.tick(pile(4), 0.3), false);
console.log('通过：原版接触判负、触底与高度区别、静止计时、移动/数量/消除重置、扩槽阈值和重开。');
