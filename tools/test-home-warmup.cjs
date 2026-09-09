const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const code=ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/home/native/PageHome.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
const localized={};new Function('exports',ts.transpileModule(fs.readFileSync('assets/app-builtin/app-model/expansion/HomeLocalization.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(localized);
for(const dev of [true,false]){
    const loaded=[],shown=[],resources=[],exports={};
    const app={controller:{game:{progress:{level:8}}},manager:{ui:{load:n=>loaded.push(n),show:x=>shown.push(x)},loader:{load:x=>resources.push(x)}}};
    new Function('require','exports',code)(n=>n==='cc'?{_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},Prefab:class{},JsonAsset:class{},sys:{language:'en'}}:n==='cc/env'?{DEV:dev}:n.includes('BaseView')?{default:class{}}:n.includes('TikTokStartup')?{TikTokStartup:{enter(){}}}:n.includes('ScreenLayout')?{ScreenLayout:class{}}:n.includes('GameLanguage')?{GameLanguage:{text:(key,values)=>localized.homeText('en',key,values?.level),subscribe(){},unsubscribe(){}}}:n.includes('HomeLocalization')?localized:n.includes('GameTheme')?{GameTheme:{refresh(){}}}:{app},exports);
    const home=new exports.PageHome();home.levelLabel={};home.themePanel={close(){}};home.settingsPanel={node:{on(){},targetOff(){}}};home.onShow();assert.equal(home.levelLabel.string,'Level 8');assert.deepEqual(loaded,['PageGame']);assert.equal(shown.length,0,'预加载不得显示或启动游戏');
    assert.ok(resources.every(x=>x.bundle==='page-game-res'));
    assert.ok(resources.some(x=>x.path==='levels/original-levels'));
    assert.equal(resources.some(x=>x.path==='prefabs/DevelopmentRewardPanel'),dev);
    home.startGame();assert.deepEqual(shown,[{name:'PageGame'}],'点击开始仍走框架入口');
}
console.log('通过：首页预加载不启动关卡、正式/开发资源范围及开始入口。');
for(const locale of Object.keys(localized.homeMessages)) {
    for(const key of ['play','themes','level','editor']) assert.ok(localized.homeText(locale,key,123).length);
    assert.ok(localized.homeText(locale,'level',123).includes('123'));
}
assert.equal(localized.resolveHomeLanguage('pt_BR'),'pt');
assert.equal(localized.resolveHomeLanguage('de-DE'),'de');
assert.equal(localized.resolveHomeLanguage('unknown'),'en');
assert.equal(localized.homeText('zh-CN','level',12),'第 12 关');
console.log('通过：八种首页词条、区域语言回退和关卡占位符。');