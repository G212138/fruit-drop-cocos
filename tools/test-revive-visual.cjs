const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 可复制的引擎值类型替身，用于检查快照引用隔离。 */
class Value {
    /** 保存用于断言的数值。 */
    constructor(value) { this.value = value; }
    /** 返回独立副本。 */
    clone() { return new Value(this.value); }
}
class Sprite {}
class UIOpacity {}
const stopped = [];
const cc = { Sprite, UIOpacity, Tween: { stopAllByTarget(value) { stopped.push(value); } }, isValid: value => !value.destroyed };
const file = path.resolve('assets/app-bundle/app-view/page/game/native/expansion/revive/ReviveVisualState.ts');
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
new Function('require', 'module', 'exports', code)(name => { assert.equal(name, 'cc'); return cc; }, moduleUnderTest, moduleUnderTest.exports);
const { ReviveVisualState } = moduleUnderTest.exports;
/** 构造既有预制体节点的最小接口，不允许测试或生产快照创建节点。 */
function node() {
    return { active: true, scale: new Value(1), eulerAngles: new Value(0), position: { x: 42, y: -500 }, children: [],
        sprite: { color: new Value(255) }, opacity: { opacity: 180 },
        getComponent(type) { return type === Sprite ? this.sprite : this.opacity; },
        setScale(value) { this.scale = value.clone(); },
        setRotationFromEuler(value) { this.eulerAngles = value.clone(); },
    };
}
const state = new ReviveVisualState();
assert.equal(state.restore(), false);
const root = node(), flower = node(), inactive = node(), destroyed = node();
inactive.active = false;
root.children = [flower, inactive, destroyed];
state.capture(root);
root.scale.value = 2; root.eulerAngles.value = 135; root.sprite.color.value = 128; root.opacity.opacity = 20;
flower.active = false; inactive.active = true; destroyed.destroyed = true;
assert.equal(state.restore(), true);
assert.equal(root.scale.value, 1); assert.equal(root.eulerAngles.value, 0);
assert.equal(root.sprite.color.value, 255); assert.equal(root.opacity.opacity, 180);
assert.equal(flower.active, true); assert.equal(inactive.active, false);
assert.deepEqual(root.position, { x: 42, y: -500 }, '视觉恢复不能修改复活摆放坐标');
assert.equal(stopped.includes(destroyed), false, '不能访问已经销毁的子节点');
assert.equal(stopped.includes(root.sprite), true, '清理精灵闪色补间');
assert.equal(stopped.includes(root.opacity), true, '清理透明度补间');
root.sprite.color.value = 10; state.restore();
assert.equal(root.sprite.color.value, 255, '恢复时仍须复制颜色，不能污染存储快照');
flower.active = false; root.scale.value = 3; state.capture(root);
flower.active = true; root.scale.value = 4; state.restore();
assert.equal(flower.active, false); assert.equal(root.scale.value, 3, '每次下落覆盖快照');
state.clear(); assert.equal(state.restore(), false);
console.log('通过：子树显隐、缩放旋转、颜色透明度、快照隔离、失效节点、重复下落与清理。');
