const assert=require('node:assert/strict'),fs=require('fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let visible={width:750,height:1334},safe={x:0,y:0,width:750,height:1334};
class Vec3 { constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} }
const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/FruitViewportLayout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({Vec3,Widget:'widget',sys:{getSafeAreaRect:()=>safe},view:{getVisibleSize:()=>visible}}),mod,mod.exports);
/** 简化UI变换模型，验证裁剪和原点补偿，不模拟物理。 */
function makeNode(uuid,y=0){
 const n={uuid,position:new Vec3(0,y),setPosition(x,y,z){this.position=new Vec3(x,y,z);}};
 const t={width:750,height:56,anchorY:.5,setContentSize(w,h){this.width=w;this.height=h;},setAnchorPoint(x,y){this.anchorY=y;},convertToWorldSpaceAR(p){return new Vec3(p.x+n.position.x,p.y+n.position.y);},convertToNodeSpaceAR(p){return new Vec3(p.x-n.position.x,p.y-n.position.y);}};
 n.getComponent=kind=>kind==='widget'?null:t;return n;
}
const page=makeNode('page'),board=makeNode('board'),status=makeNode('status',545),viewport=makeNode('viewport'),fruits=makeNode('fruits');fruits.parent=viewport;
const widget={enabled:true},getViewportComponent=viewport.getComponent;
viewport.getComponent=kind=>kind==='widget'?widget:getViewportComponent(kind);
const layout=new mod.exports.FruitViewportLayout();
assert.equal(layout.apply(page,board,fruits,status),501);
assert.equal(widget.enabled,false,'动态裁剪停用冲突的Widget');
assert.equal(viewport.position.y+viewport.getComponent().height/2,501);
assert.equal(viewport.position.y-viewport.getComponent().height/2,-667);
assert.equal(viewport.position.y+fruits.position.y,0,'裁剪中心改变不移动水果原点');
visible={width:1024,height:1600};safe={x:20,y:40,width:984,height:1500};status.position.y=600;
assert.equal(layout.apply(page,board,fruits,status),556);
assert.equal(viewport.getComponent().width,984,'宽度跟随实际安全区');
assert.equal(viewport.position.y+fruits.position.y,0);
const nextBoard=makeNode('new-board'),nextViewport=makeNode('next-viewport'),nextFruits=makeNode('next-fruits');nextFruits.parent=nextViewport;
layout.apply(page,nextBoard,nextFruits,status);
assert.equal(nextViewport.getComponent().width,984,'同尺寸重开也必须初始化新棋盘');
console.log('通过：HUD下缘、安全区边界、居中锚点、原点补偿与同尺寸重开。');
