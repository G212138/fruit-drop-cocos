// @ts-nocheck
import * as cc from 'cc';
/** 调整共享字体所属资源包，避免同优先级随机归属编辑器资源。 */
@cc._decorator.ccclass('BundlePriorityRepair')
export class BundlePriorityRepair extends cc.Component {
/** 通过编辑器资产接口保存资源包优先级。 */
async author(){const url='db://assets/app-bundle/app-view/page/home/resources';const meta=await Editor.Message.request('asset-db','query-asset-meta',url);meta.userData.priority=5;await Editor.Message.request('asset-db','save-asset-meta',url,JSON.stringify(meta));return 'page-home-res priority 5';}
}
