import { platformKind } from '../../app-model/expansion/platform/PlatformRuntime';
import { DouyinMotion } from './DouyinMotion';

/** 手机动作输入的平台分发，其他平台暂不启用传感器。 */
export class PlatformMotion {
    /** 将正常游戏阶段的摇晃请求交给当前平台实现。 */
    static sync(enabled: boolean, request: () => void): void {
        if (platformKind() === 'douyin') DouyinMotion.sync(enabled, request);
    }
    /** 页面退出时释放平台动作监听。 */
    static stop(): void {
        DouyinMotion.stop();
    }
}
