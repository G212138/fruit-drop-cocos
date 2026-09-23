const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),os=require('node:os');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const base='assets/app-builtin/app-model/expansion/platform/';
const store=new Map(),listeners=[];let exists=false,supported=true,platform='android',appName='Douyin',navigations=0,adds=0;
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const api={onShow:f=>listeners.push(f),getLaunchOptionsSync:()=>({}),getSystemInfoSync:()=>({platform,appName}),
 checkScene:o=>o.success({isExist:supported}),checkShortcut:o=>o.success({status:{exist:exists}}),
 navigateToScene:o=>{navigations++;o.success()},addShortcut:o=>{adds++;exists=true;o.success()}};
const modules={};function load(name){if(modules[name])return modules[name];const out=modules[name]={};new Function('require','exports',ts.transpileModule(fs.readFileSync(base+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(id=>id==='./DouyinRuntime'?{getDouyinGame:()=>api}:id==='./PlatformStorage'?{PlatformStorage:storage}:load(id.slice(2)),out);return out;}
async function main(){
 const {DouyinRevisit}=load('DouyinRevisit'),{DouyinMissionRewards:rewards}=load('DouyinMissionRewards'),service=DouyinRevisit.shared;
 service.install();await service.refresh();assert(service.sidebarSupported);assert(service.shortcutSupported);
 assert.equal(await service.claim('profile'),'incomplete');assert.equal(await service.open('profile'),true);assert.equal(navigations,1);assert.equal(await service.claim('profile'),'incomplete','跳转成功不能领奖');
 listeners.forEach(f=>f({launch_from:'homepage',location:'sidebar_card'}));await service.refresh();assert(service.eligible('profile'));
 assert.equal(await service.claim('profile'),'granted');assert.equal(await service.claim('profile'),'already');assert.equal(JSON.parse(store.get('fruit-drop.props.v1')).shuffle,3);
 listeners.forEach(f=>f({launch_from:'other',location:'other'}));assert.equal(service.eligible('profile'),false,'普通热启动覆盖旧资格');
 assert.equal(await service.claim('shortcut'),'incomplete');const opening=service.open('shortcut');assert.equal(adds,1,'API在用户调用栈中同步执行');await opening;assert.equal(await service.claim('shortcut'),'granted');assert.equal(await service.claim('shortcut'),'already');
 const inventory=JSON.parse(store.get('fruit-drop.props.v1'));assert.equal(inventory.eliminate,3);assert(inventory.missionRewards.every(v=>v.startsWith('douyin:')));
 global.__tumbleDouyinEntry={latest:{launch_from:'homepage',location:'sidebar_card'},day:'2000-1-1'};assert.equal(service.eligible('profile'),false,'昨日入口不支持跨日挂机领奖');delete global.__tumbleDouyinEntry;
 platform='ios';await service.refresh();assert.equal(service.shortcutSupported,false);platform='android';appName='Toutiao';await service.refresh();assert.equal(service.shortcutSupported,false);assert(service.sidebarSupported,'侧边栏不限制合作宿主');
 supported=undefined;await service.refresh();assert.equal(service.sidebarSupported,false,'缺失isExist不能视为支持');
 store.clear();storage.setItem=()=>{throw Error('disk')};assert.equal(rewards.grant('shortcut'),'failed');assert.equal(store.size,0);
 const boot=fs.readFileSync('tools/douyin-bootstrap.js','utf8');let show;const context={tt:{onShow:f=>show=f,getLaunchOptionsSync:()=>({launch_from:'homepage',location:'sidebar_card'})}};vm.runInNewContext(boot,context);assert.equal(context.__tumbleDouyinEntry.latest.location,'sidebar_card');show({});assert.equal(context.__tumbleDouyinEntry.latest.location,undefined);
 let early;const immediate={tt:{onShow:f=>{early=f;f({location:'sidebar_card',launch_from:'homepage'})},getLaunchOptionsSync:()=>({location:'old'})}};vm.runInNewContext(boot,immediate);assert.equal(immediate.__tumbleDouyinEntry.latest.location,'sidebar_card');
 const foreign={tt:api,TTMinis:{game:{}}};vm.runInNewContext(boot,foreign);assert.equal(foreign.__tumbleDouyinEntry,undefined);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'douyin-entry-test-'));fs.writeFileSync(path.join(temp,'project.config.json'),JSON.stringify({appid:'ttaf1dd9a03178d36c02'}));fs.writeFileSync(path.join(temp,'game.js'),'engine();');const {prepareDouyin}=require('./prepare-douyin.cjs');prepareDouyin(temp);prepareDouyin(temp);const game=fs.readFileSync(path.join(temp,'game.js'),'utf8');assert(game.startsWith('require("./douyin-bootstrap.js");'));assert.equal(game.match(/require/g).length,1);fs.writeFileSync(path.join(temp,'project.config.json'),JSON.stringify({appid:'different'}));assert.throws(()=>prepareDouyin(temp));
 console.log('通过：冷/热启动来源、能力探测、每日与首次奖励幂等、同步点击调用、存储失败、跨日限制、宿主屏蔽、构建注入及TikTok隔离。');
}
main().catch(e=>{console.error(e);process.exitCode=1});
