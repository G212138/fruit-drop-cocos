import { EditorSession } from '../../../../../app-builtin/app-model/expansion/level/EditorSession';
import { DEV } from 'cc/env';
import { RewardGate } from '../../../../../app-builtin/app-model/expansion/RewardGate';
import { DevelopmentRewardPanel } from './expansion/reward/DevelopmentRewardPanel';
import { _decorator, Node, Prefab, JsonAsset, instantiate, isValid } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
import { GameController } from '../../../../../app-builtin/app-controller/GameController';
import { GameBoard } from './expansion/board/GameBoard';
import { BoardEvents } from './expansion/board/BoardEvents';
import { GameHud } from './expansion/hud/GameHud';
import { SettingsPanel } from './expansion/settings/SettingsPanel';
import { GameSettings } from '../../../../../app-builtin/app-model/expansion/GameSettings';
import { PreferencesSnapshot } from '../../../../../app-builtin/app-model/expansion/GamePreferences';
import { countFruits, parseLevel, loadCampaignLevel } from './expansion/level/LevelDefinition';
const { ccclass, property } = _decorator;

/** 游戏页面负责装配预制体、连接状态和切换结算界面。 */
@ccclass('PageGame')
export class PageGame extends BaseView.BindController(GameController) {
    /** 页面预制体中的棋盘挂载点，加载完成后实例化到这里。 */
    @property(Node)
    boardRoot: Node = null!;

    /** 页面预制体中的 HUD 挂载点，独立于棋盘生命周期。 */
    @property(Node)
    hudRoot: Node = null!;

    /** 本显示周期实例化的棋盘；退出页面后销毁。 */
    private board: GameBoard | null = null;
    /** 独立 HUD 实例，所有标签由预制体绑定。 */
    private hud: GameHud | null = null;
    /** 本显示周期独立设置面板，关闭后保留至页面退出。 */
    private settings: SettingsPanel | null = null;
    /** 独立音频副作用协调器，不改变本局游戏状态。 */
    private readonly settingsController = app.controller.settings;
    /** 当前页广告门禁，重开和退出时令旧请求失效。 */
    private rewardGate: RewardGate | null = null;
    /** 只在开发环境加载的独立广告结果模拟面板。 */
    private developmentReward: DevelopmentRewardPanel | null = null;
    /** 异步加载代次，拒绝上一局迟到的回调。 */
    private generation = 0;
    /** 是否已打开本局结算，防止重复弹窗。 */
    private ended = false;
    /** 关卡配置与棋盘均已就绪才允许开始。 */
    private ready = false;

    /** 本次请求的原版关卡编号，从一开始。 */
    private levelNumber = 1;
    /** 当前加载失败的用户可读说明；空字符串表示没有错误。 */
    private loadError = '';

    /**
     * 每次显示重新装配本局，并使旧异步加载回调失效。
     * @param data 页面传入的关卡或结算参数；未传关卡时读取存档。
     */
    onShow(data?: { level?: number }): void {
        const generation = ++this.generation;
        this.levelNumber = EditorSession.trial ? 1 : data?.level ?? this.controller.progress.level;
        this.loadError = '';
        this.ended = false;
        this.ready = false;
        this.releaseChildren();
        this.settingsController.begin();
        this.rewardGate = new RewardGate({show: request => {
            if (DEV && this.developmentReward) return this.developmentReward.show(request);
            return Promise.resolve({...request, status:'unavailable', source:'platform'});
        }}, DEV);
        this.controller.targetOff(this);
        this.controller.on(GameController.Event.Changed, this.refreshState, this);
        this.loadBoard(generation);
        this.loadHud(generation);
        this.loadSettings(generation);
        if (DEV) this.loadDevelopmentReward(generation);
    }

    /**
     * 判断异步结果是否仍属于当前显示周期。
     * @param generation 发起异步加载时记录的页面代次。
     */
    private isCurrent(generation: number): boolean {
        return isValid(this.node) && generation === this.generation;
    }

    /**
     * 实例化编辑器制作的棋盘预制体并连接业务通知。
     * @param generation 发起异步加载时记录的页面代次。
     */
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
            node.on('expand-request', this.requestExpansion, this);
            this.loadLevel(generation);
        });
    }

    /**
     * 加载并校验数据，再开始状态机和棋盘。
     * @param generation 发起异步加载时记录的页面代次。
     */
    private loadLevel(generation: number): void {
        this.loadRes('levels/original-levels', JsonAsset, asset => {
            if (!this.isCurrent(generation)) return;
            try {
                if (!asset || !this.board) {
                    throw new Error('关卡或棋盘组件缺失');
                }
                if (!EditorSession.trial && this.levelNumber > this.controller.progress.level) throw new Error('该关卡尚未解锁');
                const level = EditorSession.trial
                    ? parseLevel({ ...EditorSession.trial, level: 1 }, 1)
                    : loadCampaignLevel(asset.json.levels, this.levelNumber);
                this.ready = true;
                this.controller.begin(countFruits(level), level.number, !!EditorSession.trial);
                this.board.begin(level);
            } catch (error) {
                this.reportLoadError(String(error));
            }
        });
    }

    /**
     * 实例化独立 HUD，节点和标签均来自预制体。
     * @param generation 发起异步加载时记录的页面代次。
     */
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
            node.on('return-home', this.returnHome, this);
            node.on('replay-first', this.replayFirst, this);
            node.on('open-settings', this.openSettings, this);
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
        if (this.loadError) this.hud?.showError(this.levelNumber, this.loadError);
        else this.hud?.render(this.levelNumber, this.ready ? state.remaining : 0,
            this.ready ? state.total : 0, this.controller.progress.warning);
        const finished = state.phase === 'won' || state.phase === 'lost';
        if (!this.ready || this.ended || !finished) return;
        this.ended = true;
        this.board?.stop();
        this.showResult();
    }

    /** @param notice 广告取消或失败时在结算面板显示的说明，省略则显示胜负结果。 */
    private showResult(notice?: string): void {
        const generation = this.generation;
        app.manager.ui.show({ name: 'PopResult', data: {
            won: app.store.game.phase === 'won', level: this.levelNumber, notice,
            onRevive: this.board?.canRevive ? () => {
                if (this.isCurrent(generation)) void this.requestRevive();
            } : undefined,
        } });
    }

    /** 在失败原局请求激励复活，只有有效完成结果才恢复状态和棋盘。 */
    private async requestRevive(): Promise<void> {
        if (!this.rewardGate || !this.board?.canRevive || app.store.game.phase !== 'lost') return;
        const generation = this.generation;
        const result = await this.rewardGate.request('revive');
        if (!this.isCurrent(generation) || app.store.game.phase !== 'lost' || !this.board?.canRevive) return;
        if (result !== 'rewarded') {
            if (result === 'busy') return;
            this.showResult(result === 'cancelled' ? '已取消，本局未改变' : '广告暂不可用，请重试');
            return;
        }
        this.ended = false;
        if (!this.controller.revive()) return;
        if (!this.board.revive()) {
            this.controller.lose();
            return;
        }
        this.hud?.showNotice('继续本关');
    }

    /**
     * 资源错误不冒充正常结算，停止本局并记录真实原因。
     * @param message 用户可读的加载失败原因。
     */
    private reportLoadError(message: string): void {
        this.board?.stop();
        this.ready = false;
        this.loadError = message;
        this.refreshState();
        console.warn('[PageGame] ' + message);
    }

    /** 返回首页，暂停当前关卡的输入和物理。 */
    private returnHome(): void {
        this.generation++;
        this.controller.targetOff(this);
        this.releaseChildren();
        app.manager.ui.show({ name: EditorSession.trial ? 'PageEditor' : 'PageHome' });
    }

    /** @param generation 当前显示代次，过期加载不能挂回已经退出的页面。 */
    private loadSettings(generation: number): void {
        this.loadRes('prefabs/SettingsPanel', Prefab, prefab => {
            if (!this.isCurrent(generation)) return;
            if (!prefab) {
                this.reportLoadError('设置预制体加载失败');
                return;
            }
            const node = instantiate(prefab);
            node.active = false;
            node.parent = this.hudRoot;
            this.settings = node.getComponent(SettingsPanel);
            node.on('setting-request', this.changeSetting, this);
            node.on('settings-action', this.settingsAction, this);
        });
    }

    /** 打开原版设置面板；其遮罩阻止点击穿透，但不暂停物理和计时。 */
    private openSettings(): void {
        if (!this.settings || !this.ready || this.ended) return;
        this.settings.node.setSiblingIndex(this.hudRoot.children.length - 1);
        this.settings.open(GameSettings.current.snapshot, GameSettings.current.warning);
    }

    /** @param key 独立设置行请求变更的设置项。 */
    private changeSetting(key: keyof PreferencesSnapshot): void {
        const warning = this.settingsController.toggle(key);
        this.settings?.render(GameSettings.current.snapshot, warning);
    }

    /** @param action 面板淡出后的导航意图；重开使用当前正式关或当前试玩配置。 */
    private settingsAction(action: 'continue' | 'home' | 'restart'): void {
        if (action === 'home') this.returnHome();
        else if (action === 'restart') this.onShow({ level: this.levelNumber });
    }

    /** @param generation 当前显示代次；正式构建不会加载开发模拟界面。 */
    private loadDevelopmentReward(generation: number): void {
        this.loadRes('prefabs/DevelopmentRewardPanel', Prefab, prefab => {
            if (!this.isCurrent(generation) || !prefab) return;
            const node = instantiate(prefab);
            node.active = false;
            node.parent = this.hudRoot;
            this.developmentReward = node.getComponent(DevelopmentRewardPanel);
        });
    }

    /** 请求激励扩槽，校验结果和页面代次后才改变物理与判负规则。 */
    private async requestExpansion(): Promise<void> {
        if (!this.rewardGate || !this.board?.canExpand || this.ended) return;
        const generation = this.generation;
        const result = await this.rewardGate.request('expand-slot');
        if (!this.isCurrent(generation) || this.ended) return;
        if (result === 'rewarded') {
            if (this.board?.expandSlot()) this.hud?.showNotice('底部空间已扩展');
        } else if (result === 'cancelled') this.hud?.showNotice('已取消，底部空间未改变');
        else if (result === 'failed') this.hud?.showNotice('广告暂时无法完成，请稍后重试');
        else if (result === 'unavailable') this.hud?.showNotice('广告暂不可用，请稍后重试');
    }

    /** 未开放关卡提供明确的重玩入口，不修改已保存进度。 */
    private replayFirst(): void {
        this.onShow({ level: 1 });
    }

    /** 解除旧局监听并释放通过预制体创建的子界面。 */
    private releaseChildren(): void {
        this.rewardGate?.invalidate();
        this.rewardGate = null;
        if (this.developmentReward && isValid(this.developmentReward.node)) {
            this.developmentReward.cancel();
            this.developmentReward.node.destroy();
        }
        this.developmentReward = null;
        this.settingsController.end();
        if (this.settings && isValid(this.settings.node)) {
            this.settings.node.targetOff(this);
            this.settings.node.destroy();
        }
        this.settings = null;
        if (this.board && isValid(this.board.node)) {
            this.board.clear();
            this.board.node.targetOff(this);
            this.board.node.destroy();
        }
        if (this.hud && isValid(this.hud.node)) {
            this.hud.node.targetOff(this);
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
