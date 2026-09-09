import { sys } from 'cc';
import { LanguageChoice, LanguageKey, languageOptions, languageText, resolveLanguage } from './LanguageCatalog';

/** 会话级语言服务；默认跟随系统，手动选择单独存档，不改变音频设置格式。 */
export class GameLanguage {
    /** 版本化语言偏好键；旧玩家没有该键时自动使用系统语言。 */
    private static readonly storageKey = 'tumble-match.language.v1';
    /** 延迟读取的语言选择，避免脚本导入阶段调用平台存储。 */
    private static selected: LanguageChoice | null = null;
    /** 当前可见界面的语言刷新回调，关闭界面时解除。 */
    private static readonly listeners = new Set<() => void>();
    /** 当前偏好；损坏或不支持的存档回退跟随系统。 */
    static get choice(): LanguageChoice {
        if (this.selected === null) {
            try {
                const saved = sys.localStorage.getItem(this.storageKey) as LanguageChoice;
                this.selected = languageOptions.indexOf(saved) >= 0 ? saved : 'system';
            } catch { this.selected = 'system'; }
        }
        return this.selected;
    }
    /** 当前真正使用的语言；平台优先提供完整地区码。 */
    static get current(): string {
        return resolveLanguage(this.choice === 'system' ? (sys.languageCode || sys.language) : this.choice);
    }
    /** @param key 文案键。 @param values 命名替换参数。 */
    static text(key: LanguageKey, values: Record<string, string | number> = {}): string {
        return languageText(this.current, key, values);
    }
    /** @param choice 用户明确选择的语言；返回保存是否成功，失败仍应用本次选择。 */
    static select(choice: LanguageChoice): boolean {
        if (languageOptions.indexOf(choice) < 0) return false;
        this.selected = choice;
        let saved = true;
        try { sys.localStorage.setItem(this.storageKey, choice); } catch { saved = false; }
        for (const refresh of [...this.listeners]) refresh();
        return saved;
    }
    /** @param refresh 订阅者稳定的回调引用。 */
    static subscribe(refresh: () => void): void { this.listeners.add(refresh); }
    /** @param refresh 关闭界面时移除的回调。 */
    static unsubscribe(refresh: () => void): void { this.listeners.delete(refresh); }
}
