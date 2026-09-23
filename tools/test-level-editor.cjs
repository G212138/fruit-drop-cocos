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
assert.deepEqual(draft.document.d[2].p,[-40,0],'第一个成员位于宿主右侧六十像素');
assert.ok(Math.abs(draft.document.d[3].p[1]-30*Math.sqrt(3))<0.00001);
draft.selected=0;draft.moveSelected(100,200);
assert.deepEqual(draft.document.d[2].p,[160,200],'拖动宿主同步成员');
assert.deepEqual(draft.buildDocument().d[2].p,[100,200],'环形显示坐标不泄漏到导出');
const ringDraft=new EditorDraft();ringDraft.importText(JSON.stringify(payload));
assert.deepEqual(ringDraft.document.d[2].p,[-40,0],'重新导入恢复环形');
ringDraft.selected=2;ringDraft.deleteSelected();
assert.equal(ringDraft.document.d[0].BlackHole,2,'删除成员刷新宿主数量');
assert.deepEqual(ringDraft.document.d[2].p,[-40,0],'剩余成员重新占据首个环形槽');
ringDraft.scroll(-1);assert.equal(ringDraft.scrollY,-10);
ringDraft.scroll(-20000);assert.equal(ringDraft.scrollY,-4010);
ringDraft.scroll(20000);assert.equal(ringDraft.scrollY,-10);
ringDraft.toggleMode();ringDraft.scroll(1);assert.equal(ringDraft.scrollX,10);
ringDraft.scroll(20000);assert.equal(ringDraft.scrollX,4010);
ringDraft.scroll(-20000);assert.equal(ringDraft.scrollX,10);
const beforePan = JSON.stringify(ringDraft.buildDocument());
ringDraft.scroll(-40000);assert.ok(ringDraft.scrollX < 0, '横向可越过原点查看另一侧');
ringDraft.toggleMode();ringDraft.scroll(40000);assert.ok(ringDraft.scrollY > 0, '纵向可向上平移以查看底部');
ringDraft.toggleMode();assert.equal(JSON.stringify(ringDraft.buildDocument()), beforePan, '视口平移不得改变导出数据');
draft.selected=0;draft.deleteSelected();assert.equal(draft.document.d.length,1);
assert.throws(()=>draft.exportText(),/成对/);
assert.throws(()=>readLevelDocument({level:1,m:1,d:[{n:'1',p:[0,0],FatherBlackHoleID:1,SequenceID:1}]}),/宿主/);
assert.throws(()=>validateLevelForExport({level:1,m:1,d:[{n:'1',p:[0,0]},{n:'1',p:[50,0]}]}),/50/);
console.log('通过：全部45关格式、编辑导入事务性、试玩快照隔离、黑洞导出顺序/数量/坐标、删除及间距验证。');

const imports = new EditorDraft();
for (const wrapper of ['json','data','payload','cfg','config','levelData','default']) {
    imports.importText(JSON.stringify({ [wrapper]: JSON.stringify(levels[0]) }));
    assert.equal(imports.document.d.length, levels[0].d.length);
}
imports.importText('46', 1, levels);
assert.deepEqual(imports.buildDocument(), (() => {const x=new EditorDraft();x.importText(JSON.stringify(levels[2]));return x.buildDocument();})());
imports.importText(JSON.stringify({level:levels}), 6);
assert.equal(imports.document.d.length,levels[5].d.length);
imports.importText(JSON.stringify({levels}),45);
assert.equal(imports.document.d.length,levels[44].d.length);
imports.importText(JSON.stringify({level:{'2':levels[1]}}),2);
assert.equal(imports.document.d.length,levels[1].d.length);
const before=JSON.stringify(imports.document);
for (const invalid of ['0','-1','1.5','999',JSON.stringify({level:[]}),JSON.stringify({payload:'bad'})]) {
    assert.throws(()=>imports.importText(invalid));
    assert.equal(JSON.stringify(imports.document),before);
}
const mixed={level:1,m:2,d:[{n:'1',p:[-200,-400],h:'t',ice:2,BlackHoleID:1,BlackHole:3},{n:'2',p:[-200,-400],FatherBlackHoleID:1,SequenceID:1},{n:'2',p:[-200,-400],FatherBlackHoleID:1,SequenceID:2},{n:'1',p:[100,-400]}]};
imports.importText(JSON.stringify(mixed));
const mixedText=imports.exportText();
imports.importText(mixedText);
assert.equal(imports.exportText(),mixedText);
imports.selected=0;imports.scrollX=300;
const mixedTrial=imports.beginTrial();
mixedTrial.d.splice(0,2);mixedTrial.m=1;
imports.restoreTrial();
assert.equal(imports.exportText(),mixedText);
assert.equal(imports.scrollX,300);
assert.equal(imports.selected,0);
console.log('通过：原版包装格式、关卡表选择、数字循环、失败保留草稿、混合机制配置往返与试玩隔离。');

