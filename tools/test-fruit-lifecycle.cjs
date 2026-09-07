const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');

/** 只替代引擎事件传输，不模拟碰撞或改写生产组件逻辑。 */
class Signal {
    /** 初始化最小节点状态。 */
    constructor() { this.listeners=[]; this.active=true; this.position={y:0}; }
    /** 注册带所属对象的事件。 */
    on(event, fn, target) { this.listeners.push({event,fn,target}); }
    /** 只解除指定函数及所属对象，用于捕获监听函数不一致。 */
    off(event, fn, target) { this.listeners=this.listeners.filter(x=>x.event!==event||x.fn!==fn||x.target!==target); }
    /** 解除某个组件的全部监听。 */
    targetOff(target) { this.listeners=this.listeners.filter(x=>x.target!==target); }
    /** 按引擎的所属对象语义同步发布事件。 */
    emit(event, ...args) { for(const x of [...this.listeners])if(x.event===event)x.fn.apply(x.target,args); }
}
/** 最小向量，仅支持被测组件实际读取的速度平方。 */
class Vec2 {
    /** 初始化向量分量。 */
    constructor(x=0,y=0){this.x=x;this.y=y;}
    /** 返回速度平方。 */
    lengthSqr(){return this.x*this.x+this.y*this.y;}
}
const cc = {sp:{Skeleton:class {}},
    _decorator: {ccclass:()=>value=>value,property:(...args)=>args.length>1?undefined:()=>{}},
    Tween: {stopAllByTarget(){}},
    Component: class {}, Node: {EventType:{TOUCH_END:'touch-end'}}, Vec2,
    ERigidBody2DType:{Static:0,Dynamic:2,Animated:3},
    Contact2DType:{BEGIN_CONTACT:'begin',PRE_SOLVE:'pre'},
};
const cache=new Map();
/** 装载真实 TypeScript 组件，仅替代引擎依赖。 */
function load(file){
    if(cache.has(file))return cache.get(file);
    const module={exports:{}};
    const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2018,experimentalDecorators:true}}).outputText;
    new Function('require','module','exports',out)(name=>name==='cc'?cc:load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);
    cache.set(file,module.exports);return module.exports;
}
const base=path.resolve(__dirname,'../assets/app-bundle/app-view/page/game/native/expansion');
const {FruitItem}=load(base+'/fruit/FruitItem.ts');
const {HiddenFruitView}=load(base+'/hidden/HiddenFruitView.ts');
const {BoardEvents}=load(base+'/board/BoardEvents.ts');

/** 构造真实组件和独立遮罩，保留生产事件绑定逻辑。 */
function fixture(dynamic){
    const fruit=new FruitItem();fruit.node=new Signal();fruit.collider=new Signal();
    fruit.body={type:dynamic?2:0};fruit.visual={playRemoval(){}};
    const cover=new HiddenFruitView();cover.node=new Signal();cover.node.parent=fruit.node;
    fruit.onLoad();cover.onLoad();cover.onEnable();
    return {fruit,cover};
}
const floor={node:{name:'Floor'},getComponent(){return null;}};
const otherFruit={node:{name:'AnotherFruit'},getComponent(){return null;}};
let {fruit,cover}=fixture(true);
fruit.collider.emit('begin',fruit.collider,otherFruit);
assert.equal(cover.node.active,true,'接触其他水果不能揭示');
fruit.collider.emit('begin',fruit.collider,floor);
assert.equal(cover.node.active,false,'首次动态接触地形揭示');
cover.onDisable();cover.node.active=true;cover.onEnable();cover.onEnable();
assert.equal(fruit.node.listeners.filter(item=>item.target===cover).length,2,'复活显示后重新监听且不重复绑定');
fruit.touchedFloor=false;
fruit.collider.emit('begin',fruit.collider,floor);
assert.equal(cover.node.active,false,'复活恢复花朵后再次下落仍能揭示');
fruit.onDestroy();cover.onDestroy();
assert.equal(fruit.collider.listeners.length,0,'首次和持续接触监听必须完整解除');
assert.equal(fruit.node.listeners.length,0);
({fruit,cover}=fixture(false));
fruit.collider.emit('begin',fruit.collider,floor);
assert.equal(cover.node.active,true,'静态触地不揭示');
fruit.body.type=2;
fruit.collider.emit('pre',fruit.collider,floor);
assert.equal(cover.node.active,true,'重复接触不能伪装成首次动态触地');
fruit.pop();
assert.equal(cover.node.active,false,'配对消除必须清除遮罩');
fruit.onDestroy();cover.onDestroy();
({fruit,cover}=fixture(true));
assert.equal(cover.node.active,true,'重开使用新实例恢复遮罩');
fruit.node.emit(BoardEvents.ReleaseRequested,fruit);
assert.equal(cover.node.active,true,'点击请求本身不揭示');
fruit.onDestroy();cover.onDestroy();
console.log('通过：真实组件事件绑定、首次触地边界、消除揭示、重开遮罩和监听完整清理。');
// 冰层独立状态：每次配对减一、清零不下溢、展示层只接收结果。
({fruit}=fixture(false));
const updates=[];
fruit.attachIce(2,{initialize(value){updates.push(value);},updateLayers(value){updates.push(value);}});
fruit.reduceIce();assert.equal(fruit.iceLayers,1);
fruit.reduceIce();assert.equal(fruit.iceLayers,0);
fruit.reduceIce();assert.deepEqual(updates,[2,1,0]);
console.log('通过：冰层状态减层、清零、不重复碎冰。');
