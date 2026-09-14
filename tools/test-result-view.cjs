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
new Function('require','exports',code)(n=>n==='cc'?cc:n.includes('ThemeProgress')?themeExports:n.includes('UiClickSound')?{UiClickSound:{bind(){}}}:n.includes('ResultPresentation')?{ResultPresentation:class{}}:n.includes('BaseView')?{default:Base}:n.includes('GameSettings')?{GameSettings:{current:{snapshot:{sound:true}}}}:n.includes('EditorSession')?{EditorSession:session}:n.includes('ScreenLayout')?{ScreenLayout:class{apply(){}}}:{app:{manager:{ui:{show:x=>shown.push(x)}}}},exportsView);
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

v.embedded=true;v.node={active:false,parent:{children:[{}]},setSiblingIndex(i){this.order=i;}};
v.hide=()=>assert.fail('内嵌模式不得请求弹窗管理器关闭');
session.trial=null;
v.showEmbedded({won:false,level:1,onRevive:()=>revived++});
assert.equal(v.node.active,true);v.closeResult();assert.equal(v.node.active,false);assert.equal(v.onRevive,null);
v.showEmbedded({won:true,level:1});assert.equal(scheduled.length,1);v.closeResult();assert.equal(scheduled.length,0);
const page=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/page/game/native/PageGame.prefab'));
const owner=page.find(x=>x.resultRoot);const resultNode=page[owner.resultRoot.__id__];
assert.equal(resultNode._name,'GameResult');assert.equal(typeof resultNode._active,'boolean');
const info=page[resultNode._prefab.__id__];assert.equal(info.asset.__id__,0);assert.equal(info.root.__id__,1);assert.equal(info.instance,null,'结算节点属于PageGame而非嵌套实例');
const embedded=page.find(x=>x.embedded===true);assert.ok(embedded);
assert.ok(page.some(x=>x.__type__==='cc.BlockInputEvents'));
console.log('通过：固定结算节点直接显示、关闭清理、重开取消定时与普通节点序列化。');

v.unlockGlow={angle:0};v.showUnlock=true;session.trial=null;
v.showEmbedded({won:true,level:1});assert.equal(v.unlockName.node.active,false);
v.lateUpdate(0.5);assert.equal(v.unlockGlow.angle,-45);
v.closeResult();v.showEmbedded({won:false,level:2,onRevive:()=>{}});
assert.equal(v.revivePrompt.active,true);assert.equal(v.failureRoot.active,false);
v.lateUpdate(1);assert.equal(v.unlockGlow.angle,-45,'失败时不旋转解锁光圈');
v.showEmbedded({won:false,level:2,onRevive:()=>{},notice:'已取消'});assert.equal(v.revivePrompt.active,true);
v.dismissRevivePrompt();assert.equal(v.revivePrompt.active,false);assert.equal(v.failureRoot.active,true);
v.showEmbedded({won:false,level:2,onRevive:()=>{},notice:'已取消'});assert.equal(v.failureRoot.active,true);
v.showEmbedded({won:false,level:2,onRevive:()=>{}});assert.equal(v.revivePrompt.active,true,'新失败恢复首层');
assert.equal(page[embedded.unlockName.__id__].__type__,'cc.Label');
for(const name of ['UnlockText','UnlockName']){const n=page.find(x=>x._name===name);assert.ok(n._components.some(r=>page[r.__id__].__type__==='cc.Label'));assert.ok(!n._components.some(r=>page[r.__id__].__type__==='cc.Sprite'));}
assert.ok(page[embedded.revivePrompt.__id__]);assert.ok(page[embedded.unlockGlow.__id__]);
console.log('通过：解锁文字、光圈速度、失败先复活提示、关闭后二层及取消广告保留层级。');
const states=[];v.presentation={play(mode){states.push(mode);},stop(){states.push('stop');}};
v.showUnlock=false;v.showEmbedded({won:true,level:1});assert.equal(v.unlockRoot.active,false);assert.equal(states.at(-1),0);
v.showEmbedded({won:false,level:1,onRevive:()=>{}});assert.equal(states.at(-1),1);v.dismissRevivePrompt();assert.equal(states.at(-1),2);v.closeResult();assert.equal(states.at(-1),'stop');
for(const data of [prefab,page]){const result=data.find(x=>x.presentation&&x.successRoot);const fx=data[result.presentation.__id__];assert.equal(fx.cards.length,3);assert.equal(fx.illustrations.length,3);assert.equal(fx.particleRoots.length,3);assert.ok(data[fx.failureAudio.__id__]._clip);assert.ok(data[fx.reviveAudio.__id__]._clip);}
console.log('通过：三态表现切换、关闭清理、两套入口音效/粒子绑定及设计稿默认隐藏额外解锁行。');


v.showUnlock=true;session.trial=null;v.unlockIcons=Array.from({length:60},()=>({}));
for(const level of [1,30,31,60,61]) {
 v.showEmbedded({won:true,level});
 assert.equal(v.unlockRoot.active,level<=30,'解锁上限不受多余图标影响：'+level);
 if(level<=30)assert.equal(v.unlockIcon.spriteFrame,v.unlockIcons[level-1]);
}
const progress=new themeExports.ThemeProgress({getItem:()=>null,setItem(){}});
assert.equal(progress.unlocked(2,29,30),false);
assert.equal(progress.unlocked(2,29,31),true);
assert.equal(progress.select(2,30),false);
assert.equal(progress.select(2,31),true);
console.log('通过：第30关最后一件解锁，第31关起隐藏提示，图鉴及甜品主题开放边界一致。');
