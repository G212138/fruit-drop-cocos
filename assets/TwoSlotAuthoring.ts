// @ts-nocheck
import * as cc from 'cc';
import { GameBoard } from './app-bundle/app-view/page/game/native/expansion/board/GameBoard';
import { LockWallView } from './app-bundle/app-view/page/game/native/expansion/reward/LockWallView';
/** 仅编辑器中制作两级扩槽，运行时不创建界面节点。 */
@cc._decorator.ccclass('TwoSlotAuthoring')
export class TwoSlotAuthoring extends cc.Component {
    /** 把广告图标和文字放在可独立显隐的提示节点中，底图不再含图标。 */
    async prepareLock(wall) {
        const opacity=wall.visual.getComponent(cc.UIOpacity);
        if(opacity)opacity.opacity=255;
        let prompt=wall.visual.getChildByName('UnlockPrompt');
        if(!prompt){prompt=new cc.Node('UnlockPrompt');prompt.layer=wall.node.layer;prompt.parent=wall.visual;prompt.addComponent(cc.UITransform).setContentSize(163,95);}
        const caption=wall.visual.getChildByName('UnlockCaption');
        if(caption)caption.parent=prompt;
        let icon=prompt.getChildByName('VideoIcon');
        if(!icon){
            icon=new cc.Node('VideoIcon');icon.layer=prompt.layer;icon.parent=prompt;
            const transform=icon.addComponent(cc.UITransform);
            const sprite=icon.addComponent(cc.Sprite);
            const meta=await Editor.Message.request('asset-db','query-asset-meta','db://assets/app-bundle/app-view/page/game/resources/textures/hud/video.png');
            const uuid=Object.values(meta.subMetas).find(x=>x.importer==='sprite-frame').uuid;
            sprite.spriteFrame=await new Promise((resolve,reject)=>cc.assetManager.loadAny(uuid,(e,a)=>e?reject(e):resolve(a)));
            sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;transform.setContentSize(43,32);icon.setPosition(0,16,0);
        }
        wall.promptRoot=prompt;
        const event=new cc.EventHandler();event.target=wall.node;event.component='LockWallView';event.handler='requestUnlock';
        wall.button.clickEvents=[event];
    }
    /** 加深90设计像素、制作第二锁墙、调整物理与袋子布局。 */
    async author() {
        const url='db://assets/app-bundle/app-view/page/game/native/PageGame.prefab';
        const info=await Editor.Message.request('asset-db','query-asset-info',url);
        const prefab:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(info.uuid,(e,a)=>e?reject(e):resolve(a)));
        const root=cc.instantiate(prefab);
        cce.Prefab.removePrefabInfoFromNode(root,true);
        const board=root.getChildByPath('BoardRoot/GameBoard');
        const view=board.getComponent(GameBoard);
        const upper=board.getChildByName('LockWallLayout');
        for(const w of upper.getComponents(cc.Widget))w.enabled=false;
        upper.setPosition(0,-397.831,0);
        const old=board.getChildByName('LowerLockWallLayout');
        if(old){old.removeFromParent();old.destroy();}
        const lower=cc.instantiate(upper);
        lower.name='LowerLockWallLayout';lower.parent=board;lower.setPosition(0,-487.831,0);
        lower.setSiblingIndex(upper.getSiblingIndex()+1);
        const first=upper.getComponentInChildren(LockWallView);
        const second=lower.getComponentInChildren(LockWallView);
        for(const wall of [first,second]){
            await this.prepareLock(wall);
        }
        first.button.interactable=true;first.promptRoot.active=true;
        second.button.interactable=false;second.promptRoot.active=false;
        view.lockWallRoot=first.node;view.lowerLockWallRoot=second.node;
        const floor=board.getChildByName('Floor');
        for(const w of floor.getComponents(cc.Widget))w.enabled=false;
        floor.setPosition(0,-408.538,0);
        floor.getComponent(cc.UITransform).setContentSize(750,830);
        const theme=root.getComponents(cc.Component).find(c=>Array.isArray(c.frames)&&Array.isArray(c.targets));
        let art=floor.getChildByName('TerrainVisual');
        if(!art){art=new cc.Node('TerrainVisual');art.parent=floor;art.layer=floor.layer;art.addComponent(cc.UITransform);art.addComponent(cc.Sprite);art.setSiblingIndex(0);}
        const sprite=art.getComponent(cc.Sprite);sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame=theme.frames[1];
        art.getComponent(cc.UITransform).setContentSize(942,665);art.setPosition(0,82.5,0);
        if(floor.getComponent(cc.Sprite))floor.getComponent(cc.Sprite).destroy();
        theme.targets[1]=sprite;theme.terrainEdges=[];
        // 按新版图片轮廓：孔底约第605行，草皮收口约第210行；左右外延仍覆盖摇晃。
        floor.getComponent(cc.PolygonCollider2D).points=[[-52,-190],[52,-190],[52,155],[48,205],[578.4,525],
            [376.1,-416.9],[-378,-427],[-576,525],[-48,205],[-52,155]].map(([x,y])=>new cc.Vec2(x,y));
        for(const name of ['TerrainEdgeLeft','TerrainEdgeRight']){
            const edge=floor.getChildByName(name);edge.getComponent(cc.UITransform).setContentSize(96,830);
            edge.children[0].getComponent(cc.UITransform).setContentSize(750,830);
            edge.active=false;theme.terrainEdges.push(edge);
        }
        const bag=board.getChildByPath('RemovalEffects/BagLayout');
        for(const w of bag.getComponents(cc.Widget))w.enabled=false;
        bag.setPosition(0,-643.175,0);
        const data=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);
        root.destroy();
        const lockUrl='db://assets/app-bundle/app-view/page/game/resources/prefabs/LockWallView.prefab';
        const lockInfo=await Editor.Message.request('asset-db','query-asset-info',lockUrl);
        const lockPrefab:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(lockInfo.uuid,(e,a)=>e?reject(e):resolve(a)));
        const lockRoot=cc.instantiate(lockPrefab);cce.Prefab.removePrefabInfoFromNode(lockRoot,true);
        await this.prepareLock(lockRoot.getComponent(LockWallView));
        const lockData=cce.Prefab.generatePrefabDataFromNode(lockRoot);
        await Editor.Message.request('asset-db','save-asset',lockUrl,lockData.prefabData||lockData);lockRoot.destroy();
        return '已制作上下两锁墙、下格前置、90像素扩槽和新地形碰撞';
    }
}
