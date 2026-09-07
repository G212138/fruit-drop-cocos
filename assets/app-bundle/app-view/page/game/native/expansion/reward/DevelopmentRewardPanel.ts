import { _decorator, Component, Label } from 'cc';
import { RewardProvider, RewardRequest, RewardResponse } from '../../../../../../../app-builtin/app-model/expansion/RewardGate';
const { ccclass, property } = _decorator;

/** 开发环境手动选择广告结果，不连接真实广告也不记录收入。 */
@ccclass('DevelopmentRewardPanel')
export class DevelopmentRewardPanel extends Component implements RewardProvider {
    /** 预制体中的用途说明与开发模拟标识。 */
    @property(Label)
    description: Label = null!;
    /** 当前等待开发人员选择的请求。 */
    private request: RewardRequest | null = null;
    /** 仅用于完成当前 Promise，不直接调用任何奖励方法。 */
    private resolve: ((response: RewardResponse) => void) | null = null;

    /** @param request 门禁传入的编号与用途。 */
    show(request: RewardRequest): Promise<RewardResponse> {
        this.finish('cancelled');
        this.request = request;
        this.description.string = '广告开发模拟\n用途：' + (request.placement === 'expand-slot' ? '扩展底部空间' : request.placement === 'revive' ? '复活并继续本关' : request.placement) + '\n本次操作不产生广告收入';
        this.node.setSiblingIndex(this.node.parent!.children.length - 1);
        this.node.active = true;
        return new Promise(resolve => { this.resolve = resolve; });
    }

    /** 开发人员模拟完整观看；是否发奖仍由门禁及页面裁决。 */
    complete(): void {
        this.finish('completed');
    }

    /** 模拟提前退出，必须保留原锁墙状态。 */
    cancel(): void {
        this.finish('cancelled');
    }

    /** 模拟加载或播放失败，允许用户之后重试。 */
    fail(): void {
        this.finish('failed');
    }

    /** @param status 本次开发模拟结果；清空回调后才返回结果，避免重入重复完成。 */
    private finish(status: RewardResponse['status']): void {
        const request = this.request;
        const resolve = this.resolve;
        this.request = null;
        this.resolve = null;
        this.node.active = false;
        if (request && resolve) resolve({...request, status, source:'development'});
    }

    /** 页面退出不能留下永不返回的开发广告请求。 */
    onDestroy(): void {
        this.finish('cancelled');
    }
}
