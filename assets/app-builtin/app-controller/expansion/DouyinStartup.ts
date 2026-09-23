import { DouyinLifecycle } from './DouyinLifecycle';
import { DouyinSilentLogin } from '../../app-model/expansion/platform/DouyinSilentLogin';
/** 抖音启动链只引用抖音服务，不安装自动广告。 */
export class DouyinStartup {
    /** 前后台与登录实现各自保证重复调用安全。 */
    static enter(): void {
        DouyinLifecycle.install();
        void DouyinSilentLogin.shared.login();
    }
}
