// @ts-nocheck
import * as cc from 'cc';
import { GameCloudMotion } from './app-bundle/app-view/page/game/native/expansion/GameCloudMotion';
/** 查询并加载实际编辑器资源。 */
async function load(url, frame=false) {
    const info=await Editor.Message.request('asset-db','query-asset-info',url);
    let uuid=info.uuid;
    if(frame){const meta=await Editor.Message.request('asset-db','query-asset-meta',url);uuid=Object.values(meta.subMetas).find(x=>x.importer==='sprite-frame').uuid;}
    return new Promise((resolve,reject)=>cc.assetManager.loadAny(uuid,(e,a)=>e?reject(e):resolve(a)));
}
/** 仅在编辑器执行的天空层制作工具。 */
@cc._decorator.ccclass('GameSkyAuthoring')
export class GameSkyAuthoring extends cc.Component {
    /** 在原背景子层添加云朵，尺寸为设计像素，速度为像素/秒。 */
    async author() {
        const url='db://assets/app-bundle/app-view/page/game/native/PageGame.prefab';
        const prefab=await load(url);
        const root=cc.instantiate(prefab);
        cce.Prefab.removePrefabInfoFromNode(root,true);
        const bg=root.getChildByName('Background');
        if(!bg)throw Error('Background missing');
        for(const old of [...bg.children])if(old.name.startsWith('SkyCloud')){old.removeFromParent();old.destroy();}
        const frame=await load('db://assets/app-bundle/app-view/page/game/resources/textures/sky-cloud.png',true);
        const rows=[[-290,680,220,110,100,2.5],[280,580,330,165,120,3.5],[-380,430,460,230,135,4.5],[160,290,180,90,75,2],[-240,140,270,135,85,3],[360,-20,390,195,110,4],[-360,-230,340,170,120,4.2],[280,-420,500,250,140,5.5],[-260,-600,540,270,150,6],[350,-760,300,150,115,3.5]];
        for(let i=0;i<rows.length;i++){
            const [x,y,w,h,opacity,speed]=rows[i];
            const n=new cc.Node('SkyCloud'+i);n.layer=bg.layer;n.parent=bg;n.setPosition(x,y);
            const transform=n.addComponent(cc.UITransform);
            const sprite=n.addComponent(cc.Sprite);sprite.spriteFrame=frame;sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
            transform.setContentSize(w,h);n.addComponent(cc.UIOpacity).opacity=opacity;
            const motion=n.addComponent(GameCloudMotion);motion.speed=speed;motion.phase=i*1.37;motion.period=24+(i%5)*3;if(i%2)n.setScale(-1,1,1);
        }
        const data=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);
        root.destroy();return 'Added 10 varied evolving cloud layers';
    }
}

