const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let now = 0;
const tasks = [];
/** 以可控时钟执行真实表现类，验证通知顺序与取消行为。 */
function advance(seconds) {
    const end = now + seconds;
    while (true) {
        tasks.sort((a, b) => a.at - b.at);
        if (!tasks.length || tasks[0].at > end + 1e-8) break;
        const task = tasks.shift();
        now = task.at;
        if (!task.cancelled) task.run();
    }
    now = end;
}
class Vec3 {
    /** 构造模拟的设计坐标。 */
    constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
    /** 返回独立坐标。 */
    clone() { return new Vec3(this.x, this.y, this.z); }
}
class Color {
    /** 保存用于高亮与恢复的颜色。 */
    constructor(r, g, b, a) { Object.assign(this, { r, g, b, a }); }
    /** 返回独立颜色。 */
    clone() { return new Color(this.r, this.g, this.b, this.a); }
}
class Component {
    /** 将组件回调加入引擎时钟替身。 */
    scheduleOnce(run, delay) { tasks.push({ at: now + delay, run, target: this }); }
    /** 取消该组件的所有待执行回调。 */
    unscheduleAllCallbacks() { tasks.filter(t => t.target === this).forEach(t => t.cancelled = true); }
}
const cc = {
    _decorator: { ccclass: () => type => type, property: () => () => {} },
    Component, Vec3, Color, Node: class {}, Prefab: class {}, UITransform: class {}, Label: class {},
    isValid: value => !!value && !value.destroyed,
    Tween: { stopAllByTarget(target) { tasks.filter(t => t.target === target).forEach(t => t.cancelled = true); } },
    tween(target) {
        const steps = [];
        return {
            to(delay, properties) { steps.push({ delay, run: () => Object.assign(target, properties) }); return this; },
            call(run) { steps.push({ delay: 0, run }); return this; },
            start() { let at = now; for (const step of steps) tasks.push({ at: at += step.delay, run: step.run, target }); },
        };
    },
    instantiate() { const node = makeNode(); node.flight = new StarFlightView(); node.flight.node = node; return node; },
};
const cache = new Map();
/** 只替换引擎边界，运行项目真实脚本。 */
function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
        target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
    } }).outputText;
    new Function('require', 'module', 'exports', code)(name => name === 'cc' ? cc : load(path.resolve(path.dirname(file), name + '.ts')), module, module.exports);
    cache.set(file, module.exports);
    return module.exports;
}
const root = path.resolve('assets/app-bundle/app-view/page/game/native/expansion');
const { StarFlightView } = load(root + '/effects/StarFlightView.ts');
const { CollectionFeedback } = load(root + '/effects/CollectionFeedback.ts');
const { GameHud } = load(root + '/hud/GameHud.ts');
/** 创建带坐标换算与可观察销毁的引擎节点替身。 */
function makeNode() {
    return {
        worldPosition: new Vec3(100, 200), position: new Vec3(),
        getComponent(type) { return type === StarFlightView ? this.flight : { convertToNodeSpaceAR: value => value.clone() }; },
        setPosition(value) { this.position = value; },
        setScale(x, y, z) { this.scale = new Vec3(x, y, z); },
        destroy() { this.destroyed = true; this.flight?.onDestroy(); },
    };
}
const feedback = new CollectionFeedback();
const hud = new GameHud();
hud.status = { node: makeNode(), color: new Color(37, 61, 85, 255) };
const original = hud.status.color.clone();
let completed = 0;
/** 启动真实飞行与HUD高亮，最终通知模拟权威计数。 */
function play(level = 2) { feedback.play({}, makeNode(), makeNode(), hud.status.node, level, () => hud.flashProgress(() => completed++)); }
play();
advance(0.63);
assert.equal(completed, 0, '星星飞行中不能提前结算');
advance(0.02);
assert.equal(completed, 0, '抵达后等待进度反馈');
assert.equal(hud.status.color.r, 255);
advance(0.15);
assert.equal(completed, 1);
assert.deepEqual(hud.status.color, original);
play(); advance(0.1); play(); advance(0.65);
assert.equal(completed, 1, '连续消除分别等待完成');
advance(0.04); assert.equal(completed, 2);
assert.equal(hud.status.color.r, 255, '另一次高亮尚未完成');
advance(0.11); assert.equal(completed, 3);
assert.deepEqual(hud.status.color, original);
play(); advance(0.2); feedback.clear(); hud.clearFeedback(); advance(1);
assert.equal(completed, 3, '清局取消尚在飞行的旧通知');
play(); advance(0.65); feedback.clear(); hud.clearFeedback(); advance(1);
assert.equal(completed, 3, '清局取消已抵达但仍在高亮的旧通知');
play(); advance(1); assert.equal(completed, 4, '取消后新局仍可正常完成');
let skipped = 0;
feedback.play({}, makeNode(), makeNode(), hud.status.node, 31, () => skipped++);
assert.equal(skipped, 1, '原版第31关起跳过双星');
console.log('通过：飞行和进度高亮后计数、连续消除颜色恢复、飞行中及抵达后清局、新局隔离、第31关跳过。');
