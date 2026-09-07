const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
/** 装载不依赖引擎的真实编辑数据模块。 */
function load(file){
    const module={exports:{}};
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    new Function('require','module','exports',output)(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);
    return module.exports;
}
const base=path.resolve(__dirname,'../assets/app-builtin/app-model/expansion/level');
const {readLevelDocument,validateLevelForExport}=load(base+'/LevelDocument.ts');
const {EditorDraft}=load(base+'/EditorDraft.ts');
const levels=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/app-bundle/app-view/page/game/resources/levels/original-levels.json'),'utf8')).levels;
for(const level of levels){const parsed=readLevelDocument(level);assert.equal(parsed.d.length,level.d.length);assert.deepEqual(parsed.d.map(x=>x.p),level.d.map(x=>x.p));}
const draft=new EditorDraft();
draft.add(1,-100,0);draft.add(1,100,0);
draft.selected=0;draft.toggleHidden();draft.setIce(2);draft.scrollY=300;
const trial=draft.beginTrial();trial.d[0].p[0]=999;
draft.document.d[0].p[0]=888;draft.scrollY=0;draft.restoreTrial();
assert.equal(draft.document.d[0].p[0],-100);assert.equal(draft.scrollY,300);assert.equal(draft.selected,0);
const exported=draft.exportText();
assert.throws(()=>draft.importText('{broken'));
assert.equal(draft.exportText(),exported,'导入失败不能丢失草稿');
draft.toggleBlackHole();draft.addBlackHoleMember(2);draft.addBlackHoleMember(2);
const payload=draft.buildDocument();
assert.equal(payload.d[0].BlackHole,3);
assert.deepEqual(payload.d.slice(2).map(x=>x.SequenceID),[1,2]);
assert.deepEqual(payload.d[2].p,payload.d[0].p);
validateLevelForExport(payload);
draft.selected=0;draft.deleteSelected();assert.equal(draft.document.d.length,1);
assert.throws(()=>draft.exportText(),/成对/);
assert.throws(()=>readLevelDocument({level:1,m:1,d:[{n:'1',p:[0,0],FatherBlackHoleID:1,SequenceID:1}]}),/宿主/);
assert.throws(()=>validateLevelForExport({level:1,m:1,d:[{n:'1',p:[0,0]},{n:'1',p:[50,0]}]}),/50/);
console.log('通过：全部45关格式、编辑导入事务性、试玩快照隔离、黑洞导出顺序/数量/坐标、删除及间距验证。');
