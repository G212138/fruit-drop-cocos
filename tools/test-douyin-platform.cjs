const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const cache={};const storage=new Map();
const game={paused:false,isPaused(){return this.paused},pause(){this.paused=true},resume(){this.paused=false}};
function load(file){file=path.resolve(file);if(cache[file])return cache[file];const exports=cache[file]={};const src=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','exports',src)(n=>n==='cc'?{game,sys:{localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}}}:n==='cc/env'?{DEV:false}:load(path.resolve(path.dirname(file),n+'.ts')),exports);return exports;}
const root='assets/app-builtin/app-model/expansion/platform/';
async function main(){
 const runtime=load(root+'PlatformRuntime.ts');assert.equal(runtime.platformKind(),'browser');
 const {DouyinConfig}=load(root+'DouyinConfig.ts');assert.equal(DouyinConfig.appId,'');assert(Object.values(DouyinConfig.rewardedAds).every(v=>v===''));assert.equal(runtime.platformInterstitialId(),'');
 let calls=0,close,error,loaded=0,shown=0,offs=0,hide,show,loginOptions,share;
 const ad={load(){loaded++;return Promise.resolve()},show(){shown++;return Promise.resolve()},onClose(f){close=f},offClose(){offs++},onError(f){error=f},offError(){offs++}};
 global.tt={canIUse:()=>true,createRewardedVideoAd(o){assert.equal(o.adUnitId,'douyin-test');calls++;return ad},onHide(f){hide=f},onShow(f){show=f},vibrateLong(o){o.success()},login(o){loginOptions=o;o.success({anonymousCode:'anonymous-only'})},getStorageSync:k=>storage.get('dy:'+k),setStorageSync:(k,v)=>storage.set('dy:'+k,v),shareAppMessage(o){share=o}};
 assert.equal(runtime.platformKind(),'douyin');assert.equal(runtime.getPlatformGame(),global.tt);
 const {PlatformStorage}=load(root+'PlatformStorage.ts');PlatformStorage.setItem('level','3');assert.equal(PlatformStorage.getItem('level'),'3');assert.equal(storage.get('level'),undefined);
 const {FirstLaunch}=load('assets/app-appinit/view/FirstLaunch.ts');assert.equal(FirstLaunch.page,'PageGame');FirstLaunch.complete();assert.equal(storage.get('dy:fruit-drop.first-entry.v1'),'1');
 const {DouyinSilentLogin}=load(root+'DouyinSilentLogin.ts');assert.equal(await DouyinSilentLogin.shared.login(),true);assert.equal(loginOptions.force,false);assert.equal(storage.size,2,'登录临时凭证不得落盘');
 const {DouyinRewardProvider}=load(root+'DouyinRewardProvider.ts');const provider=DouyinRewardProvider.shared;
 const request={id:'dy-test',placement:'revive'};assert.equal((await provider.show(request)).status,'unavailable');assert.equal(calls,0);
 DouyinConfig.rewardedAds.revive='douyin-test';
 const {DouyinLifecycle}=load('assets/app-builtin/app-controller/expansion/DouyinLifecycle.ts');DouyinLifecycle.install();
 let pending=provider.show(request);assert(game.paused);assert.equal((await provider.show(request)).status,'unavailable');await Promise.resolve();await Promise.resolve();assert.equal(loaded,1);assert.equal(shown,1);close({isEnded:false});assert.equal((await pending).status,'cancelled');assert(!game.paused);
 pending=provider.show(request);await Promise.resolve();hide();close({isEnded:true});assert.equal((await pending).status,'completed');assert(game.paused,'后台不能被广告关闭恢复');show();assert(!game.paused);
 pending=provider.show(request);error();assert.equal((await pending).status,'failed');close({isEnded:true});assert(!game.paused);assert.equal(offs,6);
 DouyinLifecycle.setInterstitialVisible(true);assert.equal((await provider.show(request)).status,'unavailable');DouyinLifecycle.setInterstitialVisible(false);
 const {ResultShare}=load('assets/app-bundle/app-view/pop/result/native/expansion/ResultShare.ts');let result;ResultShare.open('test',2,true,v=>result=v);assert.equal(share.title,'test');share.success();assert.equal(result,'opened');
 const {PlatformRewards}=load(root+'PlatformRewards.ts');assert.equal(PlatformRewards.shared,provider);
 const tiktok={getStorageSync:()=> 'tiktok-save',setStorageSync(){}};global.TTMinis={game:tiktok};assert.equal(runtime.platformKind(),'tiktok');assert.equal(runtime.getPlatformGame(),tiktok);assert.equal(load(root+'DouyinRuntime.ts').getDouyinGame(),null);assert.equal(PlatformStorage.getItem('level'),'tiktok-save');assert.equal(PlatformRewards.shared,load(root+'TikTokRewardProvider.ts').TikTokRewardProvider.shared);assert.equal(runtime.platformInterstitialId(),'ad7687943681425901586');
 delete global.TTMinis;delete global.tt;global.wx={};assert.equal(runtime.platformKind(),'browser','未接入微信不能误识别为抖音');delete global.wx;
 console.log('通过：双平台识别与配置隔离、空广告位、抖音加载/展示/取消/完成/错误/互斥、后台恢复、静默匿名登录、存档与分享。');
}
main().catch(e=>{console.error(e);process.exitCode=1});
