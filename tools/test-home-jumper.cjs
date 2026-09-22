const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
class V{constructor(x=1,y=1,z=1){Object.assign(this,{x,y,z});}set(v){Object.assign(this,v);}}
class N{constructor(){this.active=true;this.position={x:0,y:-337,z:0};this.scale=new V();this.size={width:550,height:140,setContentSize(w,h){this.width=w;this.height=h;}};this.parent={getComponent:()=>({width:750})};}getComponent(){return this.size;}setPosition(x,y,z){this.position={x,y,z};}setScale(x,y,z){this.scale=typeof x==='object'?new V(x.x,x.y,x.z):new V(x,y,z);}}
const pending=[],theme={active:1};const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},Component:class{},Node:N,Sprite:class{},SpriteFrame:class{},UITransform:class{},Vec3:V,isValid:()=>true,assetManager:{getBundle:()=>({load:(path,type,cb)=>pending.push({path,cb})})}};cc.Sprite.SizeMode={CUSTOM:0};
const e={};new Function('require','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/home/native/expansion/HomeAmbientMotion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText)(n=>n==='cc'?cc:{GameTheme:theme},e);
const m=new e.HomeAmbientMotion();m.jumper={node:new N(),spriteFrame:null};m.landingButton=new N();
const frame=()=>({originalSize:{width:100,height:80},refs:0,addRef(){this.refs++;},decRef(){this.refs--;}});
m.play();assert.equal(pending[0].path,'fruit/fruit-1/spriteFrame');const f=frame();pending.shift().cb(null,f);m.update(.6);assert.equal(m.landingButton.scale.x,1);m.update(.68);assert.notEqual(m.landingButton.scale.x,1);m.update(.35);assert.equal(m.landingButton.scale.x,1);m.update(2.2);assert(!m.jumper.node.active);m.update(.7);assert.equal(pending[0].path,'fruit/fruit-2/spriteFrame');const f2=frame();pending.shift().cb(null,f2);assert.equal(f.refs,0);
theme.active=2;m.update(.01);assert.equal(pending[0].path,'dessert/dessert-1/spriteFrame');const late=pending.shift();m.stop();late.cb(null,frame());assert(!m.jumper.node.active);assert.equal(f2.refs,0);assert.equal(m.landingButton.scale.x,1);assert.equal(m.jumper.spriteFrame,null);
console.log('通过：顺序轮换、四次落点回弹、离屏继续循环、品类切换、关闭取消迟到加载和图片释放。');


const makeLogo=right=>{const m=new e.HomeAmbientMotion();m.logoRoute=true;m.logoFromRight=right;m.jumper={node:new N(),spriteFrame:null};m.landingButton=new N();m.play();pending.shift().cb(null,frame());return m;};
const left=makeLogo(false),right=makeLogo(true);left.update(.3);right.update(.3);assert(left.jumper.node.position.x<0);assert(right.jumper.node.position.x>0);assert(left.jumper.node.active&&right.jumper.node.active);
left.update(.9);right.update(.9);assert.notEqual(left.jumper.node.position.y,right.jumper.node.position.y,'并行路线高度错开');assert.equal(left.landingButton.scale.x,1);left.stop();right.stop();assert(!left.jumper.node.active&&!right.jumper.node.active);
console.log('通过：Logo左右同时运行、高度错开、加速后关闭恢复。');
