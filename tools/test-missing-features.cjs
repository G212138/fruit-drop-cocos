const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 装载真实纯模型；存储在内存中，不改玩家进度。 */
function load(file){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;new Function('require','module','exports',code)(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);return module.exports;}
const {ThemeProgress}=load('assets/app-builtin/app-model/expansion/ThemeProgress.ts');
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
const theme=new ThemeProgress(storage);
assert.equal(theme.select(2,30),false);assert.equal(values.size,0);
assert.equal(theme.unlocked(2,0,1),false);assert.equal(theme.unlocked(2,0,2),true);
assert.equal(theme.unlocked(2,29,30),false);assert.equal(theme.unlocked(2,29,31),true);
assert.equal(theme.unlocked(1,29,1),true);assert.equal(theme.unlocked(1,30,99),false);
assert.equal(theme.select(2,31),true);assert.equal(new ThemeProgress(storage).resolve(31),2);
assert.equal(new ThemeProgress(storage).resolve(1),1,'异常进度不能越过主题门槛');
assert.equal(theme.select(1,31),true);assert.equal(new ThemeProgress(storage).resolve(31),1);
const broken=new ThemeProgress({getItem:()=>'{',setItem(){throw Error('disk');}});
assert.equal(broken.selected,1);assert.ok(broken.warning);broken.select(2,31);assert.equal(broken.selected,2);assert.ok(broken.warning);
const {findEditorPlacement}=load('assets/app-builtin/app-model/expansion/level/EditorPlacement.ts');
for(const mode of [1,2]){
 const existing=[];
 for(let i=0;i<120;i++){
  const [x,y]=findEditorPlacement(0,0,45,mode,existing);
  assert.ok(x>=(mode===2?-2000:-300)&&x<=300&&y>=-760&&(mode===1||y<=0));
  assert.ok(existing.every(item=>Math.hypot(item.x-x,item.y-y)>98));existing.push({x,y,radius:45});
 }
 // 删除后重加应复用空位；不依赖水果数量计算坐标。
 const removed=existing.shift();assert.deepEqual(findEditorPlacement(removed.x,removed.y,45,mode,existing),[removed.x,removed.y]);
}
const {readLevelDocument}=load('assets/app-builtin/app-model/expansion/level/LevelDocument.ts');
const old=readLevelDocument({level:1,m:1,d:[{n:'1',p:[0,0],b:true},{n:'2',p:[100,0],b:'t'},{n:'3',p:[200,0],BlackHoleID:8}]});
assert.deepEqual(old.d.map(x=>x.BlackHoleID),[9,10,8]);assert.ok(old.d.every(x=>x.BlackHole===1));assert.ok(old.d.every(x=>x.b===undefined));
assert.throws(()=>readLevelDocument({level:1,m:1,d:[{n:'1',p:[0,0],b:'bad'}]}));
/** 检查真实序列化资产；禁止把空绑定的组件标为完成。 */
const base='assets/app-bundle/app-view/';
const game=JSON.parse(fs.readFileSync(base+'page/game/native/PageGame.prefab'));
const themeView=game.find(x=>x.targets&&x.frames);assert.equal(themeView.targets.length,1);assert.ok(game.some(x=>x.fallback?.__uuid__ && x.target), '地块由独立TerrainView维护');assert.ok(themeView.targets.every(x=>x&&game[x.__id__].__type__==='cc.Sprite'));assert.equal(themeView.frames.length,10);
const spawner=game.find(x=>x.dessertPrefabs);assert.equal(spawner.dessertPrefabs.length,30);
const source=JSON.parse(fs.readFileSync('tools/theme-source.json'));
for(const definition of source.desserts){const prefab=JSON.parse(fs.readFileSync(base+'page/game/resources/prefabs/dessert/Dessert'+String(definition.kind).padStart(2,'0')+'.prefab'));const shape=prefab.find(x=>x.__type__==='cc.PolygonCollider2D');assert.deepEqual(shape._points.map(p=>[p.x,p.y]),definition.points);assert.ok(prefab.some(x=>x.__type__==='cc.UIOpacity'));assert.equal(prefab.find(x=>x.__type__==='cc.RigidBody2D').bullet,true);}
const home=JSON.parse(fs.readFileSync(base+'page/home/native/PageHome.prefab'));const panel=home.find(x=>x.icons&&x.tabs);assert.equal(panel.icons.length,30);assert.equal(panel.frames.length,60);assert.equal(panel.tabs.length,4);assert.ok(home.find(x=>x.themePanel&&x.settingsPanel&&x.levelLabel));
const result=game.find(x=>x.successAudio);assert.ok(game[result.successAudio.__id__]._clip);
const editor=JSON.parse(fs.readFileSync(base+'page/editor/native/PageEditor.prefab'));assert.equal(editor.find(x=>x.dessertFrames).dessertFrames.length,30);
console.log('通过：主题门槛/图鉴/存档坏档、120颗连续防重叠放置、旧黑洞别名、30套甜品轮廓及界面资产绑定。');

for(const name of ['LockWallView','FruitBagView']){
 const asset=JSON.parse(fs.readFileSync(base+'page/game/resources/prefabs/'+name+'.prefab'));
 const parts=asset.filter(x=>x.fruitFrame&&x.dessertFrame&&x.target);
 assert.equal(parts.length,name==='LockWallView'?1:2);
 for(const part of parts) assert.equal(asset[part.target.__id__].__type__,'cc.Sprite');
}
console.log('通过：锁墙和袋身使用内部主题绑定。');

const hapticSettings={current:{snapshot:{vibrate:true}}},hapticExports={};let now=0,calls=0;
const hapticCode=ts.transpileModule(fs.readFileSync('assets/app-builtin/app-controller/expansion/GameHaptics.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
new Function('require','exports','navigator','Date',hapticCode)(()=>({GameSettings:hapticSettings}),hapticExports,{}, {now:()=>now});
const haptics=hapticExports.GameHaptics;assert.equal(haptics.supported,false);assert.equal(haptics.impact(),false);
haptics.register(duration=>{assert.equal(duration,20);calls++;return true;});assert.equal(haptics.impact(),true);assert.equal(haptics.impact(),false);assert.equal(calls,1);
now=101;hapticSettings.current.snapshot.vibrate=false;assert.equal(haptics.impact(),false);assert.equal(calls,1);
hapticSettings.current.snapshot.vibrate=true;assert.equal(haptics.impact(),true);assert.equal(calls,2);
haptics.register(()=>{throw Error('device');});now=250;assert.equal(haptics.impact(),false);
haptics.register(null);assert.equal(haptics.supported,false);
console.log('通过：震动无能力降级、设置门禁、20毫秒强度时长、100毫秒节流及平台异常。');
