const fs=require('node:fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const root='assets/app-bundle/app-view/page/game/native/';
/** 运行真实页面方法，替换引擎和资源边界，检查节点复用与事件次数。 */
function load(file){const exports={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;new Function('require','exports',code)(name=>name==='cc'?{_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},Component:class{},isValid:n=>!n.destroyed}:name==='db://app/base/BaseView'?{default:{BindController:()=>class{}}}:new Proxy({},{get:()=>class{}}),exports);return exports;}
const {PageGame}=load(root+'PageGame.ts');
/** 提供可观察事件计数的固定节点。 */
function node(component){return {listeners:[],getComponent:()=>component,targetOff(target){this.listeners=this.listeners.filter(x=>x.target!==target);},on(event,handler,target){this.listeners.push({event,handler,target});},destroy(){assert.fail('固定节点不得销毁');}};}
const page=Object.create(PageGame.prototype),board={clear(){}},hud={clearFeedback(){}};
board.node=node(board);hud.node=node(hud);
Object.assign(page,{gameBoardNode:board.node,gameHudNode:hud.node,bottomProgressRoot:{},collectionFeedback:{clear(){}},settingsController:{end(){}},refreshState(){}});
for(let i=0;i<4;i++){
page.bindFixedViews();page.bindFixedViews();
assert.equal(board.node.listeners.length,3);assert.equal(hud.node.listeners.length,3);
assert.equal(hud.progressViewRoot,page.bottomProgressRoot);
page.releaseChildren();assert.equal(board.node.listeners.length,0);assert.equal(hud.node.listeners.length,0);
assert.equal(page.board,null);assert.equal(page.hud,null);
}
const {LockWallView}=load(root+'expansion/reward/LockWallView.ts');const lock=new LockWallView();Object.assign(lock,{body:{enabled:true},visual:{active:true},button:{interactable:true}});
for(let i=0;i<3;i++){assert.equal(lock.unlock(),true);assert.equal(lock.unlock(),false);lock.reset();assert.equal(lock.unlocked,false);assert.equal(lock.body.enabled,true);assert.equal(lock.visual.active,true);assert.equal(lock.button.interactable,true);}
console.log('通过：固定棋盘/HUD多次绑定不重复监听、退出不销毁、反复解锁重置恢复碰撞和按钮。');
