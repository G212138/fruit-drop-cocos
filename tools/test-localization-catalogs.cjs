const fs = require('fs'), assert = require('node:assert/strict');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const builtin='assets/app-builtin/app-model/expansion/';
const pop='assets/app-bundle/app-view/pop/';
const locales=['en','ja','id','th','vi','ms','fil','zh'];
function load(path, names) {
 const source=fs.readFileSync(path,'utf8')+'\nexport const audit = {'+names.join(',')+'};';
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};new Function('require','exports',output)(()=>({}),exports);return exports.audit;
}
const variables=text=>(text.match(/\{\w+\}/g)||[]).sort();
let count=0;
function check(table, expected=locales) {
 const reference=table.en||table.ja;
 for(const locale of expected){
  assert(table[locale], 'missing '+locale);
  const row=table[locale];assert.deepEqual(Object.keys(row),Object.keys(reference));
  for(const key of Object.keys(reference)){
   assert.equal(typeof row[key],'string');assert(row[key].trim());
   assert.deepEqual(variables(row[key]),variables(reference[key]),locale+': '+key);
   count++;
  }
 }
}
const catalog=load(builtin+'LanguageCatalog.ts',['languageMessages']).languageMessages;
check(catalog);
check(load(pop+'result/native/expansion/ResultStrings.ts',['texts']).texts);
const collection=load(pop+'collection/native/expansion/CollectionText.ts',['itemNames','labels']);
check(collection.itemNames);check(collection.labels);
for(const row of Object.values(collection.itemNames))assert.equal(row.length,60);
const terrain=load(pop+'theme/native/expansion/TerrainText.ts',['labels','names']);
check(terrain.labels);check(terrain.names,locales.filter(code=>!['en','zh'].includes(code)));
check(load(builtin+'platform/RevisitDialogText.ts',['copy']).copy);
check(load(builtin+'platform/TikTokMessages.ts',['messages']).messages);
const legacy=load(builtin+'HomeLocalization.ts',['homeMessages']).homeMessages;check(legacy,Object.keys(legacy));
const prefab=JSON.parse(fs.readFileSync('assets/app-bundle/app-view/page/game/native/PageGame.prefab','utf8'));
const caption=prefab.find(value=>value.__type__==='cc.Label'&&value._string==='晃一晃');
assert(caption,'shake caption exists');
assert(prefab.some(value=>value.key==='shake'&&value.node?.__id__===caption.node.__id__),'shake caption must be localized');
for(const code of locales)assert(catalog[code].shake);
console.log(`通过：${count}条文案的语言覆盖、非空、索引与变量一致性；图鉴每语种60项；晃一晃预制体多语言绑定。`);
