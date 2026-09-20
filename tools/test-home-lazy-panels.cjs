const fs=require('fs'),assert=require('assert/strict'),ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const base='assets/app-bundle/app-view/';
for(const [dir,name,fields]of [['theme','PopTheme',['preview','heading','title','count','status','confirmButton','confirmLabel']],['collection','PopCollection',['content','icons','frames','title','heading','status','tabs','confirmButton','confirmLabel','countLabel','equippedChecks']],['settings','PopSettings',['content','opacity','musicRow','soundRow','vibrateRow','warningLabel']]]){
const a=JSON.parse(fs.readFileSync(base+'pop/'+dir+'/native/'+name+'.prefab'));const wrapper=a.find(x=>x.panel);assert(wrapper,name+' wrapper missing');const panel=a[wrapper.panel.__id__];for(const key of fields)assert(panel[key]&&(!Array.isArray(panel[key])||panel[key].length),name+' empty '+key);if(dir==='collection'){assert.equal(panel.frames.length,60);assert.equal(panel.icons.length,30);}assert.equal(wrapper._hideEvent,1);
for(const type of ['native','resources']){const m=JSON.parse(fs.readFileSync(base+'pop/'+dir+'/'+type+'.meta'));assert.equal(m.userData.bundleName,'pop-'+dir+(type==='resources'?'-res':''));}
const events=new Map();let opened=0,hidden;
class Base{hide(data){hidden=data??true;this.onHide(data);}}
const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};const e={};const code=ts.transpileModule(fs.readFileSync(base+'pop/'+dir+'/native/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true},reportDiagnostics:true});assert.equal(code.diagnostics.length,0);
new Function('require','exports',code.outputText)(n=>n==='cc'?cc:n.includes('BaseView')?{default:Base}:n.endsWith('/app')?{app:{controller:{game:{progress:{level:31}},settings:{toggle:()=>''}}}}:n.endsWith('/UiClickSound')?{UiClickSound:{bind(){}}}:n.endsWith('/GameSettings')?{GameSettings:{current:{snapshot:{}}}}:{},e);
const p=new e[name]();p.node={targetOff(){events.clear()},on(n,cb,target){events.set(n,(...args)=>cb.apply(target,args))}};p.panel={open(){opened++},render(){}};p.onShow();assert.equal(opened,1);if(dir==='settings')events.get('settings-action')('continue');else events.get('panel-close')();assert(hidden);assert.equal(events.size,0);
}
const home=fs.readFileSync(base+'page/home/native/PageHome.ts','utf8');for(const n of ['PopTheme','PopCollection','PopSettings'])assert(home.includes("name: '"+n+"'"));assert(!home.includes('openPanel('));
console.log('通过：三个Pop框架分包、完整绑定、60张图鉴、框架关闭清理和首页入口。');
