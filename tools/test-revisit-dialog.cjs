const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const storage = new Map();
const modules = {};
class Component { constructor() { this.isValid=true; this.enabledInHierarchy=true; } }
class Button {}
class Node {}
class Label {}
const language={current:'en',subscribe(){},unsubscribe(){}};
const cc={ Component, Button, Node, Label, sys:{localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}},
 _decorator:{ccclass:()=>c=>c,property:()=>()=>{}} };
/** 转译真实业务脚本，隔离引擎外观层和平台回调。 */
function load(file) {
 file=path.resolve(file);
 if(modules[file]) return modules[file];
 const exports=modules[file]={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
 new Function('exports','require',code)(exports,name=>{
  if(name==='cc') return cc;
  if(name==='cc/env') return {DEV:true};
  if(name.endsWith('/GameLanguage')) return {GameLanguage:language};
  return load(path.resolve(path.dirname(file),name+'.ts'));
 });
 return exports;
}
const base='assets/app-builtin/app-model/expansion/platform/';
/** 模拟已序列化的标签和按钮，业务仅更新文案状态。 */
function label() { const button={interactable:true}; return {string:'',node:{active:true,parent:{getComponent:()=>button}}}; }
/** 等待真实 Promise 回调完成。 */
async function settle() { for(let i=0;i<25;i++) await Promise.resolve(); }
/** 验证无后端静默登录和两个任务的资格、去重、回前台时序。 */
async function main() {
 const {TikTokSilentLogin}=load(base+'TikTokSilentLogin.ts');
 let callback,calls=0;
 const auth=new TikTokSilentLogin(()=>({login:o=>{callback=o;calls++;}}));
 const a=auth.login(),b=auth.login();
 assert.equal(a,b); assert.equal(calls,1);
 callback.success({code:'temporary-only'});
 assert.equal(await a,true); assert.equal(auth.ready,true);
 const c=auth.login();callback.fail();assert.equal(await c,false);
 assert.equal(auth.ready,false);
 const bad=new TikTokSilentLogin(()=>({login:o=>o.success({code:''})}));
 assert.equal(await bad.login(),false);
 assert.equal(storage.size,0,'登录临时 code 不得写入存档');
 const {TikTokRevisitView}=load('assets/app-bundle/app-view/page/home/native/expansion/TikTokRevisitView.ts');
 const {TikTokMissionRewards}=load(base+'TikTokMissionRewards.ts');
 const view=new TikTokRevisitView();
 for(const name of ['shortcutButton','profileButton','shortcutDialog','profileDialog']) view[name]={active:false};
 for(const name of ['shortcutLabel','profileLabel','notice','shortcutDescription','profileDescription','shortcutReward','profileReward','shortcutAction','profileAction','shortcutNotice','profileNotice']) view[name]=label();
 view.onEnable(); view.request(null,'profile');
 assert.equal(view.profileDialog.active,true);assert.equal(view.shortcutDialog.active,false);
 view.begin(null,'profile');
 assert.match(view.profileNotice.string,/TikTok/);
 assert.equal(storage.size,0,'浏览器预览不得模拟成功发奖');
 let eligible=false,opens=0,checks=0,onShow;
 global.TTMinis={game:{canIUse:()=>true,login:o=>o.success({code:'new-code'}),
  getStorageSync:k=>storage.get(k),setStorageSync:(k,v)=>storage.set(k,v),
  onShow:f=>{onShow=f;},offShow:f=>assert.equal(f,onShow),
  startEntranceMission:o=>{opens++;onShow();o.success();},
  getEntranceMissionReward:o=>{checks++;o.success({canReceiveReward:eligible});},
  addShortcut:o=>o.success(),getShortcutMissionReward:o=>o.success({canReceiveReward:eligible})}};
 view.onEnable();view.request(null,'profile');
 view.begin(null,'profile');view.begin(null,'profile');
 await settle();
 assert.equal(opens,1,'重复点击不能重复导航');
 assert.ok(checks>=2,'onShow 先于导航成功回调也要补查');
 assert.equal(TikTokMissionRewards.hasLocalClaim('profile'),false);
 assert.equal(storage.has('fruit-drop.props.v1'),false,'导航成功或资格 false 不发奖');
 eligible=true;onShow();await settle();
 assert.equal(TikTokMissionRewards.hasLocalClaim('profile'),true);
 assert.equal(JSON.parse(storage.get('fruit-drop.props.v1')).shuffle,3);
 view.begin(null,'profile');await settle();
 assert.equal(JSON.parse(storage.get('fruit-drop.props.v1')).shuffle,3);
 view.close();view.request(null,'shortcut');view.begin(null,'shortcut');await settle();
 assert.equal(JSON.parse(storage.get('fruit-drop.props.v1')).eliminate,3);
 view.onDisable();assert.equal(view.shortcutDialog.active,false);
 const old=storage.get('fruit-drop.props.v1');
 global.TTMinis.game.setStorageSync=()=>{throw Error('full');};
 assert.equal(TikTokMissionRewards.grant('profile','other'), 'failed');
 assert.equal(storage.get('fruit-drop.props.v1'),old);
 delete global.TTMinis;
 console.log('通过：无后端静默登录、并发合并、临时码不落盘、浏览器不伪造领奖、任务资格、导航回调竞态、两种道具发放与重复领取、关闭和写入失败。');
}
main().catch(e=>{delete global.TTMinis;console.error(e);process.exitCode=1;});
