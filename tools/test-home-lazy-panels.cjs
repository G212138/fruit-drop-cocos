const fs=require('fs'),assert=require('assert/strict'),ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const requests=[];let instances=0;const opened=[];
class ThemePanel{} class TerrainPanel{} class SettingsPanel{}
const app={controller:{game:{progress:{level:31}},settings:{end(){}}},manager:{ui:{showToast(){}}}};
const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},instantiate(){instances++;return {active:false,setSiblingIndex(){},targetOff(){},on(){},getComponent(type){return {node:this,open(){opened.push(type.name)},close(){}}}}},isValid:n=>!n.destroyed};
class Base{loadRes(p,t,cb){requests.push({p,cb});}}
const code=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/home/native/PageHome.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true},reportDiagnostics:true});assert.equal(code.diagnostics.length,0);
const e={};new Function('require','exports',code.outputText)(n=>n==='cc'?cc:n==='cc/env'?{}:n.includes('BaseView')?{default:Base}:n.endsWith('/app')?{app}:n.endsWith('/ThemePanel')?{ThemePanel}:n.endsWith('/TerrainPanel')?{TerrainPanel}:n.endsWith('/SettingsPanel')?{SettingsPanel}:n.endsWith('/GameSettings')?{GameSettings:{current:{snapshot:{}}}}:n.endsWith('/GameLanguage')?{GameLanguage:{unsubscribe(){}}}:n.endsWith('/UiClickSound')?{UiClickSound:{bind(){}}}:{},e);
(async()=>{const p=new e.PageHome();p.node={children:[]};p.homeVisible=true;
const a=p.openPanel('ThemePanel'),b=p.openPanel('ThemePanel');assert.equal(requests.length,1);requests.shift().cb({});await Promise.all([a,b]);assert.equal(instances,1);assert.deepEqual(opened,['ThemePanel']);
await p.openPanel('ThemePanel');assert.equal(instances,1);
const late=p.openPanel('TerrainPanel');p.onHide();requests.shift().cb({});await late;assert(!opened.includes('TerrainPanel'));
p.homeVisible=true;await p.openPanel('TerrainPanel');assert(opened.includes('TerrainPanel'));
const bad=p.openPanel('SettingsPanel');requests.shift().cb(null);await bad;const retry=p.openPanel('SettingsPanel');assert.equal(requests.length,1);requests.shift().cb({});await retry;assert(opened.includes('SettingsPanel'));
const home=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/page/home/native/PageHome.prefab'));assert(!home.some(x=>['ThemePanel','TerrainPanel','SettingsPanel'].includes(x._name)));
for(const n of ['ThemePanel','TerrainPanel','SettingsPanel']){const a=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/page/home/resources/prefabs/'+n+'.prefab'));assert(a.some(x=>x.__type__==='cc.Node'&&x._name===n));}
console.log('通过：面板按需加载、并发去重、缓存复用、离页保护、失败重试及首页静态依赖移除。');})().catch(e=>{console.error(e);process.exitCode=1});
