const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let visible,safe;const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/GameScreenLayout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({view:{getVisibleSize:()=>visible},sys:{getSafeAreaRect:()=>safe}}),mod,mod.exports);
/** 用已有节点替身记录变换，验证可见区域和物理父节点共用缩放。 */
function node(){return {uuid:'top',getChildByName:()=>null,setScale(x,y,z){this.scale={x,y,z};},setPosition(x,y,z){this.position={x,y,z};},getComponent:()=>({width:750,height:1667})};}
for(const [width,height,topInset,bottomInset] of [[750,1334,0,0],[750,1626,88,68],[750,1200,0,0],[1024,1366,30,24],[1334,750,0,20]]){
visible={width,height};safe={x:0,y:bottomInset,width,height:height-topInset-bottomInset};
const board=node(),hud=node(),bar=node(),background=node(),fit=new mod.exports.GameScreenLayout();fit.apply(node(),board,hud,bar,background);
assert.deepEqual(board.scale,hud.scale);assert.equal(hud.position.y-board.position.y,bottomInset);
assert.equal(board.scale.x,board.scale.y);
assert.ok(Math.abs(board.position.y-733.538*board.scale.y+height/2)<1e-6,'地形下沿贴屏幕底部');
if(width===750)assert.equal(board.scale.x,1,'常规竖屏地形横向满宽');
const topY=hud.position.y+(bar.position.y+49.5)*hud.scale.y;
assert.ok(topY<=height/2-topInset,'最高设置图标避开安全区');
assert.ok(background.scale.x*750>=width&&background.scale.y*1667>=height,'背景覆盖');
const before=JSON.stringify(board);fit.apply(node(),board,hud,bar,background);assert.equal(JSON.stringify(board),before);
fit.apply(node(),board,hud,bar,background,true);
assert.ok(hud.position.y+(bar.position.y+49.5)*hud.scale.y<=height/2-topInset-100*hud.scale.y,'预留宿主胶囊行');
}
visible={width:750,height:1626};safe={x:0,y:68,width:750,height:1470};
const bag={position:{x:0,y:-620,z:0,clone(){return {...this};}},setPosition(x,y,z){Object.assign(this.position,{x,y,z});}};
const bagBoard=node();bagBoard.getChildByName=()=>({getChildByName:()=>({getChildByName:()=>bag})});
const bagFit=new mod.exports.GameScreenLayout(),bagHud=node(),bagBar=node(),bagBackground=node();
bagFit.apply(node(),bagBoard,bagHud,bagBar,bagBackground);
assert.equal(bag.position.y,-552,'袋子保留底部安全区');
safe={...safe,y:34,height:1504};bagFit.apply(node(),bagBoard,bagHud,bagBar,bagBackground);
assert.equal(bag.position.y,-586,'安全区变化不累加补偿');
console.log('通过：长短屏、底部手势区、地形全屏、袋子安全区、胶囊行预留及重复适配。');
