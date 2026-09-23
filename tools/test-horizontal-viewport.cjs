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
