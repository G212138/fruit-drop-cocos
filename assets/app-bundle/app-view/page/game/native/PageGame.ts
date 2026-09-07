import { _decorator, Node, Prefab, JsonAsset, instantiate, isValid } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
import { GameController } from '../../../../../app-builtin/app-controller/GameController';
import { GameBoard } from './expansion/board/GameBoard';
import { BoardEvents } from './expansion/board/BoardEvents';
import { GameHud } from './expansion/hud/GameHud';
import { countFruits, parseLevel } from './expansion/level/LevelDefinition';
const { ccclass, property } = _decorator;

/** 游戏页面负责装配预制体、连接状态和切换结算界面。 */
@ccclass('PageGame')
export class PageGame extends BaseView.BindController(GameController) {
    @property(Node)
    boardRoot: Node = null!;

    @property(Node)
    hudRoot: Node = null!;

    private board: GameBoard | null = null;
    private hud: GameHud | null = null;
    private generation = 0;
    private ended = false;
    private ready = false;

    /** 每次显示重新装配本局，并使旧异步加载回调失效。 */
    onShow(): void {
        const generation = ++this.generation;
        this.ended = false;
        this.ready = false;
        this.releaseChildren();
        this.controller.targetOff(this);
        this.controller.on(GameController.Event.Changed, this.refreshState, this);
        this.loadBoard(generation);
        this.loadHud(generation);
    }

    /** 判断异步结果是否仍属于当前显示周期。 */
    private isCurrent(generation: number): boolean {
        return isValid(this.node) && generation === this.generation;
    }

    /** 实例化编辑器制作的棋盘预制体并连接业务通知。 */
    private loadBoard(generation: number): void {
        this.loadRes('prefabs/GameBoard', Prefab, prefab => {
            if (!this.isCurrent(generation)) return;
            if (!prefab) {
                this.reportLoadError('棋盘预制体加载失败');
                return;
            }
            const node = instantiate(prefab);
            node.parent = this.boardRoot;
            this.board = node.getComponent(GameBoard);
            node.on(BoardEvents.Matched, this.onMatched, this);
            node.on(BoardEvents.Failed, this.onFailed, this);
            this.loadLevel(generation);
        });
    }

    /** 加载并校验数据，再开始状态机和棋盘。 */
    private loadLevel(generation: number): void {
        this.loadRes('levels/level-001', JsonAsset, asset => {
            if (!this.isCurrent(generation)) return;
            try {
                if (!asset || !this.board) {
                    throw new Error('关卡或棋盘组件缺失');
                }
                const level = parseLevel(asset.json);
                this.ready = true;
                this.controller.begin(countFruits(level));
                this.board.begin(level);
            } catch (error) {
                this.reportLoadError(String(error));
            }
        });
    }

    /** 实例化独立 HUD，节点和标签均来自预制体。 */
    private loadHud(generation: number): void {
        this.loadRes('prefabs/GameHud', Prefab, prefab => {
            if (!this.isCurrent(generation)) return;
            if (!prefab) {
                this.reportLoadError('HUD 预制体加载失败');
                return;
            }
            const node = instantiate(prefab);
            node.parent = this.hudRoot;
            this.hud = node.getComponent(GameHud);
            this.refreshState();
        });
    }

    /** 棋盘已确认一对有效消除，交由控制器更新权威状态。 */
    private onMatched(): void {
        this.controller.matched();
    }

    /** 棋盘报告失败，交由控制器结束当前局。 */
    private onFailed(): void {
        this.controller.lose();
    }

    /** 将状态映射到显示，并确保结算只打开一次。 */
    private refreshState(): void {
        const state = app.store.game;
        this.hud?.render(state.remaining, state.total);
        const finished = state.phase === 'won' || state.phase === 'lost';
        if (!this.ready || this.ended || !finished) return;
        this.ended = true;
        this.board?.stop();
        app.manager.ui.show({ name: 'PopResult', data: { won: state.phase === 'won' } });
    }

    /** 资源错误不冒充正常结算，停止本局并记录真实原因。 */
    private reportLoadError(message: string): void {
        this.board?.stop();
        this.generation++;
        console.error('[PageGame] ' + message);
    }

    /** 解除旧局监听并释放通过预制体创建的子界面。 */
    private releaseChildren(): void {
        if (this.board && isValid(this.board.node)) {
            this.board.stop();
            this.board.node.targetOff(this);
            this.board.node.destroy();
        }
        if (this.hud && isValid(this.hud.node)) {
            this.hud.node.destroy();
        }
        this.board = null;
        this.hud = null;
    }

    /** 隐藏页面后拒绝旧回调并停止棋盘。 */
    onHide(): void {
        this.generation++;
        this.controller.targetOff(this);
        this.releaseChildren();
    }

    /** 页面销毁后取消异步结果及控制器监听。 */
    onDestroy(): void {
        this.generation++;
        this.controller.targetOff(this);
    }
}
