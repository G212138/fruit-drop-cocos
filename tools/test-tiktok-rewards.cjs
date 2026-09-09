const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const cache = {};
/** 加载真实 TypeScript 业务模块，仅替换平台 SDK，不替换奖励逻辑。 */
function load(file) {
    file = path.resolve(file);
    if (cache[file]) return cache[file];
    const exports = cache[file] = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
    }).outputText;
    new Function('exports', 'require', code)(exports, name => load(path.resolve(path.dirname(file), name + '.ts')));
    return exports;
}
const root = 'assets/app-builtin/app-model/expansion/';
const { TikTokRewardProvider } = load(root + 'platform/TikTokRewardProvider.ts');
const { RewardGate } = load(root + 'RewardGate.ts');
/** 记录 SDK 广告实例、独立广告位与回调解绑。 */
function mock() {
    const instances = [];
    return {
        instances,
        api: { canIUse: () => true, createRewardedVideoAd({ adUnitId }) {
            const ad = { adUnitId, show: () => Promise.resolve(),
                onClose(fn) { this.close = fn; }, offClose(fn) { assert.equal(fn, this.close); this.cleanedClose = true; },
                onError(fn) { this.error = fn; }, offError(fn) { assert.equal(fn, this.error); this.cleanedError = true; }
            };
            instances.push(ad);
            return ad;
        } }
    };
}
/** 验证广告来源、展示不发奖、取消、异常、重复回调、跨局及广告位分流。 */
async function main() {
    const m = mock();
    const provider = new TikTokRewardProvider(() => m.api);
    const gate = new RewardGate(provider, false);
    let settled = false;
    const first = gate.request('eliminate').then(value => { settled = true; return value; });
    await Promise.resolve();
    assert.equal(settled, false, 'show resolve 不等于完整观看');
    assert.equal(m.instances[0].adUnitId, 'ad7683069395916933127');
    assert.equal(await gate.request('shuffle'), 'busy');
    m.instances[0].close({ isEnded: false });
    assert.equal(await first, 'cancelled');
    assert.ok(m.instances[0].cleanedClose && m.instances[0].cleanedError);
    const second = gate.request('shuffle');
    assert.equal(m.instances[1].adUnitId, 'ad7683068205057099783');
    m.instances[1].close({ isEnded: true });
    m.instances[1].close({ isEnded: true });
    m.instances[1].error();
    assert.equal(await second, 'rewarded');
    const old = gate.request('eliminate');
    gate.invalidate();
    assert.equal(await gate.request('shuffle'), 'unavailable', '旧局全屏广告尚未结束不能叠加广告');
    m.instances[2].close({ isEnded: true });
    assert.equal(await old, 'stale');
    const failed = gate.request('eliminate');
    m.instances[3].error();
    assert.equal(await failed, 'failed');
    const missing = gate.request('shuffle');
    m.instances[4].close(undefined);
    assert.equal(await missing, 'cancelled');
    for (const placement of ['revive', 'expand-slot', 'prop']) assert.equal(await gate.request(placement), 'unavailable');
    assert.equal(await new RewardGate(new TikTokRewardProvider(() => null), false).request('shuffle'), 'unavailable');
    m.api.createRewardedVideoAd = () => { throw Error('create failed'); };
    assert.equal(await gate.request('shuffle'), 'failed');
    console.log('TikTok 激励广告测试通过：用途分流、完整观看、取消、失败、清理、重复回调与跨局保护');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
