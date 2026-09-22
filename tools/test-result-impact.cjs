const fs=require('fs'),assert=require('assert/strict'),ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new V(this.x,this.y,this.z);}}
class N{constructor(){this.position=new V(13,25,0);this.scale=new V(1,1,1);this.angle=7;this.children=[];this.active=true;this.opacity={opacity:255};}setPosition(x,y,z=0){this.position=typeof x==='number'?new V(x,y,z):x.clone();}setScale(x,y,z=1){this.scale=typeof x==='number'?new V(x,y,z):x.clone();}getComponent(){return this.opacity;}}
const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},Component:class{},Node:N,Vec3:V,UIOpacity:class{},AudioSource:class{}};
const e={};new Function('require','exports',ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/pop/result/native/expansion/ResultPresentation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText)(n=>n==='cc'?cc:{GameSettings:{current:{snapshot:{sound:false}}}},e);
const v=new e.ResultPresentation();for(const field of ['cards','titles','illustrations','particleRoots','haloRoots','buttonRoots'])v[field]=Array.from({length:3},()=>new N());for(const field of ['particleRoots','haloRoots','buttonRoots'])for(const n of v[field])n.children=[new N(),new N()];v.titleGlint=new N();
for(const mode of [0,1,2,0]){v.play(mode);assert(v.titles[mode].scale.x>1);v.update(.35);assert(Number.isFinite(v.illustrations[mode].scale.x));v.update(2);assert.equal(v.titles[mode].scale.x,1);assert.equal(v.titles[mode].angle,7);assert.equal(v.buttonRoots[mode].children[0].scale.x,1);v.buttonRoots[mode].children[0].setScale(.96,.96);v.update(.1);assert.equal(v.buttonRoots[mode].children[0].scale.x,.96,'入场不覆盖按钮点击动画');v.stop();for(const n of v.titles.concat(v.illustrations)){assert.equal(n.scale.x,1);assert.equal(n.angle,7);assert.equal(n.position.y,25);}for(const n of v.haloRoots.concat(v.particleRoots))assert.equal(n.active,false);}
v.play(1);v.update(.69);assert(v.illustrations[1].scale.x>1);v.onDisable();assert.equal(v.mode,-1);
const a=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/pop/result/native/PopResult.prefab'));const overlay=a.find(x=>Array.isArray(x.keys)&&Array.isArray(x.levels));assert(!overlay.keys.some(k=>['success','revive','ended'].includes(k))||overlay.labels.every((r,i)=>overlay.keys[i]!=='revive'||a[a[r.__id__].node.__id__]._name==='Caption'));
const p=a.find(x=>x.titles&&x.haloRoots);assert.equal(p.titles.length,3);for(const r of p.titles){const node=a[r.__id__];assert(node._components.some(c=>a[c.__id__].__type__==='cc.Sprite'));assert(!node._components.some(c=>a[c.__id__].__type__==='cc.Label'));}
console.log('通过：三态冲击动画、低帧率收尾、复用恢复、心跳、关闭清理、按钮反馈互不覆盖及英文图片标题绑定。');

v.confettiRoot=new N();v.confettiRoot.children=Array.from({length:48},()=>new N());v.play(0);assert.equal(v.confettiRoot.active,false);v.update(.5);assert.equal(v.confettiRoot.active,true);assert(v.confettiRoot.children.every(n=>Number.isFinite(n.position.y)));v.update(7);assert.equal(v.confettiRoot.active,false);v.play(1);v.update(.5);assert.equal(v.confettiRoot.active,false);v.play(0);v.update(.5);v.stop();assert.equal(v.confettiRoot.active,false);assert.equal(a[p.confettiRoot.__id__]._children.length,48);console.log('通过：彩带只在成功播放、有限时长、关闭清理及48个编辑器节点绑定。');

v.play(0);const first=JSON.stringify(v.ribbons);v.update(2);const xs=v.confettiRoot.children.map(n=>n.position.x);assert(Math.max(...xs)-Math.min(...xs)>500,'彩带横向散布至少覆盖500设计像素');const poses=v.confettiRoot.children.map(n=>[n.position.x,n.position.y]);v.update(0);assert.deepEqual(v.confettiRoot.children.map(n=>[n.position.x,n.position.y]),poses,'不逐帧重随机');v.play(0);assert.notEqual(JSON.stringify(v.ribbons),first,'每次成功生成新轨迹');console.log('通过：彩带全宽分散、逐帧连续及每次入场随机化。');

v.rainRoot=new N();v.rainRoot.children=Array.from({length:36},()=>new N());v.node={getComponent:()=>({width:1000,height:1800})};v.play(0);assert.equal(v.viewport.width,1000);assert.equal(v.viewport.height,1800);assert.equal(v.rain.length,36);assert(v.rain[0].x < -470);assert(v.rain[35].x > 470);v.rain[0].birth=0;v.rain[0].duration=4;v.drawRain(0,0);assert.equal(v.rainRoot.children[0].position.y,990-v.viewport.offset);v.update(3.9);assert(v.rainRoot.children[0].position.y < -850);v.update(10);assert.equal(v.rainRoot.active,true);assert(v.rain.every(p=>p.birth+p.duration>v.elapsed));v.play(2);assert.equal(v.rainRoot.active,false);v.play(0);v.stop();assert.equal(v.rainRoot.active,false);assert.equal(a[p.rainRoot.__id__]._children.length,36);console.log('通过：顶部持续重生、实际宽高适配、底部覆盖、失败禁用及关闭清理。');

// 三态扫光分别绑定自己的标题，切换与关闭不会残留上一页光带。
v.failureTitleGlints=[new N(),new N()];
for (const mode of [0,1,2,1]) {
 v.play(mode); v.update(0.9);
 const glints=[v.titleGlint,...v.failureTitleGlints];
 glints.forEach((n,i)=>assert.equal(n.active,i===mode));
 v.update(1); assert(glints.every(n=>!n.active));
 v.stop(); assert(glints.every(n=>!n.active));
}
assert.equal(p.failureTitleGlints.length,2);
p.failureTitleGlints.forEach((r,i)=>{
 const node=a[r.__id__]; assert.equal(node._parent.__id__,p.titles[i+1].__id__);
 const sp=a[node._components.find(c=>a[c.__id__].__type__==='cc.Sprite').__id__];
 const title=a[p.titles[i+1].__id__];
 const titleSp=a[title._components.find(c=>a[c.__id__].__type__==='cc.Sprite').__id__];
 assert.deepEqual(sp._spriteFrame,titleSp._spriteFrame);
 assert(sp._customMaterial?.__uuid__,'扫光必须绑定持久化材质');
});
console.log('通过：复活与失败标题扫光绑定、状态隔离、循环及关闭重置。');

// 主按钮外层呼吸不改写内部按钮点击缩放，并按结算状态隔离扫光。
v.primaryMotions=Array.from({length:4},()=>new N());
v.primaryGlints=Array.from({length:4},()=>new N());
v.primaryMotions.forEach(n=>{n.children=[new N()];v.remember(n);});
for(const mode of [0,1,2]) {
 v.play(mode);v.primaryMotions.forEach(n=>n.children[0].setScale(.96,.96));v.update(2);
 v.primaryMotions.forEach((n,i)=>{
  assert.equal(n.children[0].scale.x,.96);
  assert.equal(v.primaryGlints[i].active,[0,0,1,2][i]===mode);
 });
 v.stop();assert(v.primaryGlints.every(n=>!n.active));
 v.primaryMotions.forEach(n=>assert.equal(n.scale.x,1));
}
assert.equal(p.primaryMotions.length,4);assert.equal(p.primaryGlints.length,4);
p.primaryGlints.forEach(r=>{
 const n=a[r.__id__];const button=a[n._parent.__id__];
 assert(button._components.some(c=>a[c.__id__].__type__==='cc.Button'));
 assert.equal(button._children[0].__id__,r.__id__,'扫光置于文字图标下方');
});
console.log('通过：主按钮呼吸、扫光状态隔离、点击反馈保留及关闭重置。');

// 新品揭晓按真实时间恢复，关闭时清除光波与扫光。
cc.Color=class {constructor(r,g,b,a){Object.assign(this,{r,g,b,a});}};cc.Color.WHITE=new cc.Color(255,255,255,255);
v.unlockReveal=new N();v.revealItem={node:new N(),spriteFrame:null,color:cc.Color.WHITE};
v.revealRays=[new N(),new N()];v.revealWave=new N();v.revealStage=new N();v.revealGlint=new N();v.revealSparks=[new N(),new N()];
v.play(0);assert.equal(v.revealItem.color.r,45);v.update(.6);assert(v.revealWave.active);v.update(.7);assert(v.revealGlint.active);assert.equal(v.revealItem.color.r,255);v.update(2);assert(!v.revealWave.active);v.stop();assert(!v.revealGlint.active);assert(!v.revealWave.active);assert.equal(v.revealItem.node.position.y,25);
assert.equal(p.revealRays.length,1);assert.equal(p.revealSparks.length,0);assert(p.revealGlint&&p.revealItem);
console.log('通过：新品剪影揭晓、光波、物品扫光及关闭恢复。');
