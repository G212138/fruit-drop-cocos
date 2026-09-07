import { sys } from 'cc';
import { LevelProgress } from '../app-model/expansion/LevelProgress';
import BaseController from 'db://app/base/BaseController';
import { app } from '../../app/app';

/** 游戏流程入口，集中发布状态变化。 */
export class GameController extends BaseController<GameController, { Changed: () => void }>() {
    /** 本局是否为编辑器试玩，试玩胜利不写玩家进度。 */
    private trial = false;

    /** 懒加载进度，避免框架初始化前访问平台存储。 */
    private progressStore: LevelProgress | null = null;

    /** 提供本地关卡进度，业务状态不持有引擎节点。 */
    get progress(): LevelProgress {
        if (!this.progressStore) this.progressStore = new LevelProgress(sys.localStorage);
        return this.progressStore;
    }

    /** 初始化一局状态。 @param total 总水果数，单位个。 @param level 原关卡编号。 @param trial 是否为不写玩家进度的试玩。 */
    begin(total: number, level = 1, trial = false): void {
        this.trial = trial;
        app.store.game.begin(total, level);
        this.emit(GameController.Event.Changed);
    }

    /** 提交一次已校验的配对。 */
    matched(): void {
        const previous = app.store.game.phase;
        app.store.game.removePair();
        if (!this.trial && previous === 'playing' && app.store.game.phase === 'won') {
            this.progress.complete(app.store.game.level);
        }
        this.emit(GameController.Event.Changed);
    }

    /** 提交失败并通知界面。 */
    lose(): void {
        app.store.game.lose();
        this.emit(GameController.Event.Changed);
    }

    /**
     * 奖励流程批准复活后恢复原局数据，棋盘随后应用回收或强制配对。
     * @returns 是否成功恢复；失败时不得继续修改水果或发放奖励。
     */
    revive(): boolean {
        if (!app.store.game.revive()) return false;
        this.emit(GameController.Event.Changed);
        return true;
    }
}
