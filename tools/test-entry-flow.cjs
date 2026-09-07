const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 测试坐标只提供生产协调器所需的克隆接口。 */
function vector(x,y,z=0){return {x,y,z,clone(){return vector(this.x,this.y,this.z);}};}
/** 最小单体接口；不模拟 Box2D。 */
function fruit(x,y,enabled=true){return {body:{enabled},node:{position:vector(x,y),getComponent(){return {contentSize:{width:80,height:100}};},setPosition(x,y,z){this.position=typeof x==='object'?vector(x.x,x.y,x.z):vector(x,y,z);}}};}
/** 装载实际入场代码，仅替换引擎边界。 */
function load(file){
    const module={exports:{}};
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    new Function('require','module','exports',output)(name=>name==='cc'?{isValid:()=>true,UITransform:class{}}:load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);
    return module.exports;
}
const base=path.resolve(__dirname,'../assets/app-bundle/app-view/page/game/native/expansion/movement');
const {EntryFlow}=load(base+'/EntryFlow.ts'),{planEntry}=load(base+'/EntryRules.ts');
assert.equal(planEntry(1,-100,100,{left:-375,top:667}).y,847);
assert.equal(planEntry(2,-100,100,{left:-375,top:667}).x,-555);
assert.equal(planEntry(1,-10000,100,{left:-375,top:667}).duration,1.2);
assert.equal(planEntry(1,740,100,{left:-375,top:667}).duration,0.25);
const entry=new EntryFlow(),first=fruit(0,0),second=fruit(100,100,false);
entry.begin([first,second],1,{left:-375,top:667});
assert.equal(entry.busy,true);assert.equal(first.body.enabled,false);
assert.equal(first.node.position.y-50,747,'最低边缘在屏幕上方八十像素');
assert.equal(entry.tick(0.2),false);assert.ok(first.node.position.y>0&&first.node.position.y<797);
assert.equal(entry.tick(2),true);assert.equal(entry.busy,false);
assert.equal(first.node.position.y,0);assert.equal(first.body.enabled,true);assert.equal(second.body.enabled,false);
entry.begin([first],2,{left:-375,top:667});assert.equal(first.node.position.x+40,-455);
entry.cancel();assert.equal(first.node.position.x,0);assert.equal(first.body.enabled,true);assert.equal(entry.busy,false);
entry.begin([],1,{left:-375,top:667});assert.equal(entry.tick(1),false);
console.log('通过：入场方向、屏幕外边距、时长限制、缓动推进、碰撞状态恢复、中断和空关处理。');
