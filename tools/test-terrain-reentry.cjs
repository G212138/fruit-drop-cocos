const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
for(const name of ['TerrainView','ThemeSprite']){
 const pending=[],entry={file:'cake',id:'cake'};
 const cc={_decorator:{ccclass:()=>x=>x,property:(...args)=>args.length>1?undefined:()=>{}},Component:class{},Sprite:class{},SpriteFrame:class{},UITransform:class{},isValid:x=>!!x&&x.valid!==false};cc.Sprite.SizeMode={CUSTOM:0};
 const code=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 const out={};new Function('require','exports',code)(p=>p==='cc'?cc:p.endsWith('GameTerrain')?{GameTerrain:{entry}}:{TerrainArt:{load:(file,done)=>pending.push(done)}},out);
 const v=new out[name]();v.enabledInHierarchy=true;v.lockPlug=true;v.fallback=v.fruitFrame={default:true};v.target={enabled:true,spriteFrame:v.fallback,node:{name:'Block',getComponent:()=>({setContentSize(){}})}};
 let released=0;const first={decRef(){released++}},second={decRef(){released++}};
 v.onEnable();assert.equal(v.target.enabled,false);pending.shift()(first);assert.equal(v.target.spriteFrame,first);
 for(let i=0;i<3;i++){v.onDisable();assert.equal(released,0);assert.equal(v.target.spriteFrame,first);v.onEnable();assert.equal(pending.length,0);assert.equal(v.target.enabled,true);}
 entry.id=entry.file='ice';v.onDisable();v.onEnable();assert.equal(v.target.enabled,false);pending.shift()(second);assert.equal(released,1);assert.equal(v.target.spriteFrame,second);
 entry.id=entry.file='sand';v.onEnable();v.onDisable();pending.shift()({decRef(){released++}});assert.equal(released,2);assert.equal(v.target.spriteFrame,second);
 v.onEnable();pending.shift()(null);assert.equal(v.target.spriteFrame,v.fallback);assert.equal(v.target.enabled,true);assert.equal(released,3);
 v.onEnable();pending.shift()(first);v.onDestroy();assert.equal(released,4);
 console.log('通过：'+name+' 隐藏重入不重载不回退、换主题才替换、过期回调及销毁释放。');
}
