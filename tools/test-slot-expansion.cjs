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

/** 用真实地形轮廓验证组件布局平移、缩放和水果父节点变化后仍正确读区。 */
cc.UITransform = class {};
cc.PolygonCollider2D = class {};
cc.Vec3 = class { constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} };
const prefab=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/page/game/native/PageGame.prefab','utf8'));
const floorNode=prefab.find(n=>n.__type__==='cc.Node'&&n._name==='Floor');
const polygon=floorNode._components.map(ref=>prefab[ref.__id__]).find(c=>c.__type__==='cc.PolygonCollider2D');
const shape={points:polygon._points,offset:polygon._offset};
for(const [dx,dy,scale] of [[0,0,1],[310,820,0.65],[-200,-300,1.4]]){
    const toWorld=p=>({x:dx+p.x*scale,y:dy+p.y*scale,z:0});
    const floorTransform={convertToNodeSpaceAR:p=>({x:(p.x-dx)/scale,y:(p.y-dy)/scale,z:0})};
    const lockTransform={width:163,anchorX:0.5,convertToWorldSpaceAR:toWorld};
    board.node={getChildByName:name=>name==='Floor'?{getComponent:type=>type===cc.UITransform?floorTransform:shape}:null};
    board.lockWallRoot={getComponent:type=>type===cc.UITransform?lockTransform:{unlocked:false}};
    const live=Array.from({length:4},(_,i)=>({node:{worldPosition:toWorld({x:0,y:i*80})},
        getFloorSnapshot:()=>({id:String(i),kind:i+1,x:9999,y:9999,released:true,removing:false,
            contacts:[String(i-1),String(i+1)],touchedFloor:false,settled:true})}));
    board.spawner={getLive:()=>live};
    assert.equal(board.checkLayoutFailure(),true,'世界位置转换到地形坐标，不依赖水果局部原点');
    live[3].getFloorSnapshot=()=>({...live[2].getFloorSnapshot(),id:'3',kind:4,contacts:[]});
    live[2].getFloorSnapshot=()=>({id:'2',kind:3,released:true,removing:false,contacts:['1']});
    assert.equal(board.checkLayoutFailure(),false,'第四颗未接触时不能判负');
}
console.log('通过：真实地形轮廓、布局平移缩放、不同父坐标系及第四颗未接触保护。');
