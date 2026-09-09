const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const values = new Map();
const sys = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } };
const game = { paused: false, isPaused() { return this.paused; }, pause() { this.paused = true; }, resume() { this.paused = false; } };
const modules = {};
/** 使用真实业务模块和隔离存储；平台对象仅用于验证回调契约。 */
function load(relative) {
    const file = path.resolve(relative);
    if (modules[file]) return modules[file];
    const exports = modules[file] = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    new Function('exports', 'require', code)(exports, name => name === 'cc' ? { sys, game } : load(path.resolve(path.dirname(file), name + '.ts')));
    return exports;
}
const root = 'assets/app-builtin/app-model/expansion/platform/';
/** 验证取码、会话校验、任务资格与本地幂等奖励，明确不是真机平台验收。 */
async function main() {
    const { TikTokLogin } = load(root + 'TikTokLogin.ts');
    let calls = 0;
    const api = { canIUse: () => true, login: ({ success }) => { calls++; success({ code: 'test-code' }); } };
    const login = new TikTokLogin(() => api);
    assert.equal(await login.login(), null);
    assert.equal(calls, 0, '没有后端不能伪造登录或浪费一次性 code');
    let exchanges = 0;
    login.configure(async (code, clientKey) => {
        exchanges++;
        assert.equal(code, 'test-code');
        assert.equal(clientKey, 'mg1swkarpsswyb0z');
        return { playerId: 'player-test', sessionToken: 'session-test', expiresAt: Date.now() + 60000 };
    });
    const first = login.login(), concurrent = login.login();
    assert.equal(first, concurrent);
    assert.equal((await first).playerId, 'player-test');
    await login.login();
    assert.equal(exchanges, 1);
    const invalid = new TikTokLogin(() => api);
    invalid.configure(async () => ({ playerId: 'x', sessionToken: 'x', expiresAt: 0 }));
    assert.equal(await invalid.login(), null);
    const failed = new TikTokLogin(() => api);
    failed.configure(() => { throw Error('network'); });
    assert.equal(await failed.login(), null);

    const { TikTokRevisit } = load(root + 'TikTokRevisit.ts');
    let eligible = false;
    api.addShortcut = ({ success }) => success();
    api.getShortcutMissionReward = ({ success }) => success({ canReceiveReward: eligible });
    const missions = new TikTokRevisit(() => !!login.current, () => api);
    assert.equal(await missions.open('shortcut'), 'opened');
    assert.equal(await missions.check('shortcut'), 'not-eligible', '导航成功不是奖励资格');
    eligible = true;
    assert.equal(await missions.check('shortcut'), 'eligible');
    assert.equal(await missions.open('profile'), 'unavailable');
    assert.equal(await new TikTokRevisit(() => false, () => api).check('shortcut'), 'unavailable');
    api.canIUse = () => false;
    assert.equal(await missions.open('shortcut'), 'unavailable');

    const { PlatformStorage } = load(root + 'PlatformStorage.ts');
    PlatformStorage.setItem('browser-test', 'saved');
    assert.equal(PlatformStorage.getItem('browser-test'), 'saved');
    const native = new Map();
    global.TTMinis = { game: { canIUse: () => true, getStorageSync: key => native.get(key), setStorageSync: (key, value) => native.set(key, value) } };
    PlatformStorage.setItem('native-test', 'saved');
    assert.equal(PlatformStorage.getItem('native-test'), 'saved');
    assert.equal(values.has('native-test'), false);
    const { TikTokMissionRewards } = load(root + 'TikTokMissionRewards.ts');
    assert.equal(TikTokMissionRewards.grant('shortcut', 'player-test'), 'granted');
    assert.equal(TikTokMissionRewards.grant('shortcut', 'player-test'), 'already');
    assert.equal(JSON.parse(native.get('fruit-drop.props.v1')).eliminate, 3);
    const { PropInventory } = load('assets/app-bundle/app-view/page/game/native/expansion/props/PropInventory.ts');
    const inventory = new PropInventory();
    assert.equal(inventory.consume('eliminate'), true);
    assert.equal(TikTokMissionRewards.grant('shortcut', 'player-test'), 'already', '消费道具不能擦除领取记录');
    assert.equal(TikTokMissionRewards.grant('profile', 'player-test'), 'granted');
    inventory.refresh();
    assert.equal(inventory.count('shuffle'), 3);
    global.TTMinis.game.setStorageSync = () => { throw Error('full'); };
    assert.equal(TikTokMissionRewards.grant('profile', 'another-player'), 'failed');
    assert.throws(() => PlatformStorage.setItem('native-test', 'overwrite'));
    assert.equal(values.has('native-test'), false, '原生存储失败不能偷偷写到浏览器另一份档案');
    let hidden, shown, adClose;
    Object.assign(global.TTMinis.game, {
        onHide: callback => { hidden = callback; }, onShow: callback => { shown = callback; },
        createRewardedVideoAd: () => ({ show: () => Promise.resolve(), onClose: callback => { adClose = callback; }, offClose() {}, onError() {}, offError() {} })
    });
    const { TikTokLifecycle } = load('assets/app-builtin/app-controller/expansion/TikTokLifecycle.ts');
    const { TikTokRewardProvider } = load(root + 'TikTokRewardProvider.ts');
    TikTokLifecycle.install();
    hidden(); assert.equal(game.paused, true);
    shown(); assert.equal(game.paused, false);
    game.pause(); hidden(); shown(); assert.equal(game.paused, true, '不能恢复其他业务的暂停'); game.resume();
    const adRequest = TikTokRewardProvider.shared.show({ id: 'lifecycle', placement: 'shuffle' });
    assert.equal(game.paused, true);
    hidden(); adClose({ isEnded: true }); await adRequest;
    assert.equal(game.paused, true, '广告结束但仍在后台时不能恢复');
    shown(); assert.equal(game.paused, false);
    delete global.TTMinis;
    console.log('TikTok 平台测试通过：登录合并、会话有效期、后端失败、任务资格、原生存储、奖励幂等与后台/广告暂停');
}
main().catch(error => { delete global.TTMinis; console.error(error); process.exitCode = 1; });
