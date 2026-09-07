const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 最小节点接口仅用于验证真实协调器状态，不替代引擎物理试玩。 */
function node() {
    return {
        position:{x:0,y:0,z:0}, scale:{x:1,y:1,z:1}, children:[], destroyed:false,
        setPosition(p){this.position={...p};}, setScale(x,y,z){this.scale={x,y,z};},
        setSiblingIndex(){}, destroy(){this.destroyed=true;},
        getComponent(){return {contentSize:{width:80,height:80}};},
    };
}
/** 生成测试水果，保留协调器实际读取和修改的状态。 */
function fruit() {
    return {node:node(),spawning:false,removing:false,body:{enabled:true,type:0,linearVelocity:{lengthSqr:()=>0},angularVelocity:0}};
}
const views=[];
const cc={instantiate:()=>{
    const root=node();
    const view={node:root,count:0,arrangeLayers(){},setCount(count){this.count=count;},moveTo(position){root.setPosition(position);}};
    root.getComponent=()=>view;views.push(view);return root;
},isValid:value=>!!value&&!value.destroyed,UITransform:class{},ERigidBody2DType:{Dynamic:2}};
/** 装载实际协调器，只替换渲染引擎边界。 */
function load(file){
    const module={exports:{}};
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    new Function('require','module','exports',output)(name=>name==='cc'?cc:name.endsWith('BlackHoleView')?{BlackHoleView:class{}}:load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);
    return module.exports;
}
const {BlackHoleFlow}=load(path.resolve(__dirname,'../assets/app-bundle/app-view/page/game/native/expansion/black-hole/BlackHoleFlow.ts'));
const flow=new BlackHoleFlow(),host=fruit(),parent=node(),created=[];
host.node.position={x:100,y:200,z:0};
flow.attach(host,[{kind:3,sequence:2},{kind:2,sequence:1}],{},parent);
assert.equal(flow.pendingCount,2);assert.equal(views[0].count,3);
const spawn=definition=>{const next=fruit();next.definition=definition;created.push(next);return next;};
flow.advance(host,spawn);flow.advance(host,spawn);
assert.equal(created.length,1,'同一水果重复通知不能生成两次');
assert.equal(created[0].definition.kind,2,'成员按顺序生成');
assert.equal(created[0].definition.x,100);
assert.equal(created[0].body.enabled,false);
assert.equal(flow.isPendingAppearance(created[0]),true);
flow.tick(0.02,created);assert.equal(flow.isPendingAppearance(created[0]),false);
flow.tick(0.6,created);assert.equal(created[0].body.enabled,true);assert.equal(created[0].spawning,false);
assert.equal(flow.pendingCount,1);assert.equal(views[0].count,2);
flow.advance(created[0],spawn);assert.equal(created[1].definition.kind,3);assert.equal(views[0].count,1);
flow.stop();flow.tick(5,created);assert.equal(created[1].body.enabled,false,'停止后不能继续恢复碰撞');
flow.resume();flow.tick(0.01,created);
assert.equal(created[1].body.enabled,false,'暂停经过的时间不能计入恢复后的出现时长');
flow.tick(0.61,created);assert.equal(created[1].body.enabled,true,'原地恢复后完成原成员出现');
assert.equal(created.length,2,'恢复不能重复生成成员');
flow.clear();assert.equal(flow.pendingCount,0);assert.equal(views[0].node.destroyed,true);
flow.attach(host,[],{},parent);flow.advance(host,spawn);assert.equal(views[1].node.destroyed,true,'最后一个水果释放后回收黑洞');
console.log('通过：黑洞顺序、重复释放保护、延迟出现、碰撞恢复、暂停、清理与重新启用。');

const reviveFlow=new BlackHoleFlow(),reviveHost=fruit(),reviveCreated=[];
const reviveSpawn=definition=>{const next=fruit();next.definition=definition;reviveCreated.push(next);return next;};
reviveFlow.attach(reviveHost,[{kind:2,sequence:1},{kind:3,sequence:2}],{},parent);
reviveFlow.advance(reviveHost,reviveSpawn);
const appearing=reviveCreated[0];
assert.equal(appearing.body.enabled,false);
reviveFlow.advance(appearing,reviveSpawn);
appearing.removing=true;appearing.node.destroy();
reviveFlow.tick(1,reviveCreated);
assert.equal(appearing.body.enabled,false,'被复活消除的出现成员不能重新启用刚体');
assert.equal(reviveCreated[1].body.enabled,true,'下一成员仍正常出现');
assert.equal(reviveCreated.length,2);
reviveFlow.clear();
console.log('通过：复活原地恢复、暂停不吞计时、出现中消除不会恢复旧刚体或丢失后续成员。');
