const assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const app={controller:{settings:{}},store:{game:{phase:'lost'}},manager:{ui:{show(){}}}};
const cc={_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},isValid:node=>!node.destroyed};
const exportsObject={};
const code=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/PageGame.ts','utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
/** 装载真实页面请求流程，广告与框架仅提供可控结果边界。 */
new Function('require','exports',code)(name=>{
    if(name.endsWith('/ResultStrings'))return {resultText:(lang,key)=>key};
    if(name.endsWith('/GameLanguage'))return {GameLanguage:{current:'zh'}};
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
    const actual=new exportsObject.PageGame();actual.node={};actual.ended=true;actual.levelNumber=12;
    actual.board={canRevive:true};app.store.game.remaining=98;
    const scheduled=[],loaded=[],shown=[],hidden=[];
    actual.scheduleOnce=fn=>scheduled.push(fn);
    app.manager.ui.load=name=>loaded.push(name);
    app.manager.ui.show=data=>shown.push(data);
    app.manager.ui.hide=data=>hidden.push(data.name);
    actual.prepareResult(actual.generation);assert.deepEqual(loaded,[]);scheduled.shift()();assert.deepEqual(loaded,['PopResult']);
    actual.prepareResult(actual.generation);actual.generation++;scheduled.shift()();assert.equal(loaded.length,1);
    actual.showResult();const result=shown.pop();assert.equal(result.name,'PopResult');assert.equal(result.data.remaining,98);assert.equal(result.data.isCurrent(),true);
    actual.ended=false;assert.equal(result.data.isCurrent(),false);actual.ended=true;
    actual.generation++;assert.equal(result.data.isCurrent(),false);assert.equal(result.onError(),undefined);
    actual.board=null;actual.collectionFeedback={clear(){}};actual.settingsController={end(){}};
    actual.releaseChildren();assert.deepEqual(hidden,['PopResult']);
    actual.releaseChildren();assert.deepEqual(hidden,['PopResult'],'不重复关闭不存在的弹窗');
    actual.showResult();shown.pop().onHide();actual.releaseChildren();assert.deepEqual(hidden,['PopResult'],'结算主动关闭后不再请求隐藏');
    console.log('通过：开局后延迟加载、旧代次取消、实际剩余数、失效显示/重试拦截及退出隐藏。');
    console.log('通过：真实页面取消/失败不发奖、成功顺序、跨页结果失效与资格门禁。');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
