const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const directory=path.resolve('assets/app-bundle/app-view/page/game/native/expansion/props');
let stored=null,writeFails=false;
/** 加载纯业务与库存，隔离真实用户存档。 */
function load(name){const mod={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path.join(directory,name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(p=>p==='cc'?{sys:{localStorage:{getItem:()=>stored,setItem:(k,v)=>{if(writeFails)throw Error('full');stored=v;}}}}:load(p.replace('./','')),mod,mod.exports);return mod.exports;}
const {selectPropPair,selectShuffleTargets}=load('PropRules');
const fruit={id:'a',kind:1,y:0,touchedFloor:true,unavailable:false,resident:false,blackHole:false};
assert.deepEqual(selectPropPair([fruit,{...fruit,id:'b',y:-20},{...fruit,id:'c',y:100,touchedFloor:false}]),['a','b'],'优先底部同类');
assert.deepEqual(selectPropPair([fruit,{...fruit,id:'b',y:200,touchedFloor:false},{...fruit,id:'c',y:100,touchedFloor:false}]),['a','c'],'上方同类取最低');
assert.equal(selectPropPair([{...fruit,kind:2}, {...fruit,id:'b',y:-20},{...fruit,id:'c',y:-30}]),null,'最高水果无同类时不擅自选下一颗');
assert.equal(selectPropPair([fruit,{...fruit,id:'b',resident:true}]),null,'不选黑洞容器成员');
assert.deepEqual(selectShuffleTargets([fruit,{...fruit,id:'b',touchedFloor:false},{...fruit,id:'c',touchedFloor:false,blackHole:true}]),['b']);
const {PropInventory}=load('PropInventory');const stock=new PropInventory();assert.equal(stock.count('shuffle'),2);assert.equal(stock.consume('shuffle'),true);assert.equal(new PropInventory().count('shuffle'),1);
writeFails=true;assert.equal(stock.consume('shuffle'),false);assert.equal(stock.count('shuffle'),1);writeFails=false;
stock.consume('shuffle');assert.equal(stock.consume('shuffle'),false);assert.equal(stock.grant('shuffle'),true);assert.equal(stock.count('shuffle'),1);
stored='bad-json';assert.equal(new PropInventory().count('eliminate'),0);
console.log('通过：道具目标优先级、黑洞排除、初始库存、持久化、零库存与保存失败。');
