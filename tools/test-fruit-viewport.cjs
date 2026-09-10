const assert=require('node:assert/strict'),fs=require('fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
class Vec3 { constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} }
const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/FruitViewportLayout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({Vec3}),mod,mod.exports);
/** 所有写操作均拒绝，验证业务只能读取组件布局。 */
function makeNode(y){
 const n={y,setPosition(){throw Error('不能改位置');},setScale(){throw Error('不能改缩放');}};
 const t={height:56,anchorY:.5,setContentSize(){throw Error('不能改尺寸');},setAnchorPoint(){throw Error('不能改锚点');},convertToWorldSpaceAR(p){return new Vec3(p.x,p.y+n.y,p.z);},convertToNodeSpaceAR(p){return new Vec3(p.x,p.y-n.y,p.z);}};
 n.getComponent=()=>t;return n;
}
const layout=new mod.exports.FruitViewportLayout(),page=makeNode(0),board=makeNode(0),fruits=makeNode(0),marker=makeNode(545);
assert.equal(layout.apply(page,board,fruits,marker),501);
fruits.y=100;marker.y=600;
assert.equal(layout.apply(page,board,fruits,marker),456,'按组件配置变化读取水果局部补位高度');
for(const file of ['page/home/native/PageHome.ts','page/game/native/PageGame.ts','page/editor/native/PageEditor.ts','pop/result/native/PopResult.ts']) {
 const source=fs.readFileSync('assets/app-bundle/app-view/'+file,'utf8');
 assert.equal(/screenLayout\.apply|new (GameScreenLayout|ScreenLayout)/.test(source),false,file+'不得重新接入代码自适应');
}
console.log('通过：补位标记只读、父级偏移换算及四个页面取消代码自适应。');
