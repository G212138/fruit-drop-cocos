import { LoadingFlight } from './LoadingFlight';
import { FirstLaunch } from './FirstLaunch';
import { assetManager, sp, Node, UIOpacity, _decorator, Prefab, ProgressBar, Label } from 'cc';
import BaseAppInit from '../../../extensions/app/assets/base/BaseAppInit';
// 在启动包阶段引用骨骼模块，让引擎在基础设施初始化期间注册 Spine WASM。
// 避免首次从关卡编辑器进入游戏时才加载骨骼分包，错过初始化委托。
void sp.Skeleton;
const { ccclass, property } = _decorator;

@ccclass('AppInit')
export class AppInit extends BaseAppInit {
    /** 启动画面中由预制体绑定的标志节点。 */
    @property(Node)
    private logo: Node;

    /** 编辑器绑定的纸飞机加载表现。 */
    @property(LoadingFlight)
    private flight: LoadingFlight = null!;

    /** 已展示的阶段进度，范围 0～1；重试或资源总数增长时不倒退。 */
    private displayedProgress = 0;

    /** 首页依赖顺序：资源目录、结算脚本、游戏及设置脚本；只注册分包，不实例化页面。 */
    private readonly startupBundles = ['shared-items', 'shared-terrains', 'shared-ui', 'page-game-res', 'page-home-res', 'pop-result-res', 'pop-result', 'page-game', 'page-home'];

    /** 待注册的启动依赖包索引；全部完成后才放行默认首页。 */
    private startupBundleIndex = 0;

    /**
    * 获得用户资源总量，这里返回几，就需要用户自行调用几次nextInit
    */
    protected getUserAssetNum(): number {
        return 1;
    }

    /** 框架业务脚本注册完毕后，按依赖顺序注册默认页面所需的资源包和代码包。 */
    protected onUserInit(): void {
        this.setProgress(0.25);
        this.loadNextStartupBundle();
    }

    /** 依次注册启动依赖包；失败保留启动界面，并按 1 秒间隔重试当前包。 */
    private loadNextStartupBundle(): void {
        if (this.startupBundleIndex >= this.startupBundles.length) {
            this.loadHome();
            return;
        }
        const bundleName = this.startupBundles[this.startupBundleIndex];
        assetManager.loadBundle(bundleName, (error) => {
            if (!this.isValid) return;
            if (error) {
                console.warn(`[AppInit] 启动依赖包 ${bundleName} 加载失败，1 秒后重试`, error);
                this.scheduleOnce(() => this.loadNextStartupBundle(), 1);
                return;
            }
            this.startupBundleIndex += 1;
            this.setProgress(0.25 + 0.4 * this.startupBundleIndex / this.startupBundles.length);
            this.loadNextStartupBundle();
        });
    }

    /** 显示启动标志和进度；不使用定时动画伪造资源完成。 */
    protected onLoad() {
        this.setProgress(0);
        const opacity = this.logo?.getComponent(UIOpacity);
        if (opacity) opacity.opacity = 255;
    }

    /** 加载本次首屏预制体及依赖；按资源回调推进 65%～95%，失败后重试。 */
    private loadHome(): void {
        const page = FirstLaunch.page;
        const bundle = assetManager.getBundle(page === 'PageGame' ? 'page-game' : 'page-home');
        if (!bundle) {
            this.scheduleOnce(() => this.loadNextStartupBundle(), 1);
            return;
        }
        bundle.load(page, Prefab, (completed, total) => {
            if (this.isValid && total > 0) this.setProgress(0.65 + 0.3 * completed / total);
        }, (error) => {
            if (!this.isValid) return;
            if (error) {
                console.warn('[AppInit] 首屏资源加载失败，1 秒后重试', error);
                this.scheduleOnce(() => this.loadHome(), 1);
                return;
            }
            this.setProgress(0.95);
            this.nextInit();
        });
    }

    /** 框架管理器初始化占前 25%；排除最后一项业务初始化，避免提前满格。
     * @param completed 已完成的初始化任务数量。
     * @param total 管理器与业务初始化任务总量。
     */
    protected onProgress(completed: number, total: number): void {
        this.setProgress(0.25 * Math.min(1, completed / Math.max(1, total - 1)));
    }

    /** 更新游戏内可见进度，不调用仅支持 HTML5 的宿主进度接口。
     * @param progress 按真实完成阶段加权的比例，范围 0～1，并非下载字节比例。
     */
    private setProgress(progress: number): void {
        this.displayedProgress = Math.max(this.displayedProgress, Math.min(1, Math.max(0, progress)));
        if (this.flight) this.flight.setProgress(this.displayedProgress);

    }

    // BaseAppInit中使用start方法作为初始化入口，如果重写start方法，请注意调用父类方法
    // protected start() {  }

    /** 初始化结束后释放启动界面。 */
    protected onFinish() {
        FirstLaunch.complete();
        this.setProgress(1);
        // 执行完成操作
        this.node.destroy();
    }

}
