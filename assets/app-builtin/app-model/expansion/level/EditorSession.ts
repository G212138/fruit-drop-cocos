import { EditorDraft } from './EditorDraft';
import { LevelDocument } from './LevelDocument';

/** 编辑器和试玩间的会话数据，不进入玩家进度存储。 */
export class EditorSession {
    /** 跨页面保持草稿，试玩返回时恢复完整快照。 */
    static readonly draft = new EditorDraft();
    /** 当前独立试玩配置；空表示正常游戏。 */
    static trial: LevelDocument | null = null;

    /** 返回编辑器前恢复草稿并结束试玩会话。 */
    static finishTrial(): void {
        this.draft.restoreTrial();
        this.trial = null;
    }
}
