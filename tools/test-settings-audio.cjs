const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 装载真实业务代码，仅注入引擎及平台边界。 */
function load(file, imports) {
    const module = {exports:{}};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
    new Function('require','module','exports',code)(imports,module,module.exports);
    return module.exports;
}
const {GamePreferences} = load('assets/app-builtin/app-model/expansion/GamePreferences.ts',()=>{});
const preferences = new GamePreferences({getItem:()=>null,setItem:()=>{}});
const settings = {GameSettings:{current:preferences}};
const calls = [];
let onPlay;
const sound = {setEffectMute:value=>calls.push(['effect',value]),setMusicMute:value=>calls.push(['music',value]),
    resumeMusic:()=>calls.push(['resume']),pauseMusic:()=>calls.push(['pause']),stopMusic:()=>calls.push(['stop']),
    playMusic:options=>{onPlay=options.onPlay;calls.push(['play',options.name,options.bundle]);}};
const {SettingsController} = load('assets/app-builtin/app-controller/SettingsController.ts',name =>
    name.includes('BaseController') ? {default:()=>class{}} : name.endsWith('/app') ? {app:{manager:{sound}}} : settings);
const controller = new SettingsController();
preferences.toggle('music');
controller.begin();
assert.ok(calls.some(call=>call[0]==='music' && call[1]===true));
assert.ok(calls.some(call=>call[0]==='pause'));
assert.ok(!calls.some(call=>call[0]==='resume'));
calls.length=0;
controller.toggle('music');
assert.ok(calls.some(call=>call[0]==='resume'));
assert.equal(preferences.snapshot.sound,true);
controller.toggle('sound');
assert.equal(preferences.snapshot.sound,false);
assert.ok(calls.some(call=>call[0]==='effect' && call[1]===true));
controller.end();calls.length=0;onPlay();
assert.deepEqual(calls,[['stop']],'退出后迟到的音频完成回调不能重新播放');
const cc = {_decorator:{ccclass:()=>value=>value,property:()=>()=>{}},Component:class{},sp:{Skeleton:class{}},Tween:{stopAllByTarget(){}},Vec3:class{}};
const {IceFruitView} = load('assets/app-bundle/app-view/page/game/native/expansion/ice/IceFruitView.ts',name=>name==='cc'?cc:settings);
/** 骨骼和音源只记录调用，不模拟实际听感。 */
function breakIce() {
    let played=0;
    const view=new IceFruitView();
    view.countLabel={node:{active:true,setScale(){}}};
    view.skeleton={setAnimation(){},setCompleteListener(){}};
    view.audio={playOneShot(){played++;}};
    view.breakClip={};view.scheduleOnce=()=>{};
    view.updateLayers(0);
    return played;
}
assert.equal(breakIce(),0,'关闭音效时碎冰仍播放动画但不得播放声音');
preferences.toggle('sound');
assert.equal(breakIce(),1);
console.log('通过：背景音乐独立开关、音效静音、异步退出保护及真实碎冰音效门禁。');
