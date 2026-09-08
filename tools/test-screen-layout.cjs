const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let visible, safe;
const moduleUnderTest = {exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('assets/app-builtin/app-controller/expansion/ScreenLayout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(() => ({view:{getVisibleSize:()=>visible},sys:{getSafeAreaRect:()=>safe}}),moduleUnderTest,moduleUnderTest.exports);
/** 创建只记录变换的已有节点，测试不依赖引擎渲染。 */
function node(x,y){return {name:'Content',position:{x,y,z:0,clone(){return {...this};}},scale:{x:1,y:1,z:1,clone(){return {...this};}},setScale(x,y,z){this.scale={x,y,z};},setPosition(x,y,z){this.position={x,y,z};}};}
for(const [width,height,inset] of [[750,1334,0],[750,1626,80],[1024,1366,30],[1334,750,0]]){
 visible={width,height};safe={x:inset,y:inset,width:width-inset*2,height:height-inset*2};
 const top=node(375,700),bottom=node(-375,-900);
 const root={children:[top,bottom],getComponent:()=>visible};top.parent=bottom.parent=root;
 const fit=new moduleUnderTest.exports.ScreenLayout();fit.apply(root,-900,700);
 assert.equal(top.scale.x,top.scale.y,'等比缩放');
 assert.ok(top.position.x+width/2 <= safe.x+safe.width);
 assert.ok(top.position.y+height/2 <= safe.y+safe.height);
 assert.ok(bottom.position.x+width/2 >= safe.x);
 assert.ok(bottom.position.y+height/2 >= safe.y);
 const before={...top.position};fit.apply(root,-900,700);assert.deepEqual(top.position,before,'重复更新不累计偏移');
 visible={width:height,height:width};safe={x:0,y:0,width:height,height:width};fit.apply(root,-900,700);
 visible={width,height};safe={x:inset,y:inset,width:width-inset*2,height:height-inset*2};fit.apply(root,-900,700);assert.deepEqual(top.position,before,'旋转返回后恢复原布局');
}
console.log('通过：常规手机、长屏安全区、平板、横屏边界及重复旋转无累计缩放。');
