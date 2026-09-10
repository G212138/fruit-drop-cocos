const assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const base='assets/app-bundle/app-view/page/game/native/expansion/';
const cc={_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},Component:class{}};
/** 装载真实组件及规则，只替代引擎和无关协调器。 */
function load(file){
    const module={exports:{}};
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
    new Function('require','module','exports',output)(name=>name==='cc'?cc:new Proxy({},{get:()=>class{}}),module,module.exports);
    return module.exports;
}
const {LockWallView}=load(base+'reward/LockWallView.ts');
const {GameBoard}=load(base+'board/GameBoard.ts');
const {FloorFailureRules}=load(base+'failure/FloorFailureRules.ts');
const lock=new LockWallView();lock.body={enabled:true};lock.visual={active:true};lock.button={interactable:true};
const board=new GameBoard();board.lockWallRoot={getComponent:()=>lock};board.playing=true;board.entry={busy:false};board.failure=new FloorFailureRules();
assert.equal(board.floorThreshold,4);
assert.equal(board.expandSlot(),true);
assert.equal(lock.body.enabled,false);assert.equal(lock.visual.active,false);assert.equal(lock.button.interactable,false);
assert.equal(board.floorThreshold,5);assert.equal(board.expandSlot(),false,'同一局只能扩槽一次');
const fruits=Array.from({length:5},(_,i)=>({id:String(i),kind:i+1,y:-300-i*30,touchedFloor:true,removing:false,settled:true}));
assert.equal(new FloorFailureRules().losesOnContact(fruits.slice(0,4),'0','1',board.floorThreshold),false);
assert.equal(new FloorFailureRules().losesOnContact(fruits,'0','1',board.floorThreshold),true);
const next=new LockWallView();assert.equal(next.unlocked,false,'下一局新预制体必须重新锁定');
console.log('通过：真实棋盘扩槽一次性、锁墙物理与图片同步、四/五个判负边界、重开状态。');
