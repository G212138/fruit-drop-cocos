import { _decorator, Component, Font, Label } from 'cc';
import { GameLanguage } from '../../app-model/expansion/GameLanguage';
const { ccclass, property, requireComponent } = _decorator;
/** 按实际文字选择字体，覆盖翻译、数字及业务动态提示。 */
@ccclass('LanguageFont')
@requireComponent(Label)
export class LanguageFont extends Component {
    /** 中文使用项目 Bold 字体。 */
    @property(Font) chineseFont: Font = null!;
    /** 英文使用项目 XESENGLISHFONT_REGULAR 字体。 */
    @property(Font) englishFont: Font = null!;
    /** 上次检查的文字与语言，避免重复更新字形。 */
    private previous = '';
    /** 启用时立即更新字体。 */
    onEnable(): void { this.previous = ''; this.refresh(); }
    /** 在业务更新文本后同步字体，不改变布局或字号。 */
    lateUpdate(): void { this.refresh(); }
    /** 中文混排优先中文字体；其他非拉丁语言保留系统字体回退。 */
    private refresh(): void {
        const label = this.getComponent(Label);
        if (!label) return;
        const text = label.string;
        const locale = GameLanguage.current;
        const signature = locale + ':' + text;
        if (signature === this.previous) return;
        this.previous = signature;
        const chinese = /[\u3400-\u9fff]/.test(text) && !/[\u3040-\u30ff]/.test(text);
        const ascii = /^[\x00-\x7f\u2000-\u206f]*$/.test(text);
        const numeric = !/[a-zA-Z]/.test(text);
        const font = chinese || (ascii && numeric && locale === 'zh')
            ? this.chineseFont : ascii ? this.englishFont : null;
        label.font = font;
        label.useSystemFont = !font;
        if (font) label.isBold = false;
    }
}
