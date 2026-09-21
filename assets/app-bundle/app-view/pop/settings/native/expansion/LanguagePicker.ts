import { _decorator, Component, Label, Node } from 'cc';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { LanguageChoice, languageNames } from '../../../../../../app-builtin/app-model/expansion/LanguageCatalog';
const { ccclass, property } = _decorator;

/** 设置内的语言选择器；选项节点与事件完全由预制体提供。 */
@ccclass('LanguagePicker')
export class LanguagePicker extends Component {
    /** 当前语言显示标签，预留长语言名宽度。 */
    @property(Label) currentLabel: Label = null!;
    /** 语言选项面板，默认隐藏。 */
    @property(Node) optionsRoot: Node = null!;
    /** 保存失败提示，不伪装已持久化。 */
    @property(Label) warningLabel: Label = null!;
    /** 语言事件的稳定回调。 */
    private readonly languageChanged = (): void => this.refresh();
    /** 每次打开设置时重置选项列表并刷新当前选择。 */
    onEnable(): void {
        this.optionsRoot.active = false;
        this.warningLabel.string = '';
        this.refresh();
        GameLanguage.subscribe(this.languageChanged);
    }
    /** 隐藏设置后解除监听。 */
    onDisable(): void { GameLanguage.unsubscribe(this.languageChanged); }
    /** 打开或收起预制体中的选项列表。 */
    toggle(): void {
        this.optionsRoot.active = !this.optionsRoot.active;
        if (this.optionsRoot.active) this.refresh();
    }
    /** @param event 编辑器按钮事件。 @param code 编辑器绑定的稳定语言代码。 */
    choose(event: unknown, code: string): void {
        const saved = GameLanguage.select(code as LanguageChoice);
        this.optionsRoot.active = false;
        this.warningLabel.string = saved ? '' : GameLanguage.text('saveError');
    }
    /** 刷新当前语言名称及选中状态。 */
    private refresh(): void {
        this.currentLabel.string = languageNames[GameLanguage.current];
        const content = this.optionsRoot.getChildByName('ScrollView')?.getChildByName('View')?.getChildByName('Content')
            || this.optionsRoot.getChildByName('View')?.getChildByName('Content')
            || this.optionsRoot.getChildByName('Content')
            || this.optionsRoot;
        for (const option of content.children) {
            if (!option.name.startsWith('Language_')) continue;
            const selected = option.name.slice('Language_'.length) === GameLanguage.choice;
            const checkmark = option.getChildByName('Checkmark');
            const selectedBackground = option.getChildByName('SelectedBackground');
            if (checkmark) checkmark.active = selected;
            if (selectedBackground) selectedBackground.active = selected;
            const normalBackground = option.getChildByName('RowPlate');
            if (normalBackground) normalBackground.active = !selected;
        }
    }
}
