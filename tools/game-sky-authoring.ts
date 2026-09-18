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
        const rows=[[-340,510,350,175,105,3],[340,310,420,210,130,4.5],[-300,-420,480,240,150,5.5],[360,-650,540,270,165,6]];
        for(let i=0;i<rows.length;i++){
            const [x,y,w,h,opacity,speed]=rows[i];
            const n=new cc.Node('SkyCloud'+i);n.layer=bg.layer;n.parent=bg;n.setPosition(x,y);
            const transform=n.addComponent(cc.UITransform);
            const sprite=n.addComponent(cc.Sprite);sprite.spriteFrame=frame;sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
            transform.setContentSize(w,h);n.addComponent(cc.UIOpacity).opacity=opacity;
            n.addComponent(GameCloudMotion).speed=speed;
        }
        const data=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);
        root.destroy();return 'Added 4 realistic cloud layers';
    }
}
