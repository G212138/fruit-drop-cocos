const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const animations = [], stopped = [];
const cc = {
    isValid: value => !value.destroyed,
    Vec3: class { constructor(x,y,z) { Object.assign(this,{x,y,z}); } },
    Tween: { stopAllByTarget(node) { stopped.push(node); } },
    tween(node) {
        const animation = {node,to(duration,props,options){Object.assign(this,{duration,props,options});return this;},
            call(callback){this.callback=callback;return this;},start(){animations.push(this);}};
        return animation;
    },
};
/** 装载真实动画协调器，只替换可手动结束的引擎补间边界。 */
function load(file) {
    const module = {exports:{}};
    const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {
        compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS},
    }).outputText;
    new Function('require','module','exports',code)(name=>name==='cc'?cc:load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);
    return module.exports;
}
const {ReviveMotion} = load(path.resolve('assets/app-bundle/app-view/page/game/native/expansion/revive/ReviveMotion.ts'));
/** 创建能观察刚体恢复次数的实例替身，不实现生产动画逻辑。 */
function fruit() { return {node:{position:{z:3}},finishes:0,finishRevive(){this.finishes++;}}; }
const motion = new ReviveMotion(), a=fruit(), b=fruit();
let completed=0;
motion.begin([{fruit:a,x:20,y:30},{fruit:b,x:40,y:50}],()=>completed++);
assert.equal(motion.busy,true);
assert.equal(animations[0].duration,0.5);assert.equal(animations[0].options.easing,'sineOut');
assert.deepEqual({...animations[0].props.position},{x:20,y:30,z:3});
animations[1].callback();assert.equal(b.finishes,1);assert.equal(completed,0);
animations[0].callback();animations[0].callback();
assert.equal(a.finishes,1);assert.equal(completed,1);assert.equal(motion.busy,false);
motion.begin([{fruit:a,x:0,y:0}],()=>completed++);
const old = animations[2];
motion.cancel();old.callback();
assert.equal(a.finishes,1);assert.equal(completed,1);assert.equal(stopped.includes(a.node),true);
motion.begin([{fruit:b,x:0,y:0}],()=>completed++);
old.callback();assert.equal(motion.busy,true,'旧动画不能解锁新批次');
b.node.destroyed=true;animations[3].callback();
assert.equal(b.finishes,1,'失效实例不能恢复刚体');assert.equal(completed,2);
motion.begin([],()=>completed++);assert.equal(completed,3);
assert.throws(()=>motion.begin([{fruit:a,x:0,y:0},{fruit:a,x:1,y:1}],()=>{}),/不能重复/);
console.log('通过：原版动画时长与缓动、完成顺序、一次回调、取消、旧代次、失效实例及空目标。');
