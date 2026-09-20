// @ts-nocheck
import * as cc from 'cc';
/** 仅编辑器裁短草地显示，物理容器及世界碰撞保持原位置。 */
@cc._decorator.ccclass('GrassCropAuthor')
export class GrassCropAuthor extends cc.Component {
    /** 原图853像素裁去底部110像素，按原830设计高度换算，顶部不动。 */
    async author() {
        const url='db://assets/app-bundle/app-view/page/game/native/PageGame.prefab';
        const info=await Editor.Message.request('asset-db','query-asset-info',url);
        const prefab:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(info.uuid,(e,a)=>e?reject(e):resolve(a)));
        const root=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(root,true);
        const floor=root.getChildByPath('BoardRoot/GameBoard/Floor');
        const theme=root.getComponents(cc.Component).find(c=>Array.isArray(c.frames)&&Array.isArray(c.targets));
        let art=floor.getChildByName('TerrainVisual');
        if(!art){art=new cc.Node('TerrainVisual');art.layer=floor.layer;art.parent=floor;art.addComponent(cc.UITransform);art.addComponent(cc.Sprite);art.setSiblingIndex(0);}
        const sprite=art.getComponent(cc.Sprite);sprite.spriteFrame=theme.frames[1];sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
        const height=830*743/853,shift=(830-height)/2;
        art.getComponent(cc.UITransform).setContentSize(750,height);art.setPosition(0,shift,0);
        const previous=floor.getComponent(cc.Sprite);if(previous)previous.enabled=false;
        theme.targets[1]=sprite;theme.terrainEdges=[];
        for(const name of ['TerrainEdgeLeft','TerrainEdgeRight']){
            const edge=floor.getChildByName(name);if(!edge)continue;
            edge.active=true;theme.terrainEdges.push(edge);
            const image=edge.children[0];image.getComponent(cc.UITransform).setContentSize(750,height);
            image.setPosition(image.position.x,shift,0);
        }
        const data=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);
        root.destroy();return 'grass-crop-v1: artwork height '+height+', top fixed; colliders untouched';
    }
}
