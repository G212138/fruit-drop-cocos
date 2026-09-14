const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 只替换二维向量和刚体枚举，保留真实解卡决策。 */
const cc = { ERigidBody2DType: { Static: 0, Kinematic: 1, Dynamic: 2 }, Vec2: class { constructor(x = 0, y = 0) { this.x = x; this.y = y; } } };
cc.isValid = node => !!node && !node.destroyed;
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
        if (name === './PhysicsRules') return load('PhysicsRules');
        assert.equal(name, 'cc'); return cc;
    }, exports);
    return exports;
}
const { FruitShake } = load('FruitShake');
const { ShakeGesture } = load('ShakeGesture');
/** 构造带冲量记录的已释放、停滞水果，不模拟物理引擎结果。 */
function fruit(mass = 1, speed = 0) {
    const impulses = [];
    const position = { x: 5, y: 9, z: 0, clone() { return { x: this.x, y: this.y, z: this.z }; } };
    const node = { position, worldPosition: position, activeInHierarchy: true,
        setWorldPosition(v) { Object.assign(position, v); } };
    return { node, visual: { node }, waiting: false, removing: false, spawning: false, iceLayers: 0, impulses,
        body: { node, enabled: true, type: 2, gravityScale: 1, angularDamping: 0.3, wakeUp() {}, linearVelocity: { x: speed, y: 0, lengthSqr: () => speed ** 2 }, getMass: () => mass,
            applyLinearImpulseToCenter(vector, wake) { impulses.push(vector); assert.equal(wake, true); } } };
}
const shake = new FruitShake();
const a = fruit(1), b = fruit(2), waiting = fruit(), fast = fruit(1, 3), ice = fruit(), removing = fruit(), spawning = fruit();
waiting.waiting = true; waiting.body.type = 0; ice.iceLayers = 1; ice.waiting = true; ice.body.type = 0;
removing.removing = true; spawning.spawning = true;
const fruits = [a, b, waiting, fast, ice, removing, spawning];
const floor = fruit(); floor.body.type = 0;
const background = { name: 'Background', worldPosition: { x: 0, y: 0, z: 0, clone() { return {...this}; } },
    scale: { x: 1, y: 1, z: 1, clone() { return {...this}; } },
    setWorldPosition(x, y, z) { Object.assign(this.worldPosition, typeof x === 'object' ? x : {x,y,z}); },
    setScale(x, y, z) { Object.assign(this.scale, typeof x === 'object' ? x : {x,y,z}); } };
const board = { getComponentsInChildren: () => [floor.body, ...fruits.map(f => f.body)], getChildByName: name => name === 'Background' ? background : null };
assert.equal(shake.apply([], 0, board), 0);
assert.equal(shake.apply(fruits, 0, board), 5);
assert.equal(waiting.body.type, 1);
assert.equal(floor.body.type, 1);
assert.equal(waiting.body.gravityScale, 1);
assert.equal(waiting.shakingSuspended, true);
shake.tick(fruits, 0.06);
assert.equal(waiting.impulses.length, 0, '固定水果不施加弹簧力');
assert.equal(ice.impulses.length, 0);
assert.equal(fast.impulses.length, 0, '自由水果仅通过真实碰撞受容器影响');
assert.ok(floor.body.linearVelocity.x > 0);
assert.equal(waiting.body.linearVelocity.x, floor.body.linearVelocity.x, '地形与固定水果速度一致');
assert.equal(ice.body.linearVelocity.x, floor.body.linearVelocity.x, '冰冻水果也固定在容器上');
assert.equal(fast.body.linearVelocity.x, 3, '保留自由水果原速度');
// 模拟刚体积分，仅检查控制器契约，不冒充真实碰撞求解。
for (let i = 0; i < 100; i++) {
    for (const body of board.getComponentsInChildren()) {
        if (body.type === 1) body.node.worldPosition.x += body.linearVelocity.x * 32 / 60;
    }
    shake.tick(fruits, 1 / 60);
    if (shake.busy) assert.ok(Math.abs(background.worldPosition.x - (floor.node.worldPosition.x - 5)) < 1e-6, '背景跟随实际容器位移');
}
assert.equal(waiting.body.type, 0);
assert.equal(floor.body.type, 0);
assert.equal(waiting.body.gravityScale, 1);
assert.equal(waiting.body.angularDamping, 0.3);
assert.equal(waiting.shakingSuspended, false);
assert.equal(waiting.node.position.x, 5, '固定水果随容器归位');
assert.equal(shake.busy, false);
assert.equal(background.worldPosition.x, 0);
assert.equal(background.scale.x, 1);
assert.equal(shake.apply(fruits, 1.59, board), 0);
assert.equal(shake.apply(fruits, 1.6, board), 5);
waiting.node.worldPosition.x = 15;
shake.release(waiting);
waiting.waiting = false; waiting.body.type = 2;
shake.stop();
assert.equal(waiting.node.position.x, 15, '中途点击后不被拉回容器原点');
assert.equal(waiting.body.type, 2);
assert.equal(a.visual.node.position.x, 5, '中断不残留偏移');
assert.equal(shake.apply([a], NaN, board), 0);
shake.reset(); assert.equal(shake.apply(fruits, 0, board), 5);
shake.stop();
assert.equal(waiting.body.gravityScale, 1, '摇晃不改重力');
assert.equal(waiting.shakingSuspended, false);
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
console.log('通过：运动学容器同步、动态水果速度保留、固定部分归位、中途点击释放、冷却及手机监听生命周期。');
shake.reset();
assert.ok(shake.apply(fruits, 100, board)>0);
let feedback=1;
for(let i=0;i<100;i++) shake.tick(fruits,1/60,()=>feedback++);
assert.equal(feedback,4,'四次往返各一次反馈，含启动时第一次');
shake.reset();shake.apply(fruits,200,board);shake.stop();
shake.tick(fruits,1,()=>feedback++);
assert.equal(feedback,4,'中断后不能继续播反馈');
console.log('通过：四次摇晃反馈与停止后的回调取消。');
