// @ts-nocheck
import * as cc from 'cc';
import { LockWallView } from './app-bundle/app-view/page/game/native/expansion/reward/LockWallView';
import { ThemeSprite } from './app-bundle/app-view/page/game/native/expansion/board/ThemeSprite';
/** 仅编辑器中把新灰石障碍嵌入现有凹槽，不改锁墙位置与碰撞体。 */
@cc._decorator.ccclass('FittedStoneAuthor')
export class FittedStoneAuthor extends cc.Component {
    /** 保存页面实例与独立预制体，提示保持独立显隐和原语言绑定。 */
    async author() {
        for(const url of ['db://assets/app-bundle/app-view/page/game/native/PageGame.prefab','db://assets/app-bundle/app-view/page/game/resources/prefabs/LockWallView.prefab']) {
            const info=await Editor.Message.request('asset-db','query-asset-info',url);
            const prefab:any=await new Promise((resolve,reject)=>cc.assetManager.loadAny(info.uuid,(e,a)=>e?reject(e):resolve(a)));
            const root=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(root,true);
            const walls=root.getComponentsInChildren(LockWallView);
            if(!walls.length)throw Error('缺少锁墙 '+url);
            for(const wall of walls) {
                const skin=wall.visual.getComponent(ThemeSprite);skin.lockPlug=true;
                const sprite=wall.visual.getComponent(cc.Sprite);sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
                wall.visual.getComponent(cc.UITransform).setContentSize(86,90);
                const prompt=wall.promptRoot;if(!prompt)throw Error('缺少提示绑定');
                prompt.getComponent(cc.UITransform).setContentSize(86,90);
                const icon=prompt.getChildByName('VideoIcon');icon.getComponent(cc.UITransform).setContentSize(32,24);icon.setPosition(0,16,0);
                const caption=prompt.getChildByName('UnlockCaption');caption.getComponent(cc.UITransform).setContentSize(82,28);caption.setPosition(0,-17,0);
                const label=caption.getComponent(cc.Label);label.fontSize=21;label.lineHeight=26;label.overflow=cc.Label.Overflow.SHRINK;
            }
            const data=cce.Prefab.generatePrefabDataFromNode(root);
            await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);root.destroy();
        }
        return 'fitted-stone-v1: 86x90 visual, 32x24 video, unchanged physics and lock positions';
    }
}
