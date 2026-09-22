const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let now=0,paused=false,blocked=false,shows=0,close,error,fail=false,intervals=0;
const events={},ui={},host={};
const api={onShow:f=>host.show=f,onHide:f=>host.hide=f,createInterstitialAd:opts=>{
 assert.equal(opts.adUnitId,'ad7687943681425901586');return {onClose:f=>close=f,onError:f=>error=f,offClose(){},offError(){},show(){shows++;if(fail)throw Error('no inventory');return Promise.resolve();}};
}};
const lifecycle={get blocked(){return blocked;},setInterstitialVisible(v){blocked=v;paused=v;}};
const cc={game:{isPaused:()=>paused},input:{on:(e,f)=>events[e]=f},Input:{EventType:Object.fromEntries(['TOUCH_START','TOUCH_MOVE','TOUCH_END','MOUSE_DOWN','MOUSE_MOVE','MOUSE_WHEEL','KEY_DOWN'].map(v=>[v,v]))}};
const out={};
const code=ts.transpileModule(fs.readFileSync('assets/app-builtin/app-controller/expansion/IdleInterstitial.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
new Function('require','exports','Date','setInterval','setTimeout','clearTimeout',code)(n=>n==='cc'?cc:n.endsWith('/app')?{app:{manager:{ui:{on:(e,f)=>ui[e]=f}}}}:n.includes('TikTokLifecycle')?{TikTokLifecycle:lifecycle}:n.includes('TikTokConfig')?{TikTokConfig:{idleInterstitialAd:'ad7687943681425901586'}}:{getTikTokGame:()=>api,supportsTikTok:()=>true},out,{now:()=>now},()=>intervals++,()=>1,()=>{});
const C=out.IdleInterstitial;C.install();C.install();assert.equal(intervals,1);
now=29999;C.tick();assert.equal(shows,0);events.TOUCH_MOVE();now+=29999;C.tick();assert.equal(shows,0);
now++;C.tick();assert.equal(shows,1);assert(paused);now+=60000;C.tick();assert.equal(shows,1);close();assert(!paused);
now+=29999;C.tick();assert.equal(shows,1);ui.onShow();now+=29999;C.tick();assert.equal(shows,1);
blocked=true;now+=60000;C.tick();blocked=false;host.show();now+=29999;C.tick();assert.equal(shows,1);
fail=true;now++;C.tick();assert.equal(shows,2);assert(!paused);assert(!C.busy);error();assert(!paused);
console.log('通过：30秒阈值、操作切页重计时、后台及广告互斥、关闭失败恢复、单次注册。');
