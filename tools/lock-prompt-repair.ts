// @ts-nocheck
import * as cc from 'cc';
import { LockWallView } from './app-bundle/app-view/page/game/native/expansion/reward/LockWallView';
/** 仅编辑器修复已有锁墙的广告提示绑定，不改位置、尺寸及碰撞。 */
@cc._decorator.ccclass('LockPromptRepair')
export class LockPromptRepair extends cc.Component {
    /** 两个提示均独立于底图，上格默认显示，下格保持正常亮度且隐藏提示。 */
    async author() {
        const url='db://assets/app-bundle/app-view/page/game/native/PageGame.prefab';
        const info=await Editor.Message.request('asset-db','query-asset-info',url);
        const prefab:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(info.uuid,(e,a)=>e?reject(e):resolve(a)));
        const root=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(root,true);
        const meta=await Editor.Message.request('asset-db','query-asset-meta','db://assets/res-bundle/shared-ui/images/ad-video.png');
        const id=Object.values(meta.subMetas).find(x=>x.importer==='sprite-frame').uuid;
        const frame:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(id,(e,a)=>e?reject(e):resolve(a)));
        for(const name of ['LockWallLayout','LowerLockWallLayout']) {
            const layout=root.getChildByPath('BoardRoot/GameBoard/'+name);
            const wall=layout.getComponentInChildren(LockWallView);
            if(!wall)throw Error('缺少锁墙组件 '+name);
            let prompt=wall.visual.getChildByName('UnlockPrompt');
            if(!prompt){prompt=new cc.Node('UnlockPrompt');prompt.layer=wall.visual.layer;prompt.parent=wall.visual;prompt.addComponent(cc.UITransform).setContentSize(163,95);}
            const caption=wall.visual.getChildByName('UnlockCaption');
            if(caption)caption.parent=prompt;
            if(!prompt.getChildByName('UnlockCaption'))throw Error('缺少现有多语言文字');
            let icon=prompt.getChildByName('VideoIcon');
            if(!icon){icon=new cc.Node('VideoIcon');icon.layer=prompt.layer;icon.parent=prompt;icon.addComponent(cc.UITransform);icon.addComponent(cc.Sprite);}
            const sprite=icon.getComponent(cc.Sprite);sprite.spriteFrame=frame;sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
            icon.getComponent(cc.UITransform).setContentSize(43,32);icon.setPosition(0,16,0);
            const opacity=wall.visual.getComponent(cc.UIOpacity);if(opacity)opacity.opacity=255;
            wall.promptRoot=prompt;prompt.active=name==='LockWallLayout';wall.button.interactable=prompt.active;
        }
        const result=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,result.prefabData||result);
        root.destroy();return 'lock-prompt-repair-v1: 2 video icons and prompt bindings saved';
    }
}
