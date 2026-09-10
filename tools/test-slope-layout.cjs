const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const dir = 'assets/app-bundle/app-view/page/game/native/expansion/movement/';
const cc = { UITransform: class {}, PolygonCollider2D: class {}, Vec3: class {
    constructor(x=0,y=0,z=0) { Object.assign(this,{x,y,z}); }
} };
/** 运行真实补位计算，替代引擎坐标转换，不模拟物理求解。 */
function load(name) {
    const module = {exports:{}};
    const code = ts.transpileModule(fs.readFileSync(dir+name+'.ts','utf8'),{
        compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
    }).outputText;
    new Function('require','module','exports',code)(id=>id==='cc'?cc:load('VerticalShiftRules'),module,module.exports);
    return module.exports;
}
const {FruitShift}=load('FruitShift');
const {signedSlopeDistance,planSlopeShift}=load('VerticalShiftRules');
assert.equal(signedSlopeDistance(0,40,90,[{x:-1000,y:0},{x:1000,y:0}]),-50);
assert.equal(planSlopeShift(-50).delta,50);
assert.equal(planSlopeShift(-1),null);
/** 覆盖平板非等比父缩放、图片大于碰撞体以及一开始过近的情况。 */
for (const [sx,sy] of [[1,1],[2,0.5],[0.6,1.4]]) {
    for (const worldY of [50,400]) {
        const root={convertToNodeSpaceAR:p=>({x:(p.x-200)/sx,y:(p.y-100)/sy})};
        const center={x:200,y:100+worldY,z:0};
        const shape={convertToWorldSpaceAR:p=>({x:center.x+p.x,y:center.y+p.y})};
        const visual={...shape,width:80,height:60,anchorX:0.5,anchorY:0.5};
        const fruit={node:{worldPosition:center,parent:{getComponent:()=>root},getComponent:()=>shape},
            visual:{sprite:{node:{getComponent:()=>visual}}},
            collider:{offset:{x:0,y:0},points:[{x:-20,y:-20},{x:20,y:20}],
                get worldAABB(){throw Error('不能读取滞后的物理包围盒');}}};
        const terrain={convertToWorldSpaceAR:p=>({x:p.x+200,y:p.y+100})};
        const polygon={offset:{x:0,y:0},points:[{x:-1000,y:0},{x:1000,y:0}]};
        const floor={getComponent:type=>type===cc.UITransform?terrain:polygon};
        const drop=new FruitShift().safeDrop([fruit],floor);
        // 图片外接半径50，按直径0.8倍留白80，中心最终离地130世界像素。
        assert.ok(Math.abs(drop*sy-(worldY-130))<1e-7);
        assert.equal(Math.sign(planSlopeShift(drop).delta),worldY<130?1:-1);
    }
}
console.log('通过：图片与碰撞大小差异、过近上移、非等比父缩放、物理旧包围盒隔离与边界死区。');
