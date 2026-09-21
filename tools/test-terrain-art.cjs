const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
let cached, pending, loads = 0, refs = 0;
const frame = { addRef() { refs++; }, decRef() { refs--; } };
const cc = { SpriteFrame: class {}, isValid: asset => asset.valid !== false,
 assetManager: { getBundle: () => ({ get: () => cached }) } };
const app = { manager: { loader: { load(options) { loads++; pending = options.onComplete; } } } };
const exportsObject = {};
const code = ts.transpileModule(fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/TerrainArt.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
new Function('require','exports',code)(name=>name==='cc'?cc:{app},exportsObject);
const {TerrainArt} = exportsObject;
for (const file of ['test-terrain','blocks/test-terrain']) {
 cached = frame; let completed = false;
 TerrainArt.load(file, result => { assert.equal(result,frame); completed=true; result.decRef(); });
 assert.equal(completed,true,'缓存图片必须在调用返回前应用，不能延后一帧');
}
assert.equal(loads,0); assert.equal(refs,0);
cached = null; let result;
TerrainArt.load('uncached',value=>result=value);assert.equal(result,undefined);
pending(frame);assert.equal(result,frame);assert.equal(refs,1);result.decRef();
TerrainArt.load('failed',value=>result=value);pending(null);assert.equal(result,null);assert.equal(refs,0);
cached = {valid:false};TerrainArt.load('invalid',()=>{});assert.equal(loads,3);
console.log('通过：地块和挡板缓存同步应用、未缓存异步加载、失败回退、无效缓存及引用计数。');
