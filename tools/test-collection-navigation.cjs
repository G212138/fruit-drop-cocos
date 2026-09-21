const fs=require('fs'),assert=require('assert/strict'),ts=require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
function load(path,requireMock){const e={};new Function('require','exports',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText)(requireMock,e);return e;}
const root='assets/app-bundle/app-view/pop/collection/native/expansion/';
const {CollectionSwipe}=load(root+'CollectionSwipe.ts',()=>({}));
const cc={_decorator:{ccclass:()=>x=>x,property:(...args)=>args.length>1?undefined:()=>{}},Component:class{},Node:{EventType:{}},Tween:{stopAllByTarget(){}},Vec3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},tween:()=>({to(){return this;},call(fn){fn();return this;},start(){}})};
const {CollectionPager}=load(root+'CollectionPager.ts',name=>name==='cc'?cc:{CollectionSwipe});
const p=new CollectionPager();p.node={worldScale:{x:1},getComponent:()=>({width:578}),emit(){}};p.strip={setPosition(){}};p.scrolls=[{vertical:true,stopAutoScroll(){}}];p.previousButton={};p.nextButton={};
const event=(x,y=0,simulate=false)=>({getID:()=>1,getUILocation:()=>({x,y}),simulate});
p.begin(event(300));p.move(event(100));p.cancel(event(100,0,true));assert.equal(p.touchId,1,'内部合成取消不得打断手势');p.cancel(event(50));assert.equal(p.index,1,'移动目标外松手仍完成左滑');assert.equal(p.nextButton.interactable,false);p.previous();assert.equal(p.index,0);p.next();assert.equal(p.index,1);p.next();assert.equal(p.index,1);
p.begin(event(0));p.move(event(20,100));p.end(event(40,200));assert.equal(p.index,1,'纵向滚动不切页');p.begin(event(0));p.move(event(30));p.end(event(40));assert.equal(p.index,1,'短拖保持');p.begin(event(0));p.move(event(180));p.end(event(200));assert.equal(p.index,0,'右滑返回');
console.log('通过：合成取消、目标外松手、左右滑动、纵向与短拖不切页、按钮边界。');

