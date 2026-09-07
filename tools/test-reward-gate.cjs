const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const result={};
const output=ts.transpileModule(fs.readFileSync('assets/app-builtin/app-model/expansion/RewardGate.ts','utf8'),{
    compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
new Function('exports',output)(result);
const {RewardGate}=result;
/** 同步生成测试响应，保留真实门禁校验。 */
function provider(status,source='development',extra={}) {
    return {show:async request=>({...request,status,source,...extra})};
}
/** 覆盖平台边界、并发和旧请求不会清除新请求的情况。 */
async function main() {
    assert.equal(await new RewardGate(provider('completed'),true).request('expand-slot'),'rewarded');
    assert.equal(await new RewardGate(provider('completed'),false).request('expand-slot'),'unavailable');
    assert.equal(await new RewardGate(provider('completed','platform'),false).request('expand-slot'),'rewarded');
    for(const status of ['cancelled','failed','unavailable'])assert.equal(await new RewardGate(provider(status),true).request('expand-slot'),status);
    for(const extra of [{id:'wrong'},{placement:'revive'},{source:'unknown'},{status:'unknown'}]) {
        assert.equal(await new RewardGate(provider('completed','platform',extra),true).request('expand-slot'),'failed');
    }
    assert.equal(await new RewardGate({show:async()=>{throw new Error('SDK失败');}},false).request('expand-slot'),'failed');
    const waiting=[];
    const gate=new RewardGate({show:request=>new Promise(resolve=>waiting.push({request,resolve}))},true);
    const first=gate.request('expand-slot');
    assert.equal(await gate.request('expand-slot'),'busy');
    gate.invalidate();
    const second=gate.request('expand-slot');
    waiting[0].resolve({...waiting[0].request,status:'completed',source:'development'});
    assert.equal(await first,'stale');
    assert.equal(await gate.request('expand-slot'),'busy','旧请求结束不能清除新请求门禁');
    waiting[1].resolve({...waiting[1].request,status:'cancelled',source:'development'});
    assert.equal(await second,'cancelled');
    console.log('通过：广告结果、来源限制、用途编号校验、并发、取消、失败及跨局过期保护。');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
