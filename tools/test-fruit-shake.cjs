const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 只替换二维向量和刚体枚举，保留真实解卡决策。 */
const cc = { ERigidBody2DType: { Dynamic: 2 }, Vec2: class { constructor(x, y) { this.x = x; this.y = y; } } };
/** 测试中的宿主能力表，不向真实设备请求权限。 */
let host = null;
/** @param name 物理目录下真实 TypeScript 模块名。 */
function load(name) {
    const exports = {};
    const source = fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/physics/' + name + '.ts', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
    new Function('require', 'exports', code)(name => {
        if (name.endsWith('/TikTokRuntime')) return { getTikTokGame: () => host };
        if (name === './ShakeGesture') return load('ShakeGesture');
        assert.equal(name, 'cc'); return cc;
    }, exports);
    return exports;
}
const { FruitShake } = load('FruitShake');
const { ShakeGesture } = load('ShakeGesture');
/** 构造带冲量记录的已释放、停滞水果，不模拟物理引擎结果。 */
function fruit(mass = 1, speed = 0) {
    const impulses = [];
    return { waiting: false, removing: false, spawning: false, iceLayers: 0, impulses,
        body: { enabled: true, type: 2, linearVelocity: { lengthSqr: () => speed ** 2 }, getMass: () => mass,
            applyLinearImpulseToCenter(vector, wake) { impulses.push(vector); assert.equal(wake, true); } } };
}
const shake = new FruitShake();
assert.equal(shake.apply([], 0), 0);
const a = fruit(1), b = fruit(2), waiting = fruit(), fast = fruit(1, 3), ice = fruit(), removing = fruit(), spawning = fruit();
waiting.waiting = true; ice.iceLayers = 1; removing.removing = true; spawning.spawning = true;
assert.equal(shake.apply([a, b, waiting, fast, ice, removing, spawning], 0), 2);
assert.equal(a.impulses[0].x, 1); assert.equal(b.impulses[0].x, -2);
assert.equal(a.impulses[0].y, 1.2); assert.equal(b.impulses[0].y, 2.4);
assert.equal(shake.apply([a], 2.99), 0);
assert.equal(shake.apply([a], 3), 1);
assert.equal(a.impulses[1].x, -1);
assert.equal(shake.apply([a], NaN), 0);
shake.reset(); assert.equal(shake.apply([a], 0), 1);
const gesture = new ShakeGesture();
assert.equal(gesture.accept({ x: 0, y: 0, z: 1 }, 0), false);
assert.equal(gesture.accept({ x: 0.1, y: 0, z: 1 }, 100), false);
assert.equal(gesture.accept({ x: 2, y: 0, z: 1 }, 200), false);
assert.equal(gesture.accept({ x: -2, y: 0, z: 1 }, 300), true);
gesture.reset();
assert.equal(gesture.accept({ x: 2, y: 0, z: 1 }, 400), false);
assert.equal(gesture.accept({ x: -2, y: 0, z: 1 }, 2000), false);
assert.equal(gesture.accept({ x: NaN, y: 0, z: 1 }, 2100), false);
const lifecycle = new Map(), sensor = new Set(), switches = [];
cc.sys = { isMobile: true };
cc.Game = { EVENT_HIDE: 'hide', EVENT_SHOW: 'show' };
cc.game = { on(name, callback, target) { lifecycle.set(name, () => callback.call(target)); }, off(name) { lifecycle.delete(name); }, isPaused: () => false };
cc.Input = { EventType: { DEVICEMOTION: 'motion' } };
cc.input = { on(name, callback) { sensor.add(callback); }, off(name, callback) { sensor.delete(callback); }, setAccelerometerEnabled(enabled) { switches.push(enabled); } };
const { PhoneShakeInput } = load('PhoneShakeInput');
const phone = new PhoneShakeInput();
host = {};
phone.start(() => true, () => {});
assert.equal(sensor.size, 0, 'TikTok 未暴露接口时保留按钮，不调用加速度功能');
phone.stop();
host = null;
phone.start(() => true, () => {});
assert.equal(sensor.size, 1);
lifecycle.get('hide')(); assert.equal(sensor.size, 0);
lifecycle.get('show')(); assert.equal(sensor.size, 1);
phone.start(() => true, () => {}); assert.equal(sensor.size, 1);
phone.stop(); assert.equal(sensor.size, 0); assert.equal(lifecycle.size, 0);
assert.equal(switches.at(-1), false);
console.log('通过：解卡目标过滤、按质量冲量、方向交替、冷却、重开及摇晃噪声/间断过滤。');
