// @ts-nocheck
import * as cc from 'cc';
import { GameThemeView } from './app-bundle/app-view/page/game/native/expansion/board/GameThemeView';
import { ThemeSprite } from './app-bundle/app-view/page/game/native/expansion/board/ThemeSprite';
/** 仅在编辑器中扩展地形边缘；中央原图和碰撞体保持原尺寸。 */
@cc._decorator.ccclass('TerrainEdgeAuthor')
export class TerrainEdgeAuthor extends cc.Component {
    /** 在原地形左右各增加96设计像素的镜像边缘，随父地形一起摇晃。 */
    async author() {
        const url='db://assets/app-bundle/app-view/page/game/native/PageGame.prefab';
        const info=await Editor.Message.request('asset-db','query-asset-info',url);
        const prefab:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(info.uuid,(e,a)=>e?reject(e):resolve(a)));
        const allowed=['cc.UITransform','cc.Widget','3b952GDVrJP3YOgpJBC3G+m','5cacbCCMo5PKZU3eixxETz/'];
        prefab.data._components=prefab.data._components.filter(c=>c&&allowed.includes(cc.js.getClassId(c.constructor)));
        const root=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(root,true);
        const floor=root.getChildByPath('BoardRoot/GameBoard/Floor');
        const theme=root.getComponents(cc.Component).find(c => Array.isArray(c.frames) && Array.isArray(c.targets));
        for(const side of [-1,1]) {
            const name=side<0?'TerrainEdgeLeft':'TerrainEdgeRight';
            const old=floor.getChildByName(name);if(old){old.removeFromParent();old.destroy();}
            const edge=new cc.Node(name);edge.layer=cc.Layers.Enum.UI_2D;edge.parent=floor;
            edge.addComponent(cc.UITransform).setContentSize(96,740);edge.setPosition(side*423,0);
            edge.addComponent(cc.Mask).type=cc.Mask.Type.GRAPHICS_RECT;
            const image=new cc.Node('Terrain');image.layer=edge.layer;image.parent=edge;
            const transform=image.addComponent(cc.UITransform);
            const sprite=image.addComponent(cc.Sprite);sprite.spriteFrame=theme.frames[1];sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
            transform.setContentSize(750,740);image.setPosition(side*327,0);image.setScale(-1,1,1);
            const skin:any=image.addComponent(ThemeSprite);skin.target=sprite;skin.fruitFrame=theme.frames[1];skin.dessertFrame=theme.frames[6];skin.mouth=false;
        }
        const result=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,result.prefabData||result);root.destroy();return '左右各扩96设计像素';
    }
}
