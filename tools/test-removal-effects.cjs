const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const settings={snapshot:{sound:true}},created=[];
const cc={_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},Component:class{scheduleOnce(fn,delay){this.scheduled={fn,delay};}unscheduleAllCallbacks(){this.scheduled=null;}},sp:{Skeleton:class{}},
    isValid:value=>!!value&&!value.destroyed,instantiate(){const effect={getComponent(){return {};},setPosition(position){this.position=position;},destroy(){this.destroyed=true;}};created.push(effect);return effect;}};
/** 装载真实表现组件，保留坐标换算、音效门禁和生命周期逻辑。 */
function load(name){const exports={};const source=fs.readFileSync(path.resolve('assets/app-bundle/app-view/page/game/native/expansion/effects',name+'.ts'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
new Function('require','exports',code)(name=>name==='cc'?cc:{GameSettings:{current:settings}},exports);return exports;}
const {RemovalEffects}=load('RemovalEffects'),{ExplosionView}=load('ExplosionView');
const effects=new RemovalEffects();let plays=0,stops=0;
effects.audio={play(){plays++;},stop(){stops++;}};
effects.node={children:[],getComponent:()=>({convertToNodeSpaceAR:p=>({x:p.x-10,y:p.y-20,z:p.z})})};
const first={worldPosition:{x:100,y:200,z:0}},second={worldPosition:{x:50,y:80,z:0}};
effects.beginRevive();effects.showRevivePair(first,second);effects.showRevivePair(first,second);
assert.equal(created.length,4);assert.equal(plays,1,'同次两对只播放一次爆炸音');
assert.deepEqual(created[0].position,{x:90,y:180,z:0});assert.equal(created[0].parent,effects.node);
effects.beginRevive();settings.snapshot.sound=false;effects.showRevivePair(first,second);
assert.equal(plays,1);settings.snapshot.sound=true;effects.showRevivePair(first,second);
assert.equal(plays,1,'本次已静音处理后不能由第二对补播');
effects.beginRevive();effects.showRevivePair(first,second);assert.equal(plays,2);
effects.node.children=created;effects.clear();assert.equal(stops,1);assert.equal(created.every(node=>node.destroyed),true);
const view=new ExplosionView();let listener,animation;
view.node={destroy(){this.destroyed=true;}};
view.skeleton={setCompleteListener(fn){listener=fn;},setAnimation(...args){animation=args;}};
view.onLoad();assert.deepEqual(animation,[0,'1',false]);
listener();assert.equal(view.node.destroyed,true);assert.equal(listener,null);
view.onDestroy();assert.equal(listener,null);
const timed=new ExplosionView();let notified=0;
timed.node={destroy(){this.destroyed=true;}};
timed.skeleton={setCompleteListener(){},setAnimation(){return {animationEnd:2};}};
timed.setMidpointCallback(()=>notified++);timed.onLoad();
assert.equal(timed.scheduled.delay,0.5);timed.scheduled.fn.call(timed);timed.scheduled.fn.call(timed);
assert.equal(notified,1,'中段回调只执行一次');
const cancelled=new ExplosionView();cancelled.node={};cancelled.skeleton=timed.skeleton;
cancelled.setMidpointCallback(()=>assert.fail('清局后不能继续入袋'));cancelled.onLoad();
const stale=cancelled.scheduled.fn;cancelled.onDestroy();stale.call(cancelled);
console.log('通过：世界坐标换算、每颗一次爆炸、每次复活一次音效、静音、清局与骨骼完成清理。');

const early=new ExplosionView();let earlyComplete,earlyCount=0;
early.node={destroy(){this.destroyed=true;}};
early.skeleton={setCompleteListener(fn){earlyComplete=fn;},setAnimation(){return {animationEnd:0.1};}};
early.setMidpointCallback(()=>earlyCount++);early.onLoad();
const pendingMidpoint=early.scheduled.fn;
earlyComplete();pendingMidpoint.call(early);
assert.equal(earlyCount,1,'动画提前结束也必须启动入袋且只通知一次');
