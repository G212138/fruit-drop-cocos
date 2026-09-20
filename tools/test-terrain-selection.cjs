const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
function compile(file,req=()=>({})){const out={};const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true},reportDiagnostics:true});assert.equal(result.diagnostics.length,0);new Function('require','exports',result.outputText)(req,out);return out;}
const dir='assets/app-builtin/app-model/expansion/';
const {TerrainProgress,terrainCatalog}=compile(dir+'TerrainProgress.ts');
const {ThemeProgress}=compile(dir+'ThemeProgress.ts');
const data=new Map();let fail=false;
const storage={getItem:k=>data.get(k)||null,setItem(k,v){if(fail)throw Error('disk');data.set(k,v);}};
let terrain=new TerrainProgress(storage),items=new ThemeProgress(storage);
assert.equal(terrain.selected,'grass');
assert.equal(items.select(2,31),true);
assert.equal(terrain.select('cake'),true);
assert.equal(items.resolve(31),2);
assert.equal(items.select(1,31),true);
assert.equal(terrain.selected,'cake');
assert.equal(new TerrainProgress(storage).selected,'cake');
assert.equal(new ThemeProgress(storage).resolve(31),1);
fail=true;assert.equal(terrain.select('ice'),false);assert.equal(terrain.selected,'cake');fail=false;
assert.equal(terrain.select('not-a-terrain'),false);
data.set('fruit-drop.terrain.v1','{broken');assert.equal(new TerrainProgress(storage).selected,'grass');
assert.equal(items.select(2,30),false);
assert.equal(new Set(terrainCatalog.map(x=>x.id)).size,terrainCatalog.length);
assert.equal(terrainCatalog.length,11);
for(const entry of terrainCatalog){const path='assets/res-bundle/shared-terrains/terrains/'+entry.file+'.png';assert.ok(fs.existsSync(path));const m=JSON.parse(fs.readFileSync(path+'.meta'));assert.ok(Object.values(m.subMetas).some(x=>x.importer==='sprite-frame'));}
// 真实面板异步行为：翻页丢弃过期图片，关闭释放，确认才写入。
const pending=[];const terrainState={selected:'grass',select(id){this.selected=id;return true;}};
const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},Component:class{},isValid:()=>true};
const {TerrainPanel}=compile('assets/app-bundle/app-view/page/home/native/expansion/TerrainPanel.ts',n=>n==='cc'?cc:n.endsWith('/GameTerrain')?{GameTerrain:{current:terrainState}}:n.endsWith('/TerrainProgress')?{terrainCatalog}:n.endsWith('/TerrainArt')?{TerrainArt:{load:(f,done)=>pending.push(done)}}:{GameLanguage:{current:'zh',text:k=>k,subscribe(){},unsubscribe(){}}});
const p=new TerrainPanel();p.node={active:true,activeInHierarchy:true};for(const k of ['preview','heading','title','count','status','confirmButton','confirmLabel'])p[k]={};
p.open();p.next();assert.equal(terrainState.selected,'grass');let released=0;pending.shift()({decRef(){released++;}});assert.equal(released,1);assert.equal(p.preview.spriteFrame,null);pending.shift()({decRef(){released++;}});p.confirmUse();assert.equal(terrainState.selected,'cream');p.next();pending.shift()(null);assert.equal(p.confirmButton.interactable,true);p.confirmUse();assert.equal(pending.length,1);p.onDisable();pending.shift()({decRef(){released++;}});assert.equal(released,3);
console.log('通过：11款资源、主题/图鉴独立存档、解锁门槛、重启恢复、坏档回退、写入失败、快速翻页和关闭资源释放。');
