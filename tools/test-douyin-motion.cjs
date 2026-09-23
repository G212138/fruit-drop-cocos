const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
function load(api){const exports={};new Function('require','exports',ts.transpileModule(fs.readFileSync('assets/app-builtin/app-controller/expansion/DouyinMotion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({getDouyinGame:()=>api}),exports);return exports.DouyinMotion;}
let sample,starts=0,stops=0,hits=0;
const api={onAccelerometerChange:f=>sample=f,offAccelerometerChange:f=>{assert.equal(f,sample)},startAccelerometer:o=>{starts++;o.success()},stopAccelerometer:()=>stops++};
const motion=load(api),request=()=>hits++;
motion.sync(true,request);motion.sync(true,request);assert.equal(starts,1);
for(let i=0;i<20;i++)sample({x:i%2*.1,y:0,z:1});assert.equal(hits,0);
sample({x:2,y:0,z:1});sample({x:-2,y:0,z:1});assert.equal(hits,1);
sample({x:2,y:0,z:1});sample({x:-2,y:0,z:1});assert.equal(hits,2,'进行中可持续识别，不等待运动结束');
motion.setBlocked(true);sample({x:2,y:0,z:1});sample({x:-2,y:0,z:1});assert.equal(hits,2);assert(stops>0);
motion.setBlocked(false);motion.sync(true,request);assert.equal(starts,2);motion.sync(false,request);sample({x:3,y:0,z:1});assert.equal(hits,2);
load(null).sync(true,request);load({}).sync(true,request);
let attempts=0;const bad=load({...api,startAccelerometer:o=>{attempts++;o.fail()}});bad.sync(true,request);bad.sync(true,request);assert.equal(attempts,1);
let complete;const pending=load({...api,startAccelerometer:o=>complete=o.success});pending.sync(true,request);pending.stop();const before=stops;complete();assert(stops>before,'启动期间退出，迟到成功仍停止传感器');
console.log('通过：抖音传感器连续摇晃、轻抖过滤、后台广告阻断、退出清理、接口缺失与失败降级、异步启动竞态。');
