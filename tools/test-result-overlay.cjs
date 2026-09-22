const fs=require('fs'),assert=require('assert/strict'),ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const base='assets/app-bundle/app-view/pop/result/native/expansion/';
function load(file,req){const e={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText)(req,e);return e;}
const {resultText}=load(base+'ResultStrings.ts',()=>({}));const keys=['success','ended','revive','level','unlock','complete','retryHint','remaining','continue','next','restart','home','shareWin','shareLose','watch','editor','shareUnavailable','shareFailed','shareWinTitle','shareLoseTitle','adCancelled','adUnavailable','cancel'];
for(const lang of ['zh','en','ja','id','th','vi','ms','fil'])for(const key of keys){const s=resultText(lang,key,{level:12,count:98});assert(s);assert(!s.includes('{'));}
const runtime={getTikTokGame:()=>null,supportsTikTok:(api,name)=>!!api&&typeof api[name]==='function'&&(!api.canIUse||api.canIUse(name))};const {ResultShare}=load(base+'ResultShare.ts',()=>runtime);const results=[];const done=r=>results.push(r);
ResultShare.open('test',12,true,done);assert.equal(results.pop(),'unavailable');let request;const api={shareAppMessage(o){request=o;}};ResultShare.open('win',12,true,done,api);assert.equal(request.title,'win');assert.equal(request.query,'source=result&level=12&result=won');request.success();request.fail();assert.deepEqual(results,['opened']);results.length=0;
ResultShare.open('help',9,false,done,{shareAppMessage(){throw Error('sdk');}});assert.deepEqual(results,['failed']);results.length=0;ResultShare.open('test',1,false,done,{canIUse:()=>false,shareAppMessage(){assert.fail();}});assert.equal(results[0],'unavailable');
for(const file of ['assets/app-bundle/app-view/pop/result/native/PopResult.prefab']){
 const a=JSON.parse(fs.readFileSync(file)),p=a.find(x=>x.overlay&&x.successRoot);assert(p);const overlay=a[p.overlay.__id__];assert.equal(overlay.labels.length,overlay.keys.length);assert.equal(overlay.levels.length,2);assert(overlay.keys.includes('shareWin')&&overlay.keys.includes('shareLose'));
 const visit=id=>{const n=a[id];assert.notEqual(n._name,'Panel');for(const c of n._children||[])visit(c.__id__);};for(const field of ['successRoot','failureRoot','revivePrompt'])visit(p[field].__id__);
 const handlers=a.filter(x=>x.__type__==='cc.ClickEvent').map(x=>x.handler);assert(handlers.includes('share'));
 const info=a[p.presentation.__id__];assert.equal(info.cards.length,3);assert.equal(info.illustrations.length,3);
}
console.log('通过：八语种结算文案、分享能力门禁/失败/重复回调、无底框三态及分享按钮绑定。');

