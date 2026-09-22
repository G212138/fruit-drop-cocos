const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
class V{constructor(x=1,y=1,z=1){Object.assign(this,{x,y,z});}set(v){Object.assign(this,v);}}
class N{constructor(){this.active=true;this.position={x:0,y:-337,z:0};this.scale=new V();this.size={width:550,height:140,setContentSize(w,h){this.width=w;this.height=h;}};this.parent={getComponent:()=>({width:750})};}getComponentInChildren(){return this.motion || null;}getComponent(){return this.size;}setPosition(x,y,z){this.position={x,y,z};}setScale(x,y,z){this.scale=typeof x==='object'?new V(x.x,x.y,x.z):new V(x,y,z);}}
const pending=[],theme={active:1};const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},Component:class{},Node:N,Sprite:class{},SpriteFrame:class{},UITransform:class{},Vec3:V,isValid:()=>true,assetManager:{getBundle:()=>({load:(path,type,cb)=>pending.push({path,cb})})}};cc.Sprite.SizeMode={CUSTOM:0};
const e={};new Function('require','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/home/native/expansion/HomeAmbientMotion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText)(n=>n==='cc'?cc:{GameTheme:theme},e);

const frame=()=>({originalSize:{width:100,height:80},refs:0,addRef(){this.refs++;},decRef(){this.refs--;}});
const make=(logo=false,right=false)=>{
 const m=new e.HomeAmbientMotion();m.logoRoute=logo;m.logoFromRight=right;
 m.jumper={node:new N(),spriteFrame:null};m.landingButton=new N();
 m.landingButton.motion={hits:0,useImpactMotion(){this.enabled=true;},bounce(){this.hits++;}};
 m.play();const f=frame();pending.shift().cb(null,f);return {m,f};
};
for(const logo of [false,true]) {
 const {m,f}=make(logo);let previous=m.jumper.node.position;let lastImpact=-10;const contacts=[];
 for(let i=0;i<190;i++) {
  m.update(.01);const current=m.jumper.node.position;
  assert(Math.abs((current.x-previous.x)/.01-(logo?440:400))<1e-7,'全程横向速度连续');
  if(m.impact>lastImpact){contacts.push(m.impact);lastImpact=m.impact;}
  previous={...current};
 }
 assert(contacts.length>=3,'连续衰减反弹');
 assert(contacts[2]-contacts[1]<contacts[1]-contacts[0],'后一次飞行时间变短');
 if(logo) assert.equal(m.landingButton.motion.hits,contacts.length);
 m.update(m.cycleDuration-m.elapsed-.01);assert(!m.jumper.node.active,'离屏后短间隔');
 m.update(.02);assert.equal(pending[0].path,'fruit/fruit-2/spriteFrame');
 pending.shift().cb(null,frame());assert.equal(f.refs,0);m.stop();
 assert.equal(m.landingButton.scale.x,1);
}
const {m:left}=make(true),{m:right}=make(true,true);
left.update(.4);right.update(.4);
assert(Math.abs(left.jumper.node.position.x+right.jumper.node.position.x)<1e-8,'双侧同步对称');
left.stop();right.stop();
const {m,f}=make();theme.active=2;m.update(.01);
assert.equal(pending[0].path,'dessert/dessert-1/spriteFrame');const late=pending.shift();
m.stop();late.cb(null,frame());assert.equal(f.refs,0);assert.equal(m.jumper.spriteFrame,null);
console.log('通过：横向匀速、连续衰减反弹、双侧同步、短间隔轮换、切换品类和关闭释放。');
