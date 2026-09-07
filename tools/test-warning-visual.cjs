const assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 保存颜色数值，验证恢复原色而不是强行改成白色。 */
class Color {
    /** @param r 红色通道。 @param g 绿色通道。 @param b 蓝色通道。 @param a 透明度。 */
    constructor(r,g,b,a){Object.assign(this,{r,g,b,a});}
    /** 返回独立颜色副本。 */
    clone(){return new Color(this.r,this.g,this.b,this.a);}
}
const tracks=new Map();
const cc={_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},Component:class{},Color,Vec3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},
    isValid:value=>value.valid!==false,Tween:{stopAllByTarget:target=>tracks.delete(target)},
    tween:target=>{const steps=[];const chain={to:(duration,properties,options)=>{steps.push({duration,properties,options});return chain;},call:()=>chain,start:()=>tracks.set(target,steps)};return chain;}};
const out=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/fruit/FruitVisual.ts','utf8'),{
    compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
const result={};new Function('require','exports',out)(()=>cc,result);
const visual=new result.FruitVisual();visual.node={};visual.sprite={color:new Color(120,140,160,200)};
visual.flashWarning();const first=tracks.get(visual.sprite);visual.flashWarning();
assert.equal(tracks.get(visual.sprite),first,'重复提醒不叠加颜色补间');
assert.deepEqual(first[0].properties.color,new Color(255,128,128,255));
visual.sprite.color=new Color(255,128,128,255);
visual.clearWarning();assert.deepEqual(visual.sprite.color,new Color(120,140,160,200));
assert.equal(tracks.has(visual.sprite),false);
visual.flashWarning();visual.playRemoval(()=>{});
assert.equal(tracks.has(visual.sprite),false,'消除必须取消危险颜色补间');
assert.equal(tracks.has(visual.node),true,'消除缩放仍然独立执行');
visual.onDestroy();assert.equal(tracks.size,0);
console.log('通过：原色恢复、重复闪烁保护、颜色与消除补间分离及销毁清理。');
for(const scale of [1,0.5,0]){
    visual.node.scale={x:scale};visual.flashWarning();visual.playReviveRemoval(()=>{});
    const steps=tracks.get(visual.node);
    assert.equal(tracks.has(visual.sprite),false);
    assert.equal(steps[0].duration,0.25);assert.equal(steps[0].options.easing,'sineOut');
    assert.equal(steps[0].properties.scale.x,(scale||1)*1.3);
    assert.equal(steps[1].duration,0.125);assert.equal(steps[1].options.easing,'sineIn');
    assert.equal(steps[1].properties.scale.x,0);
    visual.onDestroy();assert.equal(tracks.size,0);
}
console.log('通过：原版复活消除时长、缓动、相对缩放及黑洞零缩放回退。');
