const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const base='assets/app-bundle/app-view/page/game/native/expansion/movement/';
function load(name){const exports={};new Function('require','exports',ts.transpileModule(fs.readFileSync(base+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(id=>id==='cc'?{UITransform:class{}}:id.endsWith('HorizontalRules')?load('HorizontalRules'):{},exports);return exports;}
const {HorizontalFlow}=load('HorizontalFlow');
function fruit(x,y,height,scale=1,anchor=.5){return {node:{position:{x,y,z:0},scale:{y:scale},getComponent:()=>({contentSize:{height},anchorY:anchor}),setPosition(x,y,z){this.position={x,y,z}}}}}
for(const top of [300,500,720]){
 const fruits=[fruit(0,800,100),fruit(-100,650,120,.8),fruit(-200,400,80)];
 const gap=fruits[0].node.position.y-fruits[1].node.position.y;
 new HorizontalFlow().begin(fruits,{position:{x:300}},top);
 assert.equal(fruits[0].node.position.y+50,top);
 assert.equal(fruits[0].node.position.y-fruits[1].node.position.y,gap);
}
const fit=[fruit(0,100,100)];new HorizontalFlow().begin(fit,{position:{x:300}},500);assert.equal(fit[0].node.position.y,450);
const scaled=[fruit(0,500,100,2,.25)];new HorizontalFlow().begin(scaled,{position:{x:300}},600);assert.equal(scaled[0].node.position.y,450);
new HorizontalFlow().begin([],{position:{x:300}},400);
console.log('通过：多种顶部边界、整组间距保持、低位布局上移贴齐安全边界、缩放与锚点、空布局。');

// 屏幕外高位水果不应压低当前可见区域；接近左侧时连续校正。
const group=[fruit(0,100,100),fruit(-1100,300,100)];
for(const item of group){
 item.node.scale.x=1;
 item.node.parent={getComponent:()=>({contentSize:{width:750},anchorX:.5})};
 item.node.getComponent=()=>({contentSize:{width:100,height:100},anchorX:.5,anchorY:.5});
}
const flow=new HorizontalFlow();flow.begin(group,{position:{x:150}},600);
assert.equal(group[0].node.position.y+50,600);
assert.equal(group[1].node.position.y-group[0].node.position.y,200);
group[1].node.position.x=-440;flow.alignVisibleTop(group);
assert.equal(group[1].node.position.y+50,615);
group[1].node.position.x=-420;flow.alignVisibleTop(group);
assert.equal(group[1].node.position.y+50,600);
assert.equal(group[1].node.position.y-group[0].node.position.y,200);
console.log('通过：屏幕外高位水果不压低可见布局，进入前安全校正且整组间距保持。');

// 整组适配模式固定全组上沿，屏外较高物品也参与，横移不会把底部重新压向草坡。
const fitted=[fruit(0,100,100,.5),fruit(-1100,300,100,.5)];
for(const item of fitted){item.node.scale.x=.5;item.node.parent={getComponent:()=>({contentSize:{width:750},anchorX:.5})};item.node.getComponent=()=>({contentSize:{width:100,height:100},anchorX:.5,anchorY:.5});}
const fittedFlow=new HorizontalFlow();fittedFlow.begin(fitted,{position:{x:150}},600,true);
assert.equal(Math.max(...fitted.map(f=>f.node.position.y+25)),600);
const initialY=fitted.map(f=>f.node.position.y);fitted[1].node.position.x=-350;fittedFlow.alignVisibleTop(fitted);
assert.deepEqual(fitted.map(f=>f.node.position.y),initialY);
console.log('通过：整组适配后的上沿稳定，横移不重新下压布局。');
