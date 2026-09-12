const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 装载真实纯规则，保持相邻可消除判定与游戏一致。 */
function load(file){
    const module={exports:{}};
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
    new Function('require','module','exports',output)(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);
    return module.exports;
}
const {FloorWarningRules}=load(path.resolve('assets/app-bundle/app-view/page/game/native/expansion/failure/FloorWarningRules.ts'));
const fruits=Array.from({length:4},(_,i)=>({id:String(i),kind:i+1,y:-300-i*90,released:true,contacts:[String(i-1),String(i+1)],touchedFloor:true,removing:false,settled:true}));
const warning=new FloorWarningRules();
assert.equal(warning.tick(fruits.slice(0,2),2,false),'clear');
assert.equal(warning.tick(fruits.slice(0,3),10,false),'wait','进入危险的首帧不立即闪烁');
assert.equal(warning.tick(fruits.slice(0,3),0.5,false),'wait');
assert.equal(warning.tick(fruits.slice(0,3),0.5,false),'flash');
assert.equal(warning.tick(fruits.slice(0,3),3.5,false),'wait');
assert.equal(warning.tick(fruits.slice(0,3),0.5,false),'flash');
assert.equal(warning.tick(fruits.slice(0,3),0.1,true),'clear','扩槽后三个触底恢复安全');
assert.equal(warning.tick(fruits,0.1,true),'wait');
assert.equal(warning.tick(fruits,1,true),'flash');
const matching=fruits.map(fruit=>({...fruit}));matching[1].kind=matching[0].kind;
assert.equal(warning.tick(matching,1,true),'clear','可消除相邻同类优先取消提醒');
const removing=fruits.map(fruit=>({...fruit}));removing[0].removing=true;
assert.equal(warning.tick(removing,1,true),'clear');
warning.reset();assert.equal(warning.tick(fruits,100,true),'wait');
assert.equal(warning.tick(fruits,100,true),'flash','大帧只发出一次提醒');
console.log('通过：危险数量、首闪延时、重复间隔、扩槽边界、可消除抑制、消除计数与重置。');
