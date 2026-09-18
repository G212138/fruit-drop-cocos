const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
function load(file){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;new Function('require','module','exports',code)(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);return module.exports;}
const base=path.resolve('assets/app-bundle/app-view/page/game/native/expansion/failure');
const {slotCapacity}=load(base+'/SlotCapacityRules.ts');
const {FloorFailureRules}=load(base+'/FloorFailureRules.ts');
const {FloorWarningRules}=load(base+'/FloorWarningRules.ts');
const region={left:-50,right:50,bottom:-650,top:0};
const stack=n=>Array.from({length:n},(_,i)=>({id:String(i),kind:i+1,x:0,y:-600+i*85,released:true,touchedFloor:true,removing:false,settled:true,contacts:[String(i-1),String(i+1)]}));
for(let stage=0;stage<=2;stage++){
 const capacity=slotCapacity(stage),failure=new FloorFailureRules(),warning=new FloorWarningRules();
 assert.equal(capacity.failure,4+stage);assert.equal(capacity.warning,3+stage);
 assert.equal(failure.losesOnStack(stack(capacity.failure-1),capacity.failure,region),false);
 assert.equal(failure.losesOnStack(stack(capacity.failure),capacity.failure,region),true);
 const matching=stack(capacity.failure);matching[1].kind=matching[0].kind;
 assert.equal(failure.losesOnStack(matching,capacity.failure,region),false,'可消除的真实接触优先');
 const separated=stack(capacity.failure).map(f=>({...f,contacts:[]}));
 assert.equal(failure.losesOnStack(separated,capacity.failure,region),false,'不连续的物品不能累计判负');
 assert.equal(warning.tick(stack(capacity.warning-1),1,stage),'clear');
 assert.equal(warning.tick(stack(capacity.warning),0,stage),'wait');
 assert.equal(warning.tick(stack(capacity.warning),1,stage),'flash');
}
assert.equal(new FloorFailureRules().losesOnStack(stack(5),slotCapacity(2).failure,region),false,'第二格打开后五个不再判负');
assert.deepEqual(slotCapacity(NaN),slotCapacity(0));assert.deepEqual(slotCapacity(99),slotCapacity(2));
console.log('通过：0/1/2格解锁对应4/5/6判负、3/4/5预警，消除优先，非连续堆叠不判负。');
