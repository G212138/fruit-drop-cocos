import { game, input, Input, Node, isValid } from 'cc';
import { app } from '../../../app/app';
import { PlatformLifecycle } from './PlatformLifecycle';
import { getPlatformGame, supportsPlatform, PlatformApi } from '../../app-model/expansion/platform/PlatformRuntime';
import { platformInterstitialId } from '../../app-model/expansion/platform/PlatformRuntime';

/** 非游戏进行期间，前台同页30秒无操作展示插屏，不发放奖励。 */
export class IdleInterstitial {
    /** 全进程只注册一次。 */
    private static installed = false;
    /** 上次操作或切页的毫秒时间。 */
    private static lastActivity = 0;
    /** 插屏请求锁。 */
    private static busy = false;
    /** 当前监听的UI根节点，切换场景时重新绑定。 */
    private static touchRoot: Node | null = null;
    /** 捕获触摸，避免弹窗阻止传播后全局监听漏报操作。 */
    private static bindTouchRoot(): void {
        const root = app.manager.ui.canvas?.node ?? null;
        if (root === this.touchRoot) return;
        for (const event of [Node.EventType.TOUCH_START, Node.EventType.TOUCH_MOVE,
            Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL]) {
            if (isValid(this.touchRoot)) this.touchRoot!.off(event, this.reset, this, true);
            root?.on(event, this.reset, this, true);
        }
        this.touchRoot = root;
        this.reset();
    }
    /** 稳定操作监听引用。 */
    private static readonly reset = (): void => { this.lastActivity = Date.now(); };
    /** 首页就绪后安装；不支持插屏的环境不启动。 */
    static install(): void {
        const api = getPlatformGame();
        if (this.installed || !platformInterstitialId() || !supportsPlatform(api, 'createInterstitialAd')) return;
        this.installed = true;
        this.bindTouchRoot();
        this.reset();
        for (const event of [Input.EventType.TOUCH_START, Input.EventType.TOUCH_MOVE, Input.EventType.TOUCH_END,
            Input.EventType.MOUSE_DOWN, Input.EventType.MOUSE_MOVE, Input.EventType.MOUSE_WHEEL, Input.EventType.KEY_DOWN] as const) {
            input.on(event, this.reset);
        }
        app.manager.ui.on('onShow', this.reset);
        app.manager.ui.on('onHide', this.reset);
        api?.onShow?.(this.reset);
        api?.onHide?.(this.reset);
        // 广告会暂停引擎，使用独立250毫秒定时检查。
        setInterval(() => this.tick(), 250);
    }
    /** 游戏进行中、后台与广告等待期间不累计闲置时间。 */
    private static tick(): void {
        this.bindTouchRoot();
        const playing = app.manager.ui.isShow('PageGame') && app.store.game.phase === 'playing';
        if (playing || this.busy || PlatformLifecycle.blocked || game.isPaused()) {
            this.reset();
            return;
        }
        if (Date.now() - this.lastActivity < 30000) return;
        this.reset();
        this.show();
    }
    /** 创建一次性广告，异常或关闭都恢复游戏，不处理奖励。 */
    private static show(): void {
        const api = getPlatformGame();
        if (!platformInterstitialId() || !supportsPlatform(api, 'createInterstitialAd')) return;
        this.busy = true;
        PlatformLifecycle.setInterstitialVisible(true);
        let ad: ReturnType<NonNullable<PlatformApi['createInterstitialAd']>> | null = null;
        let settled = false;
        /** 180秒失联保护，防止SDK不回调导致游戏永久暂停。 */
        const timeout = setTimeout(() => finish(), 180000);
        /** 关闭、失败、超时仅清理一次。 */
        const finish = (): void => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            try { ad?.offClose(finish); } catch { /* 继续恢复。 */ }
            try { ad?.offError(finish); } catch { /* 继续恢复。 */ }
            this.busy = false;
            this.reset();
            PlatformLifecycle.setInterstitialVisible(false);
        };
        try {
            ad = api!.createInterstitialAd!({ adUnitId: platformInterstitialId() });
            ad.onClose(finish);
            ad.onError(finish);
            Promise.resolve(ad.show()).catch(finish);
        } catch { finish(); }
    }
}
