import { assetManager, sp, Node, UIOpacity, _decorator, tween } from 'cc';
import BaseAppInit from '../../../extensions/app/assets/base/BaseAppInit';
/** 启动包只访问宿主已有接口，不能静态引用尚未下载的业务分包。 */
declare const TTMinis: { game?: {
    /** 宿主加载进度接口；范围 0 到 1。 */
    setLoadingProgress?: (options: { progress: number; success: () => void; fail: () => void }) => void;
} } | undefined;
// 在启动包阶段引用骨骼模块，让引擎在基础设施初始化期间注册 Spine WASM。
// 避免首次从关卡编辑器进入游戏时才加载骨骼分包，错过初始化委托。
void sp.Skeleton;
const { ccclass, property } = _decorator;

@ccclass('AppInit')
export class AppInit extends BaseAppInit {
    /** 启动画面中由预制体绑定的标志节点。 */
    @property(Node)
    private logo: Node;

    /** 首页、游戏页跨包引用的资源包；只注册资源目录，不提前实例化页面。 */
    private readonly sharedResourceBundles = ['page-game-res', 'page-home-res', 'pop-result-res'];

    /** 待注册的共享资源包索引；全部完成后才放行默认首页。 */
    private sharedResourceIndex = 0;

    /**
    * 获得用户资源总量，这里返回几，就需要用户自行调用几次nextInit
    */
    protected getUserAssetNum(): number {
        return 2;
    }

    /** 框架业务脚本注册完毕后，补齐默认页面和游戏页面的跨包资源依赖。 */
    protected onUserInit(): void {
        this.loadNextSharedResourceBundle();
    }

    /** 依次注册共享资源包；失败保留启动界面，并按 1 秒间隔重试当前包。 */
    private loadNextSharedResourceBundle(): void {
        if (this.sharedResourceIndex >= this.sharedResourceBundles.length) {
            this.nextInit();
            return;
        }
        const bundleName = this.sharedResourceBundles[this.sharedResourceIndex];
        assetManager.loadBundle(bundleName, (error) => {
            if (!this.isValid) return;
            if (error) {
                console.warn(`[AppInit] 共享资源包 ${bundleName} 加载失败，1 秒后重试`, error);
                this.scheduleOnce(() => this.loadNextSharedResourceBundle(), 1);
                return;
            }
            this.sharedResourceIndex += 1;
            this.loadNextSharedResourceBundle();
        });
    }

    /** 播放启动标志淡入淡出，并通知框架资源准备完成。 */
    protected onLoad() {
        this.reportPlatformProgress(0);
        // 执行初始化操作
        const opacity = this.logo.getComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity)
            .to(0.5, { opacity: 255 })
            .delay(1)
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.nextInit();
            })
            .start();
    }

    // BaseAppInit中使用start方法作为初始化入口，如果重写start方法，请注意调用父类方法
    // protected start() {  }

    /** 初始化结束后释放启动界面。 */
    protected onFinish() {
        this.reportPlatformProgress(1);
        // 执行完成操作
        this.node.destroy();
    }

    /** @param progress 框架启动阶段进度；仅调用宿主，不加载任何业务分包。 */
    private reportPlatformProgress(progress: number): void {
        try {
            if (typeof TTMinis !== 'undefined') {
                TTMinis.game?.setLoadingProgress?.({ progress, success: () => {}, fail: () => {} });
            }
        } catch { /* 平台进度通知失败不能阻塞 XForge 加载业务分包。 */ }
    }
}
