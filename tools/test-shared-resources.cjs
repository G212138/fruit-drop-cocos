const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.resolve('assets');
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
const files=walk(root);const hashes=new Map();
for(const p of files.filter(p=>/\.(png|jpg|ttf|mp3|wav)$/.test(p))){const h=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');assert.ok(!hashes.has(h),'重复资源: '+p+' 与 '+hashes.get(h));hashes.set(h,p);}
for(const kind of ['fruit','dessert'])assert.equal(fs.readdirSync(path.join(root,'res-bundle/shared-items',kind)).filter(p=>p.endsWith('.png')).length,30);
assert.equal(fs.readdirSync(path.join(root,'res-bundle/shared-terrains/terrains')).filter(p=>p.endsWith('.png')).length,11);
assert.equal(fs.readdirSync(path.join(root,'res-bundle/shared-terrains/terrains/blocks')).filter(p=>p.endsWith('.png')).length,11);
for(const name of ['shared-items','shared-terrains','shared-ui']){const m=JSON.parse(fs.readFileSync(path.join(root,'res-bundle',name+'.meta')));assert.equal(m.userData.isBundle,true);assert.equal(m.userData.bundleName,name);assert.equal(m.userData.priority,10);}
assert.ok(!files.some(p=>p.includes('ResourceOrganizer')||p.includes('TwoSlotAuthoring')));
assert.ok(!files.some(p=>p.includes(path.join('page','editor','resources','textures','fruit-'))));
console.log('通过：共享资源数量、公共Bundle配置、图片字体音频无重复、无旧编辑器水果或临时脚本。');
