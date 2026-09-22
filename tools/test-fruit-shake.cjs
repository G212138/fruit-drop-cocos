const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 只替换二维向量和刚体枚举，保留真实解卡决策。 */
const cc = { ERigidBody2DType: { Static: 0, Kinematic: 1, Dynamic: 2 }, Vec2: class { constructor(x = 0, y = 0) { this.x = x; this.y = y; } } };
cc.isValid = node => !!node && !node.destroyed;
/** @param name 物理目录下真实 TypeScript 模块名。 */
function load(name) {
    const exports = {};
    const source = fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/physics/' + name + '.ts', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
    new Function('require', 'exports', code)(name => {
        if (name === './PhysicsRules') return load('PhysicsRules');
        assert.equal(name, 'cc'); return cc;
    }, exports);
    return exports;
}
const { FruitShake } = load('FruitShake');
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
shake.reset();
assert.ok(shake.apply(fruits, 100, board)>0);
let feedback=1;
for(let i=0;i<100;i++) shake.tick(fruits,1/60,()=>feedback++);
assert.equal(feedback,3,'三次往返各一次反馈，含启动时第一次');
shake.reset();shake.apply(fruits,200,board);shake.stop();
shake.tick(fruits,1,()=>feedback++);
assert.equal(feedback,3,'中断后不能继续播反馈');
console.log('通过：三次摇晃反馈与停止后的回调取消。');

