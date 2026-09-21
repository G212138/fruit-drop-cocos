const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const load=p=>JSON.parse(fs.readFileSync(p));const base='assets/app-bundle/app-view/pop/';const a=load(base+'collection/native/PopCollection.prefab'),b=load(base+'theme/native/PopTheme.prefab');
const panel=a.find(x=>Array.isArray(x.frames)&&x.frames.length===60);const transform=n=>a[n._components.find(r=>a[r.__id__].__type__==='cc.UITransform').__id__];
const allowed=new Set();for(const group of ['fruit','dessert'])for(let i=1;i<=30;i++){const m=load('assets/res-bundle/shared-items/'+group+'/'+group+'-'+i+'.png.meta');for(const sub of Object.values(m.subMetas))if(sub.importer==='sprite-frame')allowed.add(sub.uuid);}
assert(panel.frames.every(r=>allowed.has(r.__uuid__)),'图鉴必须复用原物品，不能新增缩略图或手工图集');
for(let i=0;i<60;i++){const label=a[panel.names[i].__id__],icon=a[panel.icons[i].__id__],card=a[panel.cards[i].__id__];assert.equal(label._fontSize,24);assert.equal(transform(a[label.node.__id__])._contentSize.height,48);assert.equal(transform(a[icon.node.__id__])._contentSize.width,100);const n=a[card.node.__id__];assert.equal(n._lpos.y,-88-Math.floor((i%30)/3)*176);assert.equal(transform(n)._contentSize.height,168);}
function frame(data,name){const n=data.find(x=>x.__type__==='cc.Node'&&x._name===name);return data[n._components.find(r=>data[r.__id__].__type__==='cc.Sprite').__id__]._spriteFrame.__uuid__;}
for(const name of ['Content','Title','Close'])assert.equal(frame(a,name),frame(b,name),'图鉴与主题外框必须共用：'+name);
assert(!fs.existsSync(base+'collection/resources/textures/album-items.png'));assert(!fs.existsSync(base+'theme/resources/terrain-cards.png'));
console.log('通过：图鉴3×4、100px原图、名称24号两行、三种共享外框资源，以及无重复物品图集/地块缩略图。');
