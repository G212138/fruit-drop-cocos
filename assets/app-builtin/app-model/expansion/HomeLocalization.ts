/** 首页语言键；所有可翻译文案集中管理，品牌标题不参与翻译。 */
export type HomeTextKey = 'play' | 'themes' | 'level' | 'editor';
/** 首页首批语言；后续语言可直接补充同结构词条。 */
export const homeMessages: Record<string, Record<HomeTextKey, string>> = {
    en: { play: 'PLAY', themes: 'THEMES', level: 'Level {level}', editor: 'Level Editor' },
    zh: { play: '开始游戏', themes: '主题', level: '第 {level} 关', editor: '关卡编辑器' },
    de: { play: 'SPIELEN', themes: 'DESIGNS', level: 'Level {level}', editor: 'Level-Editor' },
    fr: { play: 'JOUER', themes: 'THÈMES', level: 'Niveau {level}', editor: 'Éditeur de niveaux' },
    es: { play: 'JUGAR', themes: 'TEMAS', level: 'Nivel {level}', editor: 'Editor de niveles' },
    pt: { play: 'JOGAR', themes: 'TEMAS', level: 'Nível {level}', editor: 'Editor de níveis' },
    ja: { play: 'プレイ', themes: 'テーマ', level: 'レベル {level}', editor: 'レベルエディター' },
    ko: { play: '플레이', themes: '테마', level: '레벨 {level}', editor: '레벨 편집기' },
};
/**
 * 规范化系统语言并回退英文。
 * @param language 系统语言代码，例如 en-US 或 pt_BR。
 */
export function resolveHomeLanguage(language: string): string {
    const base = (language || 'en').toLowerCase().split(/[-_]/)[0];
    return Object.prototype.hasOwnProperty.call(homeMessages, base) ? base : 'en';
}
/**
 * 返回首页译文，使用占位符而非拼接语序。
 * @param language 系统语言或渠道指定语言。
 * @param key 文案键。
 * @param level 当前关卡编号。
 */
export function homeText(language: string, key: HomeTextKey, level = 1): string {
    return homeMessages[resolveHomeLanguage(language)][key].replace('{level}', String(level));
}
