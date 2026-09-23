const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 模拟子节点事件系统在父组件销毁前释放的顺序。 */
function row() {
    return {valid:true,listeners:[],on(event,fn,target){this.listeners.push({event,fn,target});},
        targetOff(target){if(!this.valid)throw new Error('已销毁事件系统');this.listeners=this.listeners.filter(item=>item.target!==target);}};
}
const pending = new Map();
const cc = {_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},Component:class{},
    isValid:value=>!!value?.valid,Tween:{stopAllByTarget:target=>pending.delete(target)},
    tween:target=>{const chain={to:()=>chain,call:fn=>{pending.set(target,fn);return chain;},start:()=>{}};return chain;}};
const output=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/pop/settings/native/expansion/SettingsPanel.ts','utf8'),{
    compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
const languagePolicy={selectable:true};
const result={};new Function('require','exports',output)(name=>name==='cc'?cc:name.endsWith('/GameLanguage')?{GameLanguage:languagePolicy}:{},result);
const panel=new result.SettingsPanel();
panel.musicRow=row();panel.soundRow=row();panel.vibrateRow=row();panel.content={};panel.opacity={};
const events=[];panel.node={active:true,emit:(...event)=>events.push(event)};
panel.onEnable();panel.onDisable();panel.onEnable();
assert.equal(panel.musicRow.listeners.length,1,'重复打开不能重复绑定');
panel.restartGame();panel.returnHome();
pending.get(panel.opacity)();
assert.deepEqual(events,[['settings-action','restart']],'关闭期间导航只处理第一次点击');
panel.onDisable();
assert.equal(panel.musicRow.listeners.length,0);
for(const item of [panel.musicRow,panel.soundRow,panel.vibrateRow])item.valid=false;
assert.doesNotThrow(()=>panel.onDestroy(),'父组件销毁不能再访问已释放的子事件系统');
console.log('通过：面板重复启停、关闭去重、监听解除及先销毁子节点的清理顺序。');

// 同一面板在首页与游戏之间复用时，重置子弹窗并按可见内容调整高度。
function positioned(x,y,z){return {position:{x,y,z},setPosition(x,y,z){this.position={x,y,z}}};}
panel.backgroundSize={setContentSize(){}};panel.titlePlate=positioned(8,292,1);panel.closeButton=positioned(265,288,2);
panel.languageRow={active:true};panel.gameActions={active:false};panel.languageOptions={active:true};
let bodyHeight=0,contentSize;
panel.bodyLayout={node:{getComponent(){return {height:bodyHeight}}},updateLayout(){bodyHeight=panel.gameActions.active?560:464}};
const transform={height:576,setContentSize(w,h){this.height=h;contentSize=[w,h]}};
panel.content={getComponent(){return transform},getComponentsInChildren(){return []}};
panel.setMode('game');assert.equal(panel.languageRow.active,false);assert.equal(panel.gameActions.active,true);assert.equal(panel.languageOptions.active,false);assert.deepEqual(contentSize,[600,672]);
panel.languageOptions.active=true;panel.setMode('home');assert.equal(panel.languageRow.active,true);assert.equal(panel.gameActions.active,false);assert.equal(panel.languageOptions.active,false);assert.deepEqual(contentSize,[600,576]);
console.log('通过：首页/游戏复用时的功能区、语言子面板及高度切换。');

assert.deepEqual(panel.titlePlate.position,{x:8,y:292,z:1});
assert.deepEqual(panel.closeButton.position,{x:265,y:288,z:2});
for(let i=0;i<5;i++){
 panel.setMode('game');assert.deepEqual(panel.titlePlate.position,{x:8,y:340,z:1});assert.deepEqual(panel.closeButton.position,{x:265,y:336,z:2});
 panel.setMode('game');assert.deepEqual(panel.titlePlate.position,{x:8,y:340,z:1});
 panel.setMode('home');assert.deepEqual(panel.titlePlate.position,{x:8,y:292,z:1});assert.deepEqual(panel.closeButton.position,{x:265,y:288,z:2});
}
console.log('通过：保留手调标题和关闭按钮位置，反复切换模式不累积偏移。');

languagePolicy.selectable=false;panel.setMode('home');assert.equal(panel.languageRow.active,false);assert.equal(panel.languageOptions.active,false);
languagePolicy.selectable=true;panel.setMode('home');assert.equal(panel.languageRow.active,true);
console.log('通过：抖音隐藏语言行和子面板，其他平台首页保留入口。');
