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
