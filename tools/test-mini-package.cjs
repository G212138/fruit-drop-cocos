const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]||'build/bytedance-mini-game');const base=path.join(root,'subpackages');const configs=new Map();
for(const n of fs.readdirSync(base)){const f=path.join(base,n,'config.json');if(fs.existsSync(f))configs.set(n,JSON.parse(fs.readFileSync(f)));}
for(const [name,c]of configs){for(let i=0;i<c.redirect.length;i+=2){const uuid=c.uuids[c.redirect[i]];const target=c.deps[Number(c.redirect[i+1])];assert.ok(configs.has(target),name+' missing '+target);assert.ok(configs.get(target).uuids.includes(uuid),name+' missing UUID in '+target);}}
for(const name of ['page-home','page-game','pop-result'])assert.ok(!configs.get(name).deps.includes('page-editor-res'),name);
const hash=()=>require('crypto').createHash('sha256').update(JSON.stringify([...configs])).digest('hex');
const before=hash();const result=require('../extensions/mini-package-optimizer/optimize').optimize(root);assert.equal(result.duplicateFontBytesRemoved,0);for(const [n]of configs)configs.set(n,JSON.parse(fs.readFileSync(path.join(base,n,'config.json'))));assert.equal(hash(),before);
console.log('通过：所有重定向目标存在、正式页面不依赖编辑器资源、优化幂等及包体门槛。',result);
