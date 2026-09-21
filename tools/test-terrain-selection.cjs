const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
function compile(file,req=()=>({})){const out={};const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true},reportDiagnostics:true});assert.equal(result.diagnostics.length,0);new Function('require','exports',result.outputText)(req,out);return out;}
const dir='assets/app-builtin/app-model/expansion/';
const {TerrainProgress,terrainCatalog}=compile(dir+'TerrainProgress.ts');
const data=new Map();let fail=false;
const storage={getItem:k=>data.get(k)||null,setItem(k,v){if(fail)throw Error('disk');data.set(k,v);}};
let model=new TerrainProgress(storage);
assert.deepEqual(terrainCatalog.filter(x=>model.isUnlocked(x.id)).map(x=>x.id),['grass']);
assert.equal(model.select('cake'),false);assert.equal(model.recordReward('cake'),true);assert.equal(model.watched('cake'),1);assert.equal(model.select('cake'),false);
model=new TerrainProgress(storage);assert.equal(model.watched('cake'),1);assert.equal(model.recordReward('cake'),true);assert.equal(model.isUnlocked('cake'),true);assert.equal(model.select('cake'),true);assert.equal(model.recordReward('cake'),false);
model=new TerrainProgress(storage);assert.equal(model.selected,'cake');assert.equal(model.watched('ice'),0);
fail=true;assert.equal(model.recordReward('ice'),false);assert.equal(model.watched('ice'),0);assert.equal(model.select('grass'),false);assert.equal(model.selected,'cake');fail=false;
assert.equal(model.recordReward('invalid'),false);
data.set('fruit-drop.terrain.v1',JSON.stringify({version:1,selected:'cake'}));model=new TerrainProgress(storage);assert.equal(model.selected,'grass');assert.equal(model.isUnlocked('cake'),false);
data.set('fruit-drop.terrain.v1',JSON.stringify({version:2,selected:'ice',views:{ice:99,cake:-1,wood:1.5}}));model=new TerrainProgress(storage);assert.equal(model.selected,'grass');assert.equal(model.watched('ice'),0);
data.set('fruit-drop.terrain.v1','broken');assert.equal(new TerrainProgress(storage).selected,'grass');data.clear();model=new TerrainProgress(storage);
for(const entry of terrainCatalog)assert(fs.existsSync('assets/res-bundle/shared-terrains/terrains/'+entry.file+'.png'));
const reward=compile(dir+'RewardGate.ts');const pending=[];let ads=0;
const provider={show(req){ads++;return new Promise(resolve=>pending.push(status=>resolve({...req,status,source:'platform'})))}};
const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},Component:class{},Color:class{constructor(...v){this.values=v}},Sprite:class{},Label:class{},Button:class{}};
const language={current:'en',text:k=>k,subscribe(){},unsubscribe(){}};
const ui='assets/app-bundle/app-view/pop/theme/native/expansion/';
const words=compile(ui+'TerrainText.ts',p=>p.endsWith('GameLanguage')?{GameLanguage:language}:{terrainCatalog});
for(const code of ['en','zh','ja','id','th','vi','ms','fil']){language.current=code;assert(words.terrainText('unlock',1).includes('1/2'));assert(words.terrainName(10));}
const {TerrainPanel}=compile(ui+'TerrainPanel.ts',p=>p==='cc'?cc:p.endsWith('GameTerrain')?{GameTerrain:{current:model}}:p.endsWith('TerrainProgress')?{terrainCatalog}:p.endsWith('GameLanguage')?{GameLanguage:language}:p.endsWith('RewardGate')?reward:p.endsWith('TikTokRewardProvider')?{TikTokRewardProvider:{shared:provider}}:words);
function node(){const parts={};return {active:true,getComponent(){return this},getChildByName(k){return parts[k]||(parts[k]=node())}};}
const p=new TerrainPanel();p.node={active:true,activeInHierarchy:true};p.heading={};p.status={};p.scroll={stopAutoScroll(){},scrollToTop(){}};p.cards=terrainCatalog.map(()=>node());
(async()=>{
 p.open();let request=p.choose(null,'cream');await p.choose(null,'ice');assert.equal(ads,1);pending.shift()('cancelled');await request;assert.equal(model.watched('cream'),0);
 request=p.choose(null,'cream');pending.shift()('failed');await request;assert.equal(model.watched('cream'),0);
 request=p.choose(null,'cream');pending.shift()('completed');await request;assert.equal(model.watched('cream'),1);assert.equal(model.selected,'grass');
 request=p.choose(null,'cream');pending.shift()('completed');await request;assert.equal(model.watched('cream'),2);assert.equal(model.selected,'grass');await p.choose(null,'cream');assert.equal(model.selected,'cream');
 request=p.choose(null,'ice');p.onDisable();pending.shift()('completed');await request;assert.equal(model.watched('ice'),0);
 p.open();fail=true;request=p.choose(null,'ice');pending.shift()('completed');await request;assert.equal(model.watched('ice'),0);fail=false;
 assert.equal(new TerrainProgress(storage).selected,'cream');
 console.log('通过：11款网格、默认仅草坡、两次广告独立解锁、持久化及旧档迁移、失败取消不发奖、并发防重、关闭回调失效、八语种文案。');
})().catch(e=>{console.error(e);process.exitCode=1});
