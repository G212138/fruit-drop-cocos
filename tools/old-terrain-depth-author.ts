// @ts-nocheck
import * as cc from 'cc';
/** 仅编辑器使用：将原风格加深版地块与已有两级锁墙对齐。 */
@cc._decorator.ccclass('OldTerrainDepthAuthor')
export class OldTerrainDepthAuthor extends cc.Component {
    /** 保留750设计像素宽，使用830高布局；洞底对齐新图片的水平石块上沿。 */
    async author() {
        const url='db://assets/app-bundle/app-view/page/game/native/PageGame.prefab';
        const info=await Editor.Message.request('asset-db','query-asset-info',url);
        const prefab:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(info.uuid,(e,a)=>e?reject(e):resolve(a)));
        const root=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(root,true);
        const floor=root.getChildByPath('BoardRoot/GameBoard/Floor');
        for(const w of floor.getComponents(cc.Widget))w.enabled=false;
        floor.setPosition(0,-408.538,0);
        floor.getComponent(cc.UITransform).setContentSize(750,830);
        // 保留老版洞宽与坡面碰撞；新增格仅延伸下方，图片洞底约在新布局第593行。
        floor.getComponent(cc.PolygonCollider2D).points=[[-46,-179],[51,-177],[48.5,145],[56,240],
            [578.4,519.1],[376.1,-416.9],[-378,-427],[-376,-280],[-576,522],[-53,242],[-44.1,140.6]].map(([x,y])=>new cc.Vec2(x,y));
        for(const name of ['TerrainEdgeLeft','TerrainEdgeRight']){
            const edge=floor.getChildByName(name);
            if(edge){edge.getComponent(cc.UITransform).setContentSize(96,830);edge.children[0].getComponent(cc.UITransform).setContentSize(750,830);}
        }
        const data=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);
        root.destroy();return 'old-style-depth-v1: floor 750x830, cavity bottom -179, slope restored';
    }
}
