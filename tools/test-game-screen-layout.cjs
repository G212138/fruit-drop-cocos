const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let visible,safe;const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/GameScreenLayout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({Vec3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},view:{getVisibleSize:()=>visible},sys:{getSafeAreaRect:()=>safe}}),mod,mod.exports);
/** 用已有节点替身记录变换，验证可见区域和物理父节点共用缩放。 */
function node(){const n={uuid:'top',position:{x:0,y:0,z:0},scale:{x:1,y:1,z:1},getChildByName:()=>null,setScale(x,y,z){this.scale={x,y,z};},setPosition(x,y,z){this.position={x,y,z};}};
 const t={width:750,height:1667,convertToWorldSpaceAR(p){const q={x:p.x*n.scale.x+n.position.x,y:p.y*n.scale.y+n.position.y,z:0};return n.parent?n.parent.getComponent().convertToWorldSpaceAR(q):q;},convertToNodeSpaceAR(p){const q=n.parent?n.parent.getComponent().convertToNodeSpaceAR(p):p;return {x:(q.x-n.position.x)/n.scale.x,y:(q.y-n.position.y)/n.scale.y,z:0};}};
 n.getComponent=()=>t;return n;}
for(const [width,height,topInset,bottomInset] of [[750,1334,0,0],[750,1626,88,68],[750,1200,0,0],[1024,1366,30,24],[1334,750,0,20]]){
visible={width,height};safe={x:0,y:bottomInset,width,height:height-topInset-bottomInset};
const board=node(),hud=node(),bar=node(),background=node(),fit=new mod.exports.GameScreenLayout();bar.parent=hud;fit.apply(node(),board,hud,bar,background);
assert.deepEqual(board.scale,hud.scale);assert.equal(hud.position.y-board.position.y,bottomInset);
assert.equal(board.scale.x,board.scale.y);
assert.ok(Math.abs(board.position.y-733.538*board.scale.y+height/2)<1e-6,'地形下沿贴屏幕底部');
if(width===750)assert.equal(board.scale.x,1,'常规竖屏地形横向满宽');
const topY=hud.position.y+(bar.position.y+49.5)*hud.scale.y;
assert.ok(topY<=height/2-topInset,'最高设置图标避开安全区');
assert.ok(background.scale.x*750>=width&&background.scale.y*1667>=height,'背景覆盖');
const before=JSON.stringify(board);fit.apply(node(),board,hud,bar,background);assert.equal(JSON.stringify(board),before);
const middle=node();middle.parent=hud;middle.setPosition(25,180,0);bar.parent=middle;
fit.apply(node(),board,hud,bar,background);
let topWorld=bar.getComponent().convertToWorldSpaceAR({x:0,y:49.5,z:0});
assert.ok(topWorld.y<=height/2-topInset,'中间GameHud偏移不把顶栏推到屏幕外');
middle.setPosition(-30,240,0);fit.apply(node(),board,hud,bar,background);
assert.equal(bar.getComponent().convertToWorldSpaceAR({x:0,y:49.5,z:0}).y,topWorld.y,'同尺寸下跟进延迟父级布局');
fit.apply(node(),board,hud,bar,background,true);
assert.ok(bar.getComponent().convertToWorldSpaceAR({x:0,y:49.5,z:0}).y<=height/2-topInset-48*hud.scale.y,'预留宿主胶囊间距');
}
visible={width:750,height:1626};safe={x:0,y:68,width:750,height:1470};
const bag={position:{x:0,y:-641.082,z:0,clone(){return {...this};}},scale:{x:1,y:1,z:1,clone(){return {...this};}},
 getComponent:()=>({height:182}),setScale(x,y,z){Object.assign(this.scale,{x,y,z});},setPosition(x,y,z){Object.assign(this.position,{x,y,z});}};
const bagBoard=node(),innerBoard=node();innerBoard.getChildByName=name=>name==='RemovalEffects'?{getChildByName:()=>bag}:null;
bagBoard.getChildByName=()=>innerBoard;
const bagFit=new mod.exports.GameScreenLayout(),bagHud=node(),bagBar=node(),bagBackground=node();
bagFit.apply(node(),bagBoard,bagHud,bagBar,bagBackground);
assert.ok(bag.position.y-bag.scale.y*91>=-733.538+68+8-1e-6,'袋子底部避开手势区');
assert.ok(bag.position.y+bag.scale.y*91<=-525.825+1e-6,'袋子顶部不遮挡锁墙');
assert.equal(bag.scale.x,bag.scale.y,'袋子只等比缩放');
safe={...safe,y:34,height:1504};bagFit.apply(node(),bagBoard,bagHud,bagBar,bagBackground);
assert.ok(bag.position.y+bag.scale.y*91<=-525.825+1e-6,'安全区变化不造成锁墙重叠');
const stable=JSON.stringify(bag);bagFit.apply(node(),bagBoard,bagHud,bagBar,bagBackground);assert.equal(JSON.stringify(bag),stable,'重复适配不累加');
assert.equal(bagBoard.getComponent().enabled,false,'停用覆盖场地位置的Widget');
assert.equal(innerBoard.getComponent().enabled,false,'停用中间棋盘Widget');
console.log('通过：长短屏、底部手势区、地形全屏、袋子安全区、胶囊行预留及重复适配。');
