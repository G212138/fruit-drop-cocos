// @ts-nocheck
import * as cc from 'cc';
import { ThemePanel } from './app-bundle/app-view/page/home/native/expansion/ThemePanel';
import { LocalizedLabel } from './app-builtin/app-controller/expansion/LocalizedLabel';
import { LanguageFont } from './app-builtin/app-controller/expansion/LanguageFont';
const base='db://assets/app-bundle/app-view/page/home/';
/** 通过编辑器查询真实资源标识。 */
async function load(url,frame=false){const info=await Editor.Message.request('asset-db','query-asset-info',url);if(!info)throw Error(url);let uuid=info.uuid;if(frame){const m=await Editor.Message.request('asset-db','query-asset-meta',url);uuid=Object.values(m.subMetas).find(x=>x.importer==='sprite-frame').uuid;}return new Promise((res,rej)=>cc.assetManager.loadAny(uuid,(e,a)=>e?rej(e):res(a)));}
/** 编辑器创建节点，参数为设计像素，不在游戏运行时创建。 */
function node(parent,name,w,h,x=0,y=0){const n=new cc.Node(name);n.layer=cc.Layers.Enum.UI_2D;n.parent=parent;n.addComponent(cc.UITransform).setContentSize(w,h);n.setPosition(x,y);return n;}
/** 图片采用自定义尺寸，防止导入尺寸覆盖布局。 */
async function sprite(parent,name,art,w,h,x=0,y=0){const n=node(parent,name,w,h,x,y);const s=n.addComponent(cc.Sprite);s.spriteFrame=await load(base+'resources/theme-redesign/'+art+'.png',true);s.sizeMode=cc.Sprite.SizeMode.CUSTOM;if(art==='panel'||art==='status-strip'){s.type=cc.Sprite.Type.SLICED;s.spriteFrame.insetLeft=art==='panel'?45:55;s.spriteFrame.insetRight=art==='panel'?45:55;s.spriteFrame.insetTop=art==='panel'?45:55;s.spriteFrame.insetBottom=art==='panel'?45:55;}n.getComponent(cc.UITransform).setContentSize(w,h);return n;}
/** 制作按钮点击绑定与轻微按压反馈。 */
function button(n,target,method){const b=n.addComponent(cc.Button);b.transition=cc.Button.Transition.SCALE;b.zoomScale=.96;const e=new cc.EventHandler();e.target=target;e.component='ThemePanel';e.handler=method;b.clickEvents=[e];return b;}
@cc._decorator.ccclass('ThemeDesignAuthoring')
export class ThemeDesignAuthoring extends cc.Component {
/** 按效果图重建首页中主题面板，保留原资源列表和首页其他节点。 */
async author(){
 for(const art of ['panel','status-strip']) {
 const url=base+'resources/theme-redesign/'+art+'.png';
 const meta=await Editor.Message.request('asset-db','query-asset-meta',url);
 const frame=Object.values(meta.subMetas).find(x=>x.importer==='sprite-frame');
 const border=art==='panel'?45:55;
 Object.assign(frame.userData,{borderLeft:border,borderRight:border,borderTop:border,borderBottom:border});
 await Editor.Message.request('asset-db','save-asset-meta',url,JSON.stringify(meta));
 }
 const prefab=await load(base+'native/PageHome.prefab');const root=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(root,true);
 const view=root.getComponentsInChildren(ThemePanel)[0];if(!view)throw Error('ThemePanel missing');
 const zh=await load(base+'resources/font/Bold.ttf'),en=await load(base+'resources/font/XESENGLISHFONT_REGULAR.ttf');
 const text=(p,name,value,key,w,h,size,x=0,y=0)=>{const n=node(p,name,w,h,x,y);const l=n.addComponent(cc.Label);l.string=value;l.font=en;l.useSystemFont=false;l.fontSize=size;l.lineHeight=size*1.15;l.color=new cc.Color(105,57,24);l.horizontalAlign=1;l.verticalAlign=1;l.overflow=cc.Label.Overflow.SHRINK;l.enableWrapText=false;const f=n.addComponent(LanguageFont);f.chineseFont=zh;f.englishFont=en;if(key){const loc=n.addComponent(LocalizedLabel);loc.key=key;}return l;};
 const old=view.content;old.removeFromParent();old.destroy();
 const content=node(view.node,'Content',680,1180);view.content=content;
 await sprite(content,'Panel','panel',680,1180);
 await sprite(content,'Title','title-themes',450,128,0,565);
 const close=await sprite(content,'Close','close',78,78,295,545);button(close,view.node,'close');
 view.tabs=[];view.equippedChecks=[];
 for(let i=0;i<2;i++){
  const holder=node(content,i===0?'FruitTab':'DessertTab',275,145,i===0?-148:148,440);
  for(let selected=0;selected<2;selected++){
   const tab=await sprite(holder,selected?'Selected':'Normal',selected?'tab-selected':'tab-normal',275,145);
   button(tab,view.node,i===0?'chooseFruit':'chooseDessert');view.tabs.push(tab);
   const icon=node(tab,'Icon',78,78,0,20);const s=icon.addComponent(cc.Sprite);s.spriteFrame=view.frames[i*30];s.sizeMode=cc.Sprite.SizeMode.CUSTOM;icon.getComponent(cc.UITransform).setContentSize(78,78);
   text(tab,'Caption',i===0?'FRUIT':'DESSERT',i===0?'fruits':'sweets',235,40,28,0,-42);
  }
  const check=await sprite(holder,'Equipped','equipped-check',32,32,47,0);view.equippedChecks.push(check);
 }
 await sprite(content,'StatusStrip','status-strip',592,48,0,330);
 view.title=text(content,'Category','FRUIT','',210,38,26,-177,330);
 view.status=text(content,'Status','IN USE','',335,38,23,102,330);
 view.icons=[];
 for(let i=0;i<30;i++){
  const cell=await sprite(content,'Item'+String(i+1).padStart(2,'0'),'item-card',108,108,-232+(i%5)*116,245-Math.floor(i/5)*116);
  const n=node(cell,'Icon',86,86);const s=n.addComponent(cc.Sprite);s.spriteFrame=view.frames[i];s.sizeMode=cc.Sprite.SizeMode.CUSTOM;n.getComponent(cc.UITransform).setContentSize(86,86);view.icons.push(s);
 }
 view.countLabel=text(content,'Count','30 / 30 UNLOCKED','',570,38,24,0,-414);
 const confirm=await sprite(content,'Confirm','confirm-button',510,104,0,-492);view.confirmButton=button(confirm,view.node,'confirmUse');
 view.confirmLabel=text(confirm,'Caption','CONFIRM USE','',445,67,35);view.confirmLabel.color=cc.Color.WHITE;const outline=confirm.getChildByName('Caption').addComponent(cc.LabelOutline);outline.color=new cc.Color(33,92,15);outline.width=2;
 text(content,'Hint','Applies after confirmation','themeConfirmHint',570,34,21,0,-556);
 view.node.active=false;
 const data=cce.Prefab.generatePrefabDataFromNode(root);await Editor.Message.request('asset-db','save-asset',base+'native/PageHome.prefab',data.prefabData||data);root.destroy();return '主题界面30个格子及确认使用绑定完成';
}
}

