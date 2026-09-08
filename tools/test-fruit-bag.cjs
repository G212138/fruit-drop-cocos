const assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const tracks=[],settings={snapshot:{sound:true}};
class Vec3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new Vec3(this.x,this.y,this.z);}}
const cc={_decorator:{ccclass:()=>v=>v,property:()=>()=>{}},Component:class{},Vec3,
    isValid:v=>!!v&&!v.destroyed,Tween:{stopAllByTarget(node){tracks.filter(t=>t.node===node).forEach(t=>t.stopped=true);}},
    tween(node){const track={node,steps:[],to(time,properties,options){this.steps.push({time,properties,options});return this;},
        call(fn){this.steps.push({fn});return this;},start(){tracks.push(this);}};return track;}};
const exportsBag={};
const code=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/effects/FruitBagView.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
new Function('require','exports',code)(n=>n==='cc'?cc:{GameSettings:{current:settings}},exportsBag);
/** 创建引擎节点替身，保留真实袋子组件的状态与计时逻辑。 */
function node(){return {position:new Vec3(),scale:new Vec3(1,1,1),worldPosition:new Vec3(100,200),children:[],
    getComponent:()=>({height:182,anchorY:0.5,convertToNodeSpaceAR:p=>new Vec3(p.x-10,p.y-20)}),
    setParent(parent, keepWorld){this.parent=parent;this.keptWorld=keepWorld;},
    setPosition(p){this.position=p;},setScale(s){this.scale=s;},destroy(){this.destroyed=true;}};}
const bag=new exportsBag.FruitBagView();bag.body=node();bag.target=node();let plays=0,done=0;
bag.audio={play(){plays++;},stop(){}};
const fruits=[node(),node()];bag.collect(fruits,()=>done++);
assert.deepEqual(fruits[0].position,new Vec3(90,180));assert.equal(fruits[0].parent,bag.target);
assert.equal(fruits[0].keptWorld,true,"跨容器收集保留世界缩放");
const flights=tracks.slice();assert.deepEqual(flights[0].steps.filter(s=>s.time).map(s=>s.time),[0.25,0.1]);
flights[0].steps[1].fn();flights[1].steps[1].fn();assert.equal(plays,1,'同时抵达只触发一次袋身回弹');
assert.equal(tracks[2].steps[0].properties.scale.y,0.75);
assert.equal(tracks[2].steps[0].properties.position.y,-22.75,'按高度与锚点补偿压缩位移');
const fade=flights[0].steps[2].options.onUpdate;assert.equal(typeof fade,'function');fade(fruits[0],0.5);
flights[0].steps[3].fn();assert.equal(done,0);flights[1].steps[3].fn();assert.equal(done,1);
assert.equal(fruits.every(f=>f.destroyed),true);
const staleFruit=node();bag.target.children=[staleFruit];bag.collect([staleFruit],()=>assert.fail('清局不能提交旧配对'));
const stale=tracks.at(-1);bag.clear();assert.equal(stale.stopped,true);const oldPlays=plays;stale.steps[1].fn();assert.equal(plays,oldPlays,"清局后不得重新触发袋子反馈");stale.steps[3].fn();
assert.equal(staleFruit.destroyed,true);assert.equal(bag.bouncing,false);assert.deepEqual(bag.body.scale,new Vec3(1,1,1));
bag.target.destroyed=true;bag.target.children=undefined;bag.body.destroyed=true;
assert.doesNotThrow(()=>bag.onDestroy(),'引擎先销毁子节点时不再读取其 children');
console.log('通过：真实袋子收集坐标、两颗完成才通知、回弹防叠加、底边补偿、清局取消旧回调和子节点先销毁。');
