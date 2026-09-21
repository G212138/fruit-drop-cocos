const fs = require('fs'), assert = require('node:assert/strict');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const base = 'assets/app-builtin/app-model/expansion/';
function compile(name, requireMock) {
    const exports = {};
    const output = ts.transpileModule(fs.readFileSync(base + name + '.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    new Function('exports','require',output)(exports,requireMock);
    return exports;
}
const catalog = compile('LanguageCatalog');
for (const locale of ['en','ja','id','th','vi','ms','fil','zh']) {
    assert.deepEqual(Object.keys(catalog.languageMessages[locale]), Object.keys(catalog.languageMessages.en));
    assert.ok(catalog.languageText(locale,'level',{level:123}).includes('123'));
    assert.ok(Object.values(catalog.languageMessages[locale]).every(text=>text.length>0));
}
for (const [input,expected] of [['ja-JP','ja'],['id_ID','id'],['in-ID','id'],['tl-PH','fil'],['fil-PH','fil'],['th-TH','th'],['de-DE','en']]) assert.equal(catalog.resolveLanguage(input),expected);
const store = new Map();
const sys = {language:'ja',languageCode:'ja-JP',localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)}};
function service(){return compile('GameLanguage',n=>n==='cc'?{sys}:n.endsWith('/PlatformStorage')?{PlatformStorage:sys.localStorage}:catalog).GameLanguage;}
let language = service(); assert.equal(language.choice,'ja'); assert.equal(language.current,'ja');
let updates=0; const update=()=>updates++; language.subscribe(update);
assert.equal(language.select('vi'),true); assert.equal(language.current,'vi'); assert.equal(updates,1);
language.unsubscribe(update); language.select('th'); assert.equal(updates,1);
language=service(); assert.equal(language.choice,'th'); assert.equal(language.current,'th');
assert.equal(language.select('system'),false);
store.set('tumble-match.language.v1','system');sys.languageCode='tl-PH';language=service();
assert.equal(language.choice,'fil');assert.equal(store.get('tumble-match.language.v1'),'fil');
sys.languageCode='ja-JP';assert.equal(language.current,'fil');
assert.equal(catalog.languageOptions.length,8);assert.ok(!catalog.languageOptions.includes('system'));
sys.localStorage.setItem=()=>{throw new Error('storage unavailable');};
assert.equal(language.select('ms'),false); assert.equal(language.current,'ms');
assert.equal(language.select('unsupported'),false); assert.equal(language.current,'ms');
console.log('通过：八种词表、系统区域码/别名、英文回退、手动选择持久化、监听解除与存储失败。');
