// @ts-nocheck
import * as cc from 'cc';
import { ResultPresentation } from './app-bundle/app-view/pop/result/native/expansion/ResultPresentation';
import { LocalizedLabel } from './app-builtin/app-controller/expansion/LocalizedLabel';
const base='db://assets/app-bundle/app-view/';
const art=base+'pop/result/resources/textures/result/';
/** 编辑器资源加载，SpriteFrame UUID 取自真实导入元数据。 */
async function asset(url,frame=false){const info=await Editor.Message.request('asset-db','query-asset-info',url);if(!info)throw Error(url);let uuid=info.uuid;if(frame){const meta=await Editor.Message.request('asset-db','query-asset-meta',url);uuid=Object.values(meta.subMetas).find(x=>x.importer==='sprite-frame').uuid;}return new Promise((resolve,reject)=>cc.assetManager.loadAny(uuid,(e,a)=>e?reject(e):resolve(a)));}
/** 创建编辑器节点；所有尺寸为设计像素。 */
function node(parent,name,w,h,x=0,y=0){const n=new cc.Node(name);n.layer=cc.Layers.Enum.UI_2D;n.parent=parent;n.addComponent(cc.UITransform).setContentSize(w,h);n.setPosition(x,y);return n;}
/** 图片赋值后设置自定义尺寸，避免素材原尺寸覆盖布局。 */
async function sprite(parent,name,url,w,h,x=0,y=0){const n=node(parent,name,w,h,x,y);const s=n.addComponent(cc.Sprite);s.spriteFrame=await asset(url,true);s.sizeMode=cc.Sprite.SizeMode.CUSTOM;n.getComponent(cc.UITransform).setContentSize(w,h);return n;}
/** 创建可翻译文案。 */
function label(parent,name,text,key,w,h,size,x=0,y=0,color=new cc.Color(90,46,22)){const n=node(parent,name,w,h,x,y);const l=n.addComponent(cc.Label);l.string=text;l.fontSize=size;l.lineHeight=size*1.2;l.isBold=true;l.color=color;l.horizontalAlign=1;l.verticalAlign=1;l.overflow=cc.Label.Overflow.SHRINK;l.enableWrapText=false;if(key){const c=n.addComponent(LocalizedLabel);c.key=key;}return l;}
/** 绑定既有结算方法，按钮仅发出请求。 */
function bind(n,root,method){const b=n.addComponent(cc.Button);b.transition=cc.Button.Transition.SCALE;b.zoomScale=.96;const e=new cc.EventHandler();e.target=root;e.component='PopResult';e.handler=method;b.clickEvents=[e];}
/** 可翻译的大按钮，保留描边白字。 */
async function button(parent,name,text,key,w,h,x,y,root,method,blue=false){const n=await sprite(parent,name,art+(blue?'button-blue.png':'button-green.png'),w,h,x,y);bind(n,root,method);const l=label(n,'Label',text,key,w-105,h-20,42,15,0,cc.Color.WHITE);l.getComponent(LocalizedLabel).uppercase=true;const o=l.node.addComponent(cc.LabelOutline);o.color=new cc.Color(26,88,16);o.width=3;return n;}
/** 恢复原版解锁行并补回首关配对说明；不改已完成的结算插画和按钮。 */
async function patch(url){
 const prefab:any=await asset(url);const isPage=url.includes('PageGame');
 if(isPage){const allowed=['cc.UITransform','cc.Widget','3b952GDVrJP3YOgpJBC3G+m','5cacbCCMo5PKZU3eixxETz/'];prefab.data._components=prefab.data._components.filter(c=>c&&allowed.includes(cc.js.getClassId(c.constructor)));}
 const page=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(page,true);
 const visit=n=>n.name==='GameResult'?n:n.children.map(visit).find(Boolean);
 const root=isPage?visit(page):page;const result=root.getComponents(cc.Component).find(c=>'successRoot' in c);
 result.showUnlock=true;const card=result.successRoot.getChildByName('Card');
 const picture=card.getChildByName('Illustration');picture.setPosition(0,166);picture.getComponent(cc.UITransform).setContentSize(380,326);
 card.getChildByName('Summary').setPosition(0,-32);
 const progress=card.getChildByName('Progress');progress.setPosition(0,-177);progress.getComponent(cc.UITransform).setContentSize(550,53);
 const unlock=result.unlockRoot;unlock.setPosition(0,-106);unlock.getComponent(cc.UITransform).setContentSize(510,78);
 const glow=result.unlockGlow;glow.setPosition(-37,0);let gs=glow.getComponent(cc.Sprite)||glow.addComponent(cc.Sprite);gs.spriteFrame=await asset(base+'pop/result/resources/original/glow.png',true);gs.sizeMode=cc.Sprite.SizeMode.CUSTOM;glow.getComponent(cc.UITransform).setContentSize(100,100);
 const icon=result.unlockIcon;icon.node.setPosition(-37,0);icon.spriteFrame=result.unlockIcons[0];icon.sizeMode=cc.Sprite.SizeMode.CUSTOM;icon.node.getComponent(cc.UITransform).setContentSize(68,68);
 const name=result.unlockName;name.node.setPosition(117,0);name.node.getComponent(cc.UITransform).setContentSize(226,68);name.fontSize=27;name.lineHeight=33;name.color=new cc.Color(157,84,13);name.isBold=true;
 const caption=unlock.getChildByName('UnlockText');caption.active=true;caption.setPosition(-164,0);caption.getComponent(cc.UITransform).setContentSize(160,68);const l=caption.getComponent(cc.Label);l.string='Unlocked!';l.fontSize=26;l.lineHeight=31;l.color=new cc.Color(83,57,30);let loc=caption.getComponent(LocalizedLabel)||caption.addComponent(LocalizedLabel);loc.key='unlocked';
 if(isPage){
  const owner=page.getComponents(cc.Component).find(c=>'resultRoot' in c);const hud=owner.hudRoot;
  const old=hud.getChildByName('FirstPairHint');if(old){old.removeFromParent();old.destroy();}
  const hint=await sprite(hud,'FirstPairHint',base+'page/game/resources/textures/settings/redesign/row-card.png',470,94,0,200);
  label(hint,'Message','2 个相同物品即可消除','pairHint',425,65,29,0,0,new cc.Color(75,125,24));hint.active=false;owner.pairHintRoot=hint;
 }
 const data=cce.Prefab.generatePrefabDataFromNode(page);await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);page.destroy();
}
@cc._decorator.ccclass('RestoreGuideUnlock')
export class RestoreGuideUnlock extends cc.Component {
 /** 同时修正独立与内嵌结算入口。 */
 async author(){await patch(base+'pop/result/native/PopResult.prefab');await patch(base+'page/game/native/PageGame.prefab');return '首关说明及两套解锁行已恢复';}
}