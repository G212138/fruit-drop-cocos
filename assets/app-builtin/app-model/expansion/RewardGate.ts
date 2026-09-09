/** 可发起激励广告的业务用途，真实平台接入时复用相同定义。 */
export type RewardPlacement = 'expand-slot' | 'revive' | 'prop' | 'eliminate' | 'shuffle';
/** 一次激励请求，结果必须回传同一编号和用途。 */
export interface RewardRequest {
    /** 当前门禁实例内唯一请求编号。 */
    id: string;
    /** 本次奖励用途。 */
    placement: RewardPlacement;
}
/** 平台或开发模拟返回的结果，不直接发放游戏奖励。 */
export interface RewardResponse extends RewardRequest {
    /** 完整观看、取消、失败或当前不可用。 */
    status: 'completed' | 'cancelled' | 'failed' | 'unavailable';
    /** 开发模拟不能冒充真实广告收入事件。 */
    source: 'platform' | 'development';
}
/** 广告适配器边界，业务层不依赖具体平台 SDK。 */
export interface RewardProvider {
    /** @param request 当前请求，回传时不得改变编号或用途。 */
    show(request: RewardRequest): Promise<RewardResponse>;
}
/** 门禁校验后的结果，页面还需检查本局是否仍可接收对应奖励。 */
export type RewardDecision = 'rewarded' | 'cancelled' | 'failed' | 'unavailable' | 'busy' | 'stale';

/** 控制并发、过期和模拟来源，防止旧局广告回调影响新局。 */
export class RewardGate {
    /** 每次失效时递增的页面代次。 */
    private generation = 0;
    /** 单实例递增编号，避免重新请求复用旧编号。 */
    private sequence = 0;
    /** 进行中的唯一请求；空值表示可以发起新请求。 */
    private pending: string | null = null;

    /** @param provider 当前平台或开发适配器。 @param allowDevelopment 仅开发构建允许模拟完成结果。 */
    constructor(private readonly provider: RewardProvider, private readonly allowDevelopment: boolean) {}

    /** 页面退出或重开后，使此前所有未完成请求失效。 */
    invalidate(): void {
        this.generation++;
        this.pending = null;
    }

    /** @param placement 本次业务奖励用途；返回值不代表奖励已经发放。 */
    async request(placement: RewardPlacement): Promise<RewardDecision> {
        if (this.pending) return 'busy';
        const generation = this.generation;
        const request = {id: String(++this.sequence), placement};
        this.pending = request.id;
        try {
            const response = await this.provider.show(request);
            if (generation !== this.generation) return 'stale';
            if (!response || response.id !== request.id || response.placement !== placement) return 'failed';
            if (response.source !== 'platform' && response.source !== 'development') return 'failed';
            if (response.source === 'development' && !this.allowDevelopment) return 'unavailable';
            if (response.status === 'completed') return 'rewarded';
            return ['cancelled', 'failed', 'unavailable'].indexOf(response.status) >= 0 ? response.status : 'failed';
        } catch {
            return generation === this.generation ? 'failed' : 'stale';
        } finally {
            if (this.pending === request.id) this.pending = null;
        }
    }
}
