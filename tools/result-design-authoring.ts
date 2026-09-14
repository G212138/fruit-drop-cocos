// @ts-nocheck
import * as cc from 'cc';
import { ResultPresentation } from './app-bundle/app-view/pop/result/native/expansion/ResultPresentation';
import { LocalizedLabel } from './app-builtin/app-controller/expansion/LocalizedLabel';
const base='db://assets/app-bundle/app-view/';
const art=base+'pop/result/resources/redesign/';
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
/** 编辑器保存两套结算入口，使独立预制体和游戏内嵌布局一致。 */
async function rebuild(url){
 const prefab:any=await asset(url);const isPage=url.includes('PageGame');
 if(isPage){const allowed=['cc.UITransform','cc.Widget','3b952GDVrJP3YOgpJBC3G+m','5cacbCCMo5PKZU3eixxETz/'];prefab.data._components=prefab.data._components.filter(c=>c&&allowed.includes(cc.js.getClassId(c.constructor)));}
 const page=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(page,true);
 let root=page;if(isPage){const visit=n=>n.name==='GameResult'?n:n.children.map(visit).find(Boolean);root=visit(page);}
 const result=root.getComponents(cc.Component).find(c=>'successRoot' in c);if(!result)throw Error('PopResult未找到');
 const icons=[...result.unlockIcons];for(const child of [...root.children]){child.removeFromParent();child.destroy();}
 const oldPresentation=root.getComponent(ResultPresentation);if(oldPresentation){root._components=root._components.filter(c=>c!==oldPresentation);oldPresentation.destroy();}
 const presentation=root.addComponent(ResultPresentation);result.presentation=presentation;result.showUnlock=false;
 root.getComponent(cc.UITransform).setContentSize(750,1334);
 const mask=await sprite(root,'Background',base+'page/game/resources/textures/settings/mask.png',2200,3000);mask.getComponent(cc.Sprite).color=new cc.Color(5,24,43,175);mask.addComponent(cc.BlockInputEvents);
 result.titleLabel=label(root,'Notice','','',600,65,23,0,-550,cc.Color.WHITE);
 const audioNode=node(root,'ResultAudio',1,1);result.successAudio=audioNode.addComponent(cc.AudioSource);result.successAudio.clip=await asset(base+'page/game/resources/audio/success.mp3');result.successAudio.playOnAwake=false;
 presentation.failureAudio=audioNode.addComponent(cc.AudioSource);presentation.failureAudio.clip=await asset(base+'pop/result/resources/audio/failure.mp3');presentation.failureAudio.playOnAwake=false;presentation.failureAudio.volume=.7;
 presentation.reviveAudio=audioNode.addComponent(cc.AudioSource);presentation.reviveAudio.clip=await asset(base+'page/game/resources/audio/merge.mp3');presentation.reviveAudio.playOnAwake=false;presentation.reviveAudio.volume=.45;
 const names=['Success','RevivePrompt','Failure'];
 const titles=['title-level-complete.png','title-one-more-chance.png','title-level-failed.png'];
 const pictures=['illustration-success.png','illustration-revive.png','illustration-failed.png'];
 for(let i=0;i<3;i++){
  const layer=node(root,names[i],750,1334);const card=node(layer,'Card',660,960,0,0);card.addComponent(cc.BlockInputEvents);presentation.cards.push(card);
  await sprite(card,'Panel',art+'result-panel.png',660,900,0,-10);
  const illustration=await sprite(card,'Illustration',art+pictures[i],i===0?440:600,i===0?378:i===1?489:385,0,i===0?140:i===1?140:145);presentation.illustrations.push(illustration);
  await sprite(card,'Title',art+titles[i],660,i===0?234:166,0,i===0?400:430);
  const particles=node(card,'Particles',660,900);presentation.particleRoots.push(particles);
  for(let j=0;j<(i===2?5:12);j++){
   const p=await sprite(particles,'Spark'+j,base+'pop/result/resources/original/glow.png',i===0?20:14,i===0?20:14,(j%4-1.5)*130,240+Math.floor(j/4)*70);
   p.addComponent(cc.UIOpacity).opacity=0;p.getComponent(cc.Sprite).color=i===1?new cc.Color(100,240,255):i===2?new cc.Color(220,192,126):[new cc.Color(255,210,30),new cc.Color(108,235,28),new cc.Color(60,200,255)][j%3];
  }
  if(i===0){
   result.successRoot=layer;label(card,'Summary','ALL CLEARED!','allFruitCleared',590,52,35,0,-84,new cc.Color(44,118,20));await sprite(card,'Progress',art+'progress-complete.png',550,75,0,-150);
   result.nextButton=await button(card,'NextButton','NEXT LEVEL','next',550,150,0,-276,root,'next');result.nextButton.addComponent(cc.UIOpacity);
   await sprite(result.nextButton,'Arrow',art+'icon-next.png',64,52,218,0);result.nextButton.getChildByName('Label').setPosition(-20,0);
   const home=await sprite(card,'HomeButton',art+'home-round.png',110,107,0,-404);bind(home,root,'home');
   const unlock=node(card,'Unlock',1,1);unlock.active=false;result.unlockRoot=unlock;result.unlockGlow=node(unlock,'Glow',1,1);result.unlockIcon=node(unlock,'UnlockIcon',1,1).addComponent(cc.Sprite);result.unlockName=label(unlock,'UnlockName','','',1,1,20);label(unlock,'UnlockText','','',1,1,20);result.unlockIcons=icons;
   result.trialButton=await button(card,'TrialRestart','TRY AGAIN','tryAgain',260,110,-140,-276,root,'restart');result.trialReturn=await button(card,'TrialReturn','EDITOR','editor',260,110,140,-276,root,'home',true);result.trialButton.active=result.trialReturn.active=false;
  }else if(i===1){
   result.revivePrompt=layer;label(card,'Summary','Clear the chute and keep playing','clearChute',600,60,28,0,-151);
   result.reviveButton=await button(card,'ReviveButton','WATCH AD','watchAd',570,156,0,-276,root,'revive');
   result.reviveButton.getComponent(cc.Sprite).spriteFrame=await asset(art+'button-revive.png',true);result.reviveButton.getComponent(cc.UITransform).setContentSize(570,156);
   const main=result.reviveButton.getChildByName('Label');main.setPosition(48,22);main.getComponent(cc.UITransform).setContentSize(375,70);
   await sprite(result.reviveButton,'Video',art+'icon-video.png',86,65,-188,0);label(result.reviveButton,'ContinueCaption','CONTINUE','continue',350,42,33,48,-35,cc.Color.WHITE).getComponent(LocalizedLabel).uppercase=true;
   await sprite(card,'DeclineBackground',art+'button-decline.png',310,58,0,-405);
   const decline=label(card,'NoThanks','NO THANKS','noThanks',300,66,27,0,-405);bind(decline.node,root,'dismissRevivePrompt');
  }else{
   result.failureRoot=layer;label(card,'Summary','Give it another try!','giveAnotherTry',570,65,35,0,-88);
   const retry=await button(card,'RestartButton','TRY AGAIN','tryAgain',550,150,0,-215,root,'restart');await sprite(retry,'Icon',art+'icon-restart.png',75,90,-205,0);retry.getChildByName('Label').setPosition(50,0);
   const home=await button(card,'HomeButton','HOME','home',350,104,0,-365,root,'home',true);const house=await sprite(home,'Icon',art+'icon-home.png',60,60,-110,0);house.getComponent(cc.Sprite).color=cc.Color.WHITE;home.getChildByName('Label').setPosition(32,0);
  }
  layer.active=false;
 }
 result.winAnimation=null;result.failAnimation=null;result.embedded=isPage;
 const serialized=cce.Prefab.generatePrefabDataFromNode(page);await Editor.Message.request('asset-db','save-asset',url,serialized.prefabData||serialized);page.destroy();
}
@cc._decorator.ccclass('ResultDesignAuthor')
export class ResultDesignAuthor extends cc.Component{
 /** 对照设计图制作成功、复活及失败的全部素材绑定。 */
 async author(){await rebuild(base+'pop/result/native/PopResult.prefab');await rebuild(base+'page/game/native/PageGame.prefab');return '三种结算界面及两套入口已保存';}
}
