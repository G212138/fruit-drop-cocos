// @ts-nocheck
import * as cc from 'cc';
/** 给启动页百分比使用启动包字体，不引用业务脚本。 */
@cc._decorator.ccclass('FontStartupAuthoring')
export class FontStartupAuthoring extends cc.Component {
/** 编辑器绑定启动页字体资源。 */
async author(){
const load=async(url)=>{const info=await Editor.Message.request('asset-db','query-asset-info',url);return new Promise((resolve,reject)=>cc.assetManager.loadAny(info.uuid,(e,a)=>e?reject(e):resolve(a)));};
const font=await load('db://assets/app-appinit/res/font/english.ttf');
const url='db://assets/app-appinit/view/AppInit.prefab';const prefab=await load(url);const root=cc.instantiate(prefab);cce.Prefab.removePrefabInfoFromNode(root,true);
for(const label of root.getComponentsInChildren(cc.Label)){label.font=font;label.useSystemFont=false;label.isBold=false;}
const data=cce.Prefab.generatePrefabDataFromNode(root);await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);root.destroy();return 'ok';
}
}
