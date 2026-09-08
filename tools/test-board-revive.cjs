const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const animations=[];
const cc={isValid:node=>!node.destroyed,UITransform:class{},Vec3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},
    Tween:{stopAllByTarget(){}},tween(node){return {to(duration,props){this.props=props;return this;},call(fn){this.fn=fn;return this;},start(){animations.push(()=>{node.position=this.props.position;this.fn();});}};}};
/** 装载真实协调器、选择、摆放和动画实现，只有引擎边界使用替身。 */
function load(file){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
new Function('require','module','exports',code)(name=>name==='cc'?cc:load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);return module.exports;}
const {BoardReviveFlow}=load(path.resolve('assets/app-bundle/app-view/page/game/native/expansion/revive/BoardReviveFlow.ts'));
/** 模拟已有水果的节点与单体恢复接口；规则和动画使用生产实现。 */
function fruit(id,kind,y,touchedFloor=true,definition={}){return {kind,touchedFloor,removing:false,spawning:false,definition,waiting:!touchedFloor,
    node:{uuid:id,parent:{},position:{x:0,y,z:0},scale:{x:1,y:1},getComponent:()=>({contentSize:{width:40,height:40}}),setPosition(x,y,z){this.position={x,y,z};}},
    prepareRevive(){this.prepared=true;this.touchedFloor=false;this.waiting=true;},finishRevive(){this.finished=true;},resumeAfterRevive(){this.resumed=true;}};}
/** 可观察剩余实例的工厂边界，配对回调可以同步补出黑洞成员。 */
function spawner(live){return {live,resumed:false,getLive(){return this.live;},getWaiting(){return this.live.filter(f=>f.waiting);},
    getDefinition(f){return f.definition;},isBlackHoleResident:f=>!!f.resident,getBlackHoleCenterYs:()=>[],
    resumeBlackHoles(){this.resumed=true;},updateBlackHoles(){}};}
const ordinary=spawner([fruit('a',1,40),fruit('b',2,30),fruit('c',3,20),fruit('d',4,10)]);
const flow=new BoardReviveFlow();let done=0;
assert.equal(flow.begin(1,ordinary,()=>assert.fail('普通回收不减少水果'),()=>done++),true);
assert.equal(flow.busy,true);assert.equal(flow.begin(1,ordinary,()=>{},()=>{}),false);
assert.equal(ordinary.live.filter(f=>f.prepared).length,3);assert.equal(ordinary.live[3].resumed,true);
assert.equal(done,0);animations.splice(0).forEach(fn=>fn());
assert.equal(done,1);assert.equal(flow.busy,false);assert.equal(ordinary.live.length,4);
assert.deepEqual(ordinary.live.slice(0,3).map(f=>f.node.position.y),[230,150,70]);
// 原版宿主和补出成员都在容器内：容器半量加子水果半量，世界坐标获得全量。
for(const definition of [{blackHoleId:1},{fatherBlackHoleId:1}]) {
    const resident=fruit('resident',5,-200,false,definition);resident.resident=true;
    const recovered=fruit('recovered',1,30),untouched=fruit('floor-black',2,10,true,{fatherBlackHoleId:2});
    const mixed=spawner([resident,recovered,untouched]);
    mixed.getBlackHoleCenterYs=()=>[-200];
    mixed.updateBlackHoles=()=>{mixed.centerY=resident.node.position.y;};
    assert.equal(flow.circle(resident,mixed).insideBlackHole,true);
    flow.begin(1,mixed,()=>assert.fail('普通水果优先回收，不触发黑洞强制配对'),()=>{});
    assert.equal(resident.node.position.y,340,'黑洞最低点 -200 要求基准抬升540，扁平宿主和成员均获得全量');
    assert.equal(mixed.centerY,340,'表现容器同步到水果的新位置');
    assert.equal(untouched.node.position.y,10,'未选中的已落地黑洞水果不抬升');
    animations.splice(0).forEach(fn=>fn());
    assert.equal(recovered.node.position.y,260,'回收目标 -280 加基准抬升540');
    assert.equal(flow.busy,false);
}
console.log('通过：黑洞宿主与成员的双层抬升等效坐标、容器同步及未回收水果位置。');
const horizontal=spawner([fruit('host',1,40,true,{blackHoleId:1}),fruit('mate',1,30),fruit('next',2,20)]);
const removed=[];
flow.begin(2,horizontal,(a,b)=>{removed.push([a.node.uuid,b.node.uuid]);horizontal.live=horizontal.live.filter(f=>f!==a&&f!==b);
    if(a.node.uuid==='host')horizontal.live.push(fruit('new',2,50,false,{fatherBlackHoleId:1}));},()=>done++);
assert.deepEqual(removed,[['host','mate'],['next','new']]);assert.equal(done,2);
const cancelled=spawner([fruit('a',1,40),fruit('b',1,30),fruit('c',2,20),fruit('d',2,10)]);
flow.begin(2,cancelled,()=>flow.cancel(),()=>assert.fail('胜利取消不能继续恢复棋盘'));
assert.equal(flow.busy,false);
const later=spawner([fruit('a',1,0)]);
flow.begin(1,later,()=>{},()=>assert.fail('清局不能调用正常完成'));
flow.cancel();animations.splice(0).forEach(fn=>fn());assert.equal(later.live[0].finished,undefined);
console.log('通过：真实纵向选择与动画贯通、数量保留、横向黑洞重新采样、重复请求及取消隔离。');

// 真实棋盘强制配对的副作用：仍减冰，但失败复活期间不追加横向补位。
const boardFile=path.resolve('assets/app-bundle/app-view/page/game/native/expansion/board/GameBoard.ts');
const boardExports={};
const boardCode=ts.transpileModule(fs.readFileSync(boardFile,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
new Function('require','exports',boardCode)(name=>name==='cc'?{_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},Component:class{}}:new Proxy({},{get:()=>class{}}),boardExports);
const board=new boardExports.GameBoard(),effects=[];
board.mode=2;board.spawner={remove(){effects.push('remove');},reduceIce(){effects.push('ice');}};
board.shift={remove(){}};board.horizontal={matched(){effects.push('shift');}};board.node={emit(){effects.push('event');}};
const pairFruit=()=>({removing:false,node:{targetOff(){}},pop(forced){effects.push(forced?'revive-pop':'pop');}});
board.removePair(pairFruit(),pairFruit(),true);
assert.deepEqual(effects,['remove','remove','revive-pop','revive-pop','ice','event']);
effects.length=0;board.removePair(pairFruit(),pairFruit(),false);
assert.deepEqual(effects,['remove','remove','pop','pop','ice','shift','event']);
console.log('通过：真实棋盘强制配对减冰，正常配对才追加横向补位。');
// 普通消除等待真实入袋回调才发布配对，避免最后一对提前结算。
let collected;
board.removalEffectsRoot={getComponent:()=>({showNormalPair(a,b,done){collected=done;effects.push('collect');}})};
const flyingFruit=()=>({...pairFruit(),prepareRemoval(){effects.push('prepare');}});
effects.length=0;board.removePair(flyingFruit(),flyingFruit(),false);
assert.equal(board.collectingPairs,1);assert.equal(effects.includes('event'),false);
collected();assert.equal(board.collectingPairs,0);assert.equal(effects.at(-1),'event');
console.log('通过：普通配对等待入袋完成再发布计数通知。');
