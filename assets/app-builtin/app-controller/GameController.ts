import BaseController from 'db://app/base/BaseController';
import { app } from '../../app/app';

/** 游戏流程入口，集中发布状态变化。 */
export class GameController extends BaseController<GameController, { Changed: () => void }>() {
    /** 初始化一局状态。 */
    begin(total: number): void {
        app.store.game.begin(total);
        this.emit(GameController.Event.Changed);
    }

    /** 提交一次已校验的配对。 */
    matched(): void {
        app.store.game.removePair();
        this.emit(GameController.Event.Changed);
    }

    /** 提交失败并通知界面。 */
    lose(): void {
        app.store.game.lose();
        this.emit(GameController.Event.Changed);
    }
}
