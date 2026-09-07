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
const level = parseLevel(JSON.parse(fs.readFileSync(root + '/app-bundle/app-view/page/game/resources/levels/original-levels.json')).levels[0]);
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

const originalLevels = JSON.parse(fs.readFileSync(root + '/app-bundle/app-view/page/game/resources/levels/original-levels.json')).levels;
assert.deepEqual(originalLevels.slice(0,4).map((source, index) => countFruits(parseLevel(source,index+1))), [12,40,72,126]);
assert.deepEqual(level.fruits[0], {kind:22,iceLayers:0,hidden:false,x:-189,y:1192});
assert.deepEqual(level.fruits[6], {kind:21,iceLayers:0,hidden:false,x:-18,y:-122});
assert.equal(countFruits(parseLevel(originalLevels[4], 5)), 92);
assert.throws(() => parseLevel(originalLevels[11], 12), /尚未开放/);
assert.throws(() => parseLevel({...originalLevels[0],m:2}), /模式/);
assert.throws(() => parseLevel({...originalLevels[0],d:[{n:'21',h:'invalid',p:[0,0]}]}), /隐藏/);
assert.throws(() => parseLevel({...originalLevels[0],d:[{n:'21',ice:-1,p:[0,0]}]}), /冰层/);
assert.throws(() => parseLevel({...originalLevels[0],d:[{n:'21',p:[NaN,0]}]}), /坐标/);
const { planVerticalShift } = load(expansion + '/movement/VerticalShiftRules.ts');
assert.equal(planVerticalShift([]), null);
assert.equal(planVerticalShift([101,599]), null);
assert.equal(planVerticalShift([100,600]), null);
assert.deepEqual(planVerticalShift([101,600]),{delta:-171,duration:0.57});
assert.deepEqual(planVerticalShift([963,1204]),{delta:-1033,duration:1.2});
const shift = planVerticalShift([963,1204]);
assert.equal(Math.min(963,1204)+shift.delta,-70);
const { LevelProgress } = load(root + '/app-builtin/app-model/expansion/LevelProgress.ts');
const memory = new Map();
const storage = {getItem(key){ return memory.get(key) ?? null; },setItem(key,value){memory.set(key,value);}};
const progress = new LevelProgress(storage);
assert.equal(progress.level,1);
progress.complete(1);
assert.equal(progress.level,2);
assert.equal(new LevelProgress(storage).level,2);
progress.complete(1);
assert.equal(progress.level,2);
progress.complete(4);
assert.equal(new LevelProgress(storage).level,5);
progress.complete(1);
assert.equal(progress.level,5);
memory.set('fruit-drop.progress.v1','bad json');
assert.equal(new LevelProgress(storage).level,1);
assert.ok(new LevelProgress(storage).warning);
const unavailable = new LevelProgress({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
unavailable.complete(1);
assert.equal(unavailable.level,2);
assert.ok(unavailable.warning);
assert.throws(() => unavailable.complete(0));
console.log('通过：原版前四关配置、坐标偏移、未支持机制拒绝、整体补位边界、进度持久化/坏档/存储失败。');

const { shouldRevealHiddenFruit } = load(expansion + '/hidden/HiddenFruitRules.ts');
assert.equal(shouldRevealHiddenFruit(false,true,false),false);
assert.equal(shouldRevealHiddenFruit(true,false,false),false);
assert.equal(shouldRevealHiddenFruit(true,true,false),true);
assert.equal(shouldRevealHiddenFruit(false,false,true),true);
const hiddenLevel = parseLevel(originalLevels[4],5);
assert.equal(hiddenLevel.fruits.filter(fruit => fruit.hidden).length,3);
assert.deepEqual(hiddenLevel.fruits.filter(fruit => fruit.hidden).map(fruit=>fruit.kind),[21,24,4]);
assert.equal(canMatch({...candidate,hidden:true},{...candidate,hidden:false}),true);
console.log('通过：隐藏水果首次动态触地揭示、悬停/补位不揭示、消除揭示、第五关三处原始隐藏配置。');
assert.deepEqual(originalLevels.slice(5,11).map((source,index)=>countFruits(parseLevel(source,index+6))),[106,112,106,106,104,102]);
assert.deepEqual(parseLevel(originalLevels[9],10).fruits.filter(f=>f.iceLayers>0).map(f=>f.iceLayers),[30,20,25,40]);
console.log('通过：第六至十一关原配置与第十关四处冰层数。');
const { blocksBlackHoleCollision, blackHoleAppearanceScale } = load(expansion + '/black-hole/BlackHoleRules.ts');
assert.equal(blackHoleAppearanceScale(0.01),0);
assert.ok(Math.abs(blackHoleAppearanceScale(0.52)-1.2)<1e-9);
assert.ok(Math.abs(blackHoleAppearanceScale(0.62)-1)<1e-9);
const falling = {x:60,y:0,radius:50,speedSquared:0,angularSpeed:0};
assert.equal(blocksBlackHoleCollision(0,0,50,[falling]),true);
assert.equal(blocksBlackHoleCollision(0,0,50,[{...falling,x:80}]),false);
assert.equal(blocksBlackHoleCollision(0,0,50,[{...falling,x:80,speedSquared:401}]),true);
assert.equal(blocksBlackHoleCollision(0,0,50,[{...falling,x:91,speedSquared:1000}]),false);
const blackLevel = parseLevel({...originalLevels[14],level:1},1);
assert.equal(blackLevel.fruits.length,originalLevels[14].d.length);
assert.ok(blackLevel.fruits.some(fruit=>fruit.fatherBlackHoleId));
assert.throws(()=>parseLevel({level:1,m:1,d:[{n:'1',p:[0,0],FatherBlackHoleID:3,SequenceID:1},{n:'1',p:[0,0]}]}),/宿主/);
console.log('通过：黑洞原第十五关完整计数、成员引用、出现曲线与碰撞保护距离速度边界。');