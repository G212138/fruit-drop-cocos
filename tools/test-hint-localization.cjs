const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
function compile(path,imports){const e={};const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;new Function('exports','require',code)(e,imports);return e;}
const catalog=compile('assets/app-builtin/app-model/expansion/LanguageCatalog.ts');
let locale='en';const listeners=new Set();const language={text:key=>catalog.languageText(locale,key),subscribe:f=>listeners.add(f),unsubscribe:f=>listeners.delete(f)};
class Component {unscheduleAllCallbacks(){} scheduleOnce(){}}
const cc={Component,Label:class{},Sprite:class{},SpriteFrame:class{},Vec3:class{},Tween:{stopAllByTarget(){}},tween:()=>({to(){return this},start(){return this}}),_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};
const {LevelHintView}=compile('assets/app-bundle/app-view/page/game/native/expansion/hint/LevelHintView.ts',n=>n==='cc'?cc:n.endsWith('GameLanguage')?{GameLanguage:language}:{});
const v=new LevelHintView();v.node={active:false,setScale(){}};v.caption={string:''};v.picture={};v.frames=[0,1,2,3,4];const keys=['hintVertical','hintHorizontal','hintHidden','hintIce','hintBlackHole'];
for(locale of ['en','zh','ja','id','th','vi','ms','fil'])for(let k=0;k<5;k++){v.play(k);assert.equal(v.caption.string,catalog.languageText(locale,keys[k]));assert.equal(v.picture.spriteFrame,k);assert.equal(v.busy,true);}
v.onEnable();assert.equal(listeners.size,1);locale='ja';for(const f of listeners)f();assert.equal(v.caption.string,catalog.languageText('ja','hintBlackHole'));v.onDisable();assert.equal(listeners.size,0);v.stop();assert.equal(v.busy,false);
for(const p of ['assets/app-bundle/app-view/page/game/resources/prefabs/LevelHintView.prefab','assets/app-bundle/app-view/page/game/native/PageGame.prefab']){const a=JSON.parse(fs.readFileSync(p));const v=a.find(c=>c.picture&&c.frames&&c.caption);assert.ok(v,p);const l=a[v.caption.__id__];assert.equal(l.__type__,'cc.Label');assert.equal(l._isSystemFontUsed,true);assert.equal(l._enableWrapText,true);assert.equal(l._overflow,2);assert.ok(!a.some(c=>c.__type__==='cc.Node'&&c._name==='HiddenText'));}
console.log('通过：八语言×五机制提示、显示中切换语言、订阅清理、两处预制体系统字体和自适应绑定。');
