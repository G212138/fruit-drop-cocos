import { _decorator, CCString, Component, Label } from 'cc';
import { GameLanguage } from '../../app-model/expansion/GameLanguage';
import { LanguageKey } from '../../app-model/expansion/LanguageCatalog';
const { ccclass, property } = _decorator;

/** 预制体中的静态译文标签；复用已有 Label，不在运行时创建 UI。 */
@ccclass('LocalizedLabel')
export class LocalizedLabel extends Component {
    /** 统一词条键，制作时写入预制体。 */
    @property({ type: CCString }) key = '';
    /** 结算按钮使用大写拉丁字母；不改变原始翻译或中文。 */
    @property uppercase = false;
    /** 稳定监听引用，确保禁用后不会积累回调。 */
    private readonly refreshLanguage = (): void => this.refresh();
    /** 显示时同步当前语言并监听设置变化。 */
    onEnable(): void { this.refresh(); GameLanguage.subscribe(this.refreshLanguage); }
    /** 隐藏时移除监听。 */
    onDisable(): void { GameLanguage.unsubscribe(this.refreshLanguage); }
    /** 更新当前节点已有标签，使用系统字体覆盖东南亚文字。 */
    private refresh(): void {
        const label = this.getComponent(Label);
        if (label && this.key) {
            const text = GameLanguage.text(this.key as LanguageKey);
            label.string = this.uppercase ? text.toLocaleUpperCase() : text;
        }
    }
}
