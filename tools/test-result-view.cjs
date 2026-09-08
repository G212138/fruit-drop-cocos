const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const session={trial:null};let scheduled=[],shown=[];
class Base {scheduleOnce(fn,time){scheduled.push({fn,time});}unscheduleAllCallbacks(){scheduled=[];}hide(){this.onHide();}}
const cc={_decorator:{ccclass:()=>x=>x,property:(...args)=>args.length>1?undefined:()=>{}},sp:{Skeleton:class{}},Tween:{stopAllByTarget(){}},tween:target=>({to(t,v){Object.assign(target,v);return this;},start(){}})};
const exportsView={};
const p='assets/app-bundle/app-view/pop/result/native/PopResult.ts';
const code=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
new Function('require','exports',code)(n=>n==='cc'?cc:n.includes('BaseView')?{default:Base}:n.includes('GameSettings')?{GameSettings:{current:{snapshot:{sound:true}}}}:n.includes('EditorSession')?{EditorSession:session}:n.includes('ScreenLayout')?{ScreenLayout:class{apply(){}}}:{app:{manager:{ui:{show:x=>shown.push(x)}}}},exportsView);
const v=new exportsView.PopResult();
for(const name of ['nextButton','reviveButton','trialButton','trialReturn','successRoot','failureRoot','unlockRoot','revivePrompt'])v[name]={active:false,getComponent:()=>({opacity:255})};
v.titleLabel={};v.unlockIcon={};v.unlockName={};v.unlockIcons=[{}];v.unlockNames=[{}];
const animations=[];v.winAnimation={setCompleteListener(fn){this.listener=fn;},setAnimation(...args){animations.push(args);}};v.failAnimation={setAnimation(...args){animations.push(args);}};
v.onShow({won:true,level:1});assert.equal(v.successRoot.active,true);assert.equal(v.failureRoot.active,false);assert.equal(v.nextButton.active,false);assert.equal(scheduled[0].time,0.7);scheduled[0].fn();assert.equal(v.nextButton.active,true);v.winAnimation.listener();assert.deepEqual(animations.at(-1),[0,'1.2',true]);v.onHide();assert.equal(scheduled.length,0);
let revived=0;v.onShow({won:false,level:3,onRevive:()=>revived++});assert.equal(v.reviveButton.active,true);v.next();assert.equal(shown.length,0);v.revive();v.revive();assert.equal(revived,1);
session.trial={};v.onShow({won:true,level:1});scheduled[0].fn();assert.equal(v.nextButton.active,false);assert.equal(v.trialReturn.active,true);v.home();assert.equal(shown.at(-1).name,'PageEditor');
const prefab=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/pop/result/native/PopResult.prefab'));
const view=prefab.find(x=>x.successRoot&&x.failureRoot);
for(const name of ['successRoot','failureRoot','winAnimation','failAnimation','unlockIcon','unlockName','trialReturn'])assert.ok(prefab[view[name].__id__],name);
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

v.unlockGlow={angle:0};session.trial=null;
v.showEmbedded({won:true,level:1});assert.equal(v.unlockName.string,'舒芙蕾');
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
