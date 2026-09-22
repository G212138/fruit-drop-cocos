const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const session={trial:null};let scheduled=[],shown=[];
class Base {scheduleOnce(fn,time){scheduled.push({fn,time});}unscheduleAllCallbacks(){scheduled=[];}hide(){this.onHide();}}
const cc={_decorator:{ccclass:()=>x=>x,property:(...args)=>args.length>1?undefined:()=>{}},sp:{Skeleton:class{}},Tween:{stopAllByTarget(){}},tween:target=>({to(t,v){Object.assign(target,v);return this;},start(){}})};
const themeExports={};
new Function('require','exports',ts.transpileModule(fs.readFileSync('assets/app-builtin/app-model/expansion/ThemeProgress.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(()=>({}),themeExports);
const exportsView={};
const p='assets/app-bundle/app-view/pop/result/native/PopResult.ts';
const code=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
new Function('require','exports',code)(n=>n==='cc'?cc:n.includes('ThemeProgress')?themeExports:n.includes('UiClickSound')?{UiClickSound:{bind(){}}}:n.includes('ResultPresentation')?{ResultPresentation:class{}}:n.includes('BaseView')?{default:Base}:n.includes('GameSettings')?{GameSettings:{current:{snapshot:{sound:true}}}}:n.includes('EditorSession')?{EditorSession:session}:n.includes('ScreenLayout')?{ScreenLayout:class{apply(){}}}:{app:{manager:{ui:{show:x=>shown.push(x),showToast:x=>shown.push({toast:x})}}}},exportsView);
const v=new exportsView.PopResult();
for(const name of ['nextButton','reviveButton','trialButton','trialReturn','successRoot','failureRoot','unlockRoot','revivePrompt'])v[name]={active:false,getComponent:()=>({opacity:255})};
v.titleLabel={};v.unlockIcon={};v.unlockName={node:{active:true}};v.unlockIcons=[{}];v.unlockNames=[{}];
const animations=[];v.winAnimation={setCompleteListener(fn){this.listener=fn;},setAnimation(...args){animations.push(args);}};v.failAnimation={setAnimation(...args){animations.push(args);}};
v.onShow({won:true,level:1});assert.equal(v.successRoot.active,true);assert.equal(v.failureRoot.active,false);assert.equal(v.nextButton.active,false);assert.equal(scheduled[0].time,0.7);scheduled[0].fn();assert.equal(v.nextButton.active,true);v.winAnimation.listener();assert.deepEqual(animations.at(-1),[0,'1.2',true]);v.onHide();assert.equal(scheduled.length,0);
let revived=0;v.onShow({won:false,level:3,onRevive:()=>revived++});assert.equal(v.reviveButton.active,true);v.next();assert.equal(shown.length,0);v.revive();v.revive();assert.equal(revived,1);
session.trial={};v.onShow({won:true,level:1});scheduled[0].fn();assert.equal(v.nextButton.active,false);assert.equal(v.trialReturn.active,true);v.home();assert.equal(shown.at(-1).name,'PageEditor');
const prefab=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/pop/result/native/PopResult.prefab'));
const view=prefab.find(x=>x.successRoot&&x.failureRoot);
for(const name of ['successRoot','failureRoot','unlockIcon','unlockName','trialReturn'])assert.ok(prefab[view[name].__id__],name);
console.log('通过：胜负分支、延迟下一关、动画切换、复活去重、试玩返回及预制体绑定。');

session.trial=null;
let gateError;
v.beforeShow(error=>gateError=error,{isCurrent:()=>false});assert.equal(gateError,'Result owner expired');
v.beforeShow(error=>gateError=error,{isCurrent:()=>true});assert.equal(gateError,undefined);
v.onShow({won:true,level:1});assert.equal(v.hideEvent,2);v.closeResult();assert.equal(scheduled.length,0);assert.equal(v.onRevive,null);
const page=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/page/game/native/PageGame.prefab'));
assert(!page.some(x=>x._name==='GameResult'||x.resultRoot||x.overlay),'游戏页不能引用结算资源');
console.log('通过：独立结算缓存、失效请求拦截、关闭清理及移除游戏内结算树。');

v.unlockGlow={angle:0};v.showUnlock=true;session.trial=null;
v.onShow({won:true,level:1});assert.equal(v.unlockName.node.active,false);
v.lateUpdate(0.5);assert.equal(v.unlockGlow.angle,-45);
v.closeResult();v.onShow({won:false,level:2,onRevive:()=>{}});
assert.equal(v.revivePrompt.active,true);assert.equal(v.failureRoot.active,false);
v.lateUpdate(1);assert.equal(v.unlockGlow.angle,-45,'失败时不旋转解锁光圈');
v.onShow({won:false,level:2,onRevive:()=>{},notice:'已取消'});assert.equal(v.revivePrompt.active,true);
v.dismissRevivePrompt();assert.equal(v.revivePrompt.active,false);assert.equal(v.failureRoot.active,true);
v.onShow({won:false,level:2,onRevive:()=>{},notice:'已取消'});assert.equal(v.failureRoot.active,true);
v.onShow({won:false,level:2,onRevive:()=>{}});assert.equal(v.revivePrompt.active,true,'新失败恢复首层');
assert.equal(prefab[view.unlockName.__id__].__type__,'cc.Label');
const overlay=prefab[view.overlay.__id__];assert.equal(prefab[overlay.summary.__id__].__type__,'cc.Label');assert.equal(prefab[overlay.remaining.__id__].__type__,'cc.RichText');
assert.ok(prefab[view.revivePrompt.__id__]);assert.ok(prefab[view.unlockGlow.__id__]);
console.log('通过：解锁文字、光圈速度、失败先复活提示、关闭后二层及取消广告保留层级。');
const states=[];v.presentation={play(mode){states.push(mode);},stop(){states.push('stop');}};
v.showUnlock=false;v.onShow({won:true,level:1});assert.equal(v.unlockRoot.active,false);assert.equal(states.at(-1),0);
v.onShow({won:false,level:1,onRevive:()=>{}});assert.equal(states.at(-1),1);v.dismissRevivePrompt();assert.equal(states.at(-1),2);v.closeResult();assert.equal(states.at(-1),'stop');
for(const data of [prefab]){const result=data.find(x=>x.presentation&&x.successRoot);const fx=data[result.presentation.__id__];assert.equal(fx.cards.length,3);assert.equal(fx.illustrations.length,3);assert.equal(fx.particleRoots.length,3);assert.ok(data[fx.failureAudio.__id__]._clip);assert.ok(data[fx.reviveAudio.__id__]._clip);}
console.log('通过：三态表现切换、关闭清理、独立入口音效/粒子绑定及设计稿默认隐藏额外解锁行。');


v.showUnlock=true;session.trial=null;v.unlockIcons=Array.from({length:60},()=>({}));
for(const level of [1,30,31,60,61]) {
 v.onShow({won:true,level});
 assert.equal(v.unlockRoot.active,level<=30,'解锁上限不受多余图标影响：'+level);
 if(level<=30)assert.equal(v.unlockIcon.spriteFrame,v.unlockIcons[level-1]);
}
const progress=new themeExports.ThemeProgress({getItem:()=>null,setItem(){}});
assert.equal(progress.unlocked(2,29,30),false);
assert.equal(progress.unlocked(2,29,31),true);
assert.equal(progress.select(2,30),false);
assert.equal(progress.select(2,31),true);
console.log('通过：第30关最后一件解锁，第31关起隐藏提示，图鉴及甜品主题开放边界一致。');
