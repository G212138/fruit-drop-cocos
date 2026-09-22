const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const base = 'assets/app-bundle/app-view/page/game/';
const data = JSON.parse(fs.readFileSync(base + 'resources/spine/ground/yezi.json', 'utf8'));
const terrain = { entry: { id: 'grass' } };
const settings = { current: { snapshot: { sound: true } } };
const cc = {
    _decorator: { ccclass: () => type => type, property: () => () => {} },
    Component: class {}, Sprite: class {}, SpriteFrame: class {}, UIOpacity: class {}, Color: class { static WHITE = {}; }, sp: { Skeleton: class {} }, AudioSource: class {}, isValid: value => !!value,
};
const compiled = ts.transpileModule(fs.readFileSync(base + 'native/expansion/effects/GroundImpactView.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
}).outputText;
const result = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => name === 'cc' ? cc : name.includes('GameTerrain') ? { GameTerrain: terrain } : name.includes('GameHaptics') ? { GameHaptics: { impact() {} } } : { GameSettings: settings }, result, result.exports);
for (const sound of [true, false]) {
    settings.current.snapshot.sound = sound;
    let completed, destroyed = 0, played = 0, stopped = 0;
    const view = new result.exports.GroundImpactView();
    view.node = { destroy: () => destroyed++ };
    view.skeleton = {
        setCompleteListener: callback => completed = callback,
        setAnimation(track, name, loop) {
            assert.ok(data.animations[name], '实际播放名必须存在于已复制的Spine资源中');
            assert.equal(track, 0);
            assert.equal(loop, false);
        },
    };
    view.audio = { play: () => played++, stop: () => stopped++ };
    view.onLoad();
    assert.equal(played, 0, "AudioSource初始化前不得请求播放");
    view.start();
    assert.equal(played, sound ? 1 : 0);
    assert.equal(destroyed, 0);
    completed();
    assert.equal(destroyed, 1);
    view.onDestroy();
    assert.equal(completed, null);
    assert.equal(stopped, 1);
}
console.log('通过：真实草叶资源动画名、单次播放、音效开关及结束清理。');

for(const id of ['coast','canyon','wood','cream','cake','snow','ice','lava','aurora']) {
 terrain.entry.id=id;const view=new result.exports.GroundImpactView();let destroyed=0;
 view.node={destroy(){destroyed++;}};view.skeleton={enabled:true};
 view.materialFrames=Array.from({length:8},(_,i)=>({i}));
 view.particles=Array.from({length:8},()=>({node:{active:false,setPosition(){},setScale(){},getComponent(){return {};}}}));
 view.onLoad();assert.equal(view.skeleton.enabled,false);assert(view.particles.every(p=>p.spriteFrame));
 view.update(.7);assert.equal(destroyed,1);
}
console.log('通过：九种非草地材质切换和短时自动销毁。');
