const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let visible,safe;const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/GameScreenLayout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({view:{getVisibleSize:()=>visible},sys:{getSafeAreaRect:()=>safe}}),mod,mod.exports);
/** 用已有节点替身记录变换，验证可见区域和物理父节点共用缩放。 */
function node(){return {uuid:'top',setScale(x,y,z){this.scale={x,y,z};},setPosition(x,y,z){this.position={x,y,z};},getComponent:()=>({width:750,height:1667})};}
for(const [width,height,topInset] of [[750,1334,0],[750,1626,88],[750,1200,0],[1024,1366,30],[1334,750,0]]){
visible={width,height};safe={x:0,y:0,width,height:height-topInset};
const board=node(),hud=node(),bar=node(),background=node(),fit=new mod.exports.GameScreenLayout();fit.apply(node(),board,hud,bar,background);
assert.deepEqual(board.scale,hud.scale);assert.deepEqual(board.position,hud.position);
assert.equal(board.scale.x,board.scale.y);
assert.ok(Math.abs(board.position.y-733.538*board.scale.y+height/2)<1e-6,'地形下沿贴屏幕底部');
if(width===750)assert.equal(board.scale.x,1,'常规竖屏地形横向满宽');
const topY=board.position.y+(bar.position.y+49.5)*board.scale.y;
assert.ok(topY<=height/2-topInset,'最高设置图标避开安全区');
assert.ok(background.scale.x*750>=width&&background.scale.y*1667>=height,'背景覆盖');
const before=JSON.stringify(board);fit.apply(node(),board,hud,bar,background);assert.equal(JSON.stringify(board),before);
}
console.log('通过：常规/长/短竖屏满宽、顶部安全区、平板横屏等比回退、地形与HUD共用变换及背景覆盖。');
