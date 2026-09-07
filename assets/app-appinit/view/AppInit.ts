import { sp, Node, UIOpacity, _decorator, tween } from 'cc';
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

    /**
    * 获得用户资源总量，这里返回几，就需要用户自行调用几次nextInit
    */
    protected getUserAssetNum(): number {
        return 1;
    }

    /** 播放启动标志淡入淡出，并通知框架资源准备完成。 */
    protected onLoad() {
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
        // 执行完成操作
        this.node.destroy();
    }
}