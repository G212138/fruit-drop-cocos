const assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const app={controller:{settings:{}},store:{game:{phase:'lost'}},manager:{ui:{show(){}}}};
const cc={_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},isValid:node=>!node.destroyed};
const exportsObject={};
const code=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/PageGame.ts','utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
/** 装载真实页面请求流程，广告与框架仅提供可控结果边界。 */
new Function('require','exports',code)(name=>{
    if(name==='cc')return cc;
    if(name==='cc/env')return {DEV:true};
    if(name==='db://app/base/BaseView')return {default:{BindController:()=>class{}}};
    if(name.endsWith('/app/app'))return {app};
    return new Proxy({},{get:()=>class{}});
},exportsObject);
/** 创建失败原局并记录所有奖励副作用。 */
function fixture(){
    app.store.game.phase='lost';
    const page=new exportsObject.PageGame(),calls=[];
    page.node={};page.ended=true;
    page.board={canRevive:true,revive(){calls.push('board');return true;}};
    page.controller={revive(){calls.push('state');app.store.game.phase='playing';return true;}};
    page.hud={};
    page.showResult=message=>calls.push(message);
    return {page,calls};
}
/** 执行取消、失败和迟到结果的页面边界回归。 */
async function run(){
    for(const result of ['cancelled','failed','unavailable']){
        const {page,calls}=fixture();page.rewardGate={request:async placement=>{assert.equal(placement,'revive');return result;}};
        await page.requestRevive();assert.equal(app.store.game.phase,'lost');assert.equal(page.ended,true);
        assert.equal(calls.length,1);assert.equal(calls.includes('board'),false);
    }
    let {page,calls}=fixture();page.rewardGate={request:async()=> 'rewarded'};
    await page.requestRevive();assert.deepEqual(calls,['state','board']);assert.equal(page.ended,false);
    ({page,calls}=fixture());let finish;page.rewardGate={request:()=>new Promise(resolve=>finish=resolve)};
    const pending=page.requestRevive();page.generation++;finish('rewarded');await pending;
    assert.deepEqual(calls,[]);assert.equal(app.store.game.phase,'lost','旧页广告不能复活新页面');
    ({page,calls}=fixture());page.board.canRevive=false;page.rewardGate={request:()=>assert.fail('无资格不请求广告')};
    await page.requestRevive();assert.deepEqual(calls,[]);
    console.log('通过：真实页面取消/失败不发奖、成功顺序、跨页结果失效与资格门禁。');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
