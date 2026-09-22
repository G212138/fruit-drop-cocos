import { getPlatformGame, supportsPlatform, PlatformApi } from '../../../../../../app-builtin/app-model/expansion/platform/PlatformRuntime';
/** 结算分享只打开宿主好友选择，不更改通关、复活或奖励状态。 */
export class ResultShare {
    /** @param title 本地化分享标题。 @param level 累计关卡。 @param won 是否通关。 @param done 调用结果，非消息送达证明。 @param api 可注入测试宿主。 */
    static open(title: string, level: number, won: boolean, done: (result: 'opened' | 'unavailable' | 'failed') => void, api: PlatformApi | null = getPlatformGame()): void {
        if (!supportsPlatform(api, 'shareAppMessage')) {
            done('unavailable');
            return;
        }
        let finished = false;
        /** 仅接收本次SDK调用的第一个结果。 */
        const finish = (result: 'opened' | 'failed'): void => {
            if (finished) return;
            finished = true;
            done(result);
        };
        try {
            const options = {
                title,
                query: 'source=result&level=' + Math.max(1, Math.floor(level)) + '&result=' + (won ? 'won' : 'lost'),
                success: () => finish('opened'),
                fail: () => finish('failed'),
                // 抖音取消分享走独立回调，不把打开面板当作成功发奖。
                cancel: () => finish('failed'),
            };
            api!.shareAppMessage!(options);
        } catch {
            finish('failed');
        }
    }
}
