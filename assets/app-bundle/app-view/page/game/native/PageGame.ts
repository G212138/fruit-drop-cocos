import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
import { GameTheme } from '../../../../../app-builtin/app-model/expansion/GameTheme';
import { game } from 'cc';
import { PhoneShakeInput } from './expansion/physics/PhoneShakeInput';
import { PopResult } from '../../../pop/result/native/PopResult';
import { NewbieGuideView } from './expansion/effects/NewbieGuideView';
import { PropToolbar } from './expansion/props/PropToolbar';
import { CollectionFeedback } from './expansion/effects/CollectionFeedback';
import { RemovalEffects } from './expansion/effects/RemovalEffects';
import { PropInventory } from './expansion/props/PropInventory';
import { PropKind } from './expansion/props/PropRules';
import { FruitViewportLayout } from './expansion/board/FruitViewportLayout';
import { EditorSession } from '../../../../../app-builtin/app-model/expansion/level/EditorSession';
import { DEV, PREVIEW } from 'cc/env';
import { RewardGate } from '../../../../../app-builtin/app-model/expansion/RewardGate';
import { getTikTokGame } from '../../../../../app-builtin/app-model/expansion/platform/TikTokRuntime';
import { TikTokRewardProvider } from '../../../../../app-builtin/app-model/expansion/platform/TikTokRewardProvider';
import { TikTokStartup } from '../../../../../app-builtin/app-controller/expansion/TikTokStartup';
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
    /** 当前显示周期的手机摇晃监听，不随缓存页面继续运行。 */
    private readonly phoneShake = new PhoneShakeInput();
    /** 传感器和按钮合并为下一帧的一次解卡请求。 */
    private shakeRequested = false;

    /** 按钮事件入口；物理操作推迟至帧更新，不直接改变水果坐标。 */
    requestShake(): void {
        if (this.canShake()) this.shakeRequested = true;
    }

    /** 判断是否为正常游戏阶段；设置、广告暂停、结算和入场期间拒绝摇晃。 */
    private canShake(): boolean {
        return this.ready && !this.ended && !game.isPaused() && !this.settings?.node.activeInHierarchy
            && !!this.board?.canUseProp;
    }
    /** 页面内固定结算层，与游戏同步加载，胜负时直接显示。 */
    @property(Node) resultRoot: Node = null!;
    /** 首关首次放下物品后的配对说明，编辑器绑定。 */
    @property(Node) pairHintRoot: Node = null!;

    /** 原版首关说明停留1.5秒，按页面代次取消旧局回调。 */
    private showPairHint(): void {
        if (!this.pairHintRoot || this.levelNumber !== 1) return;
        const generation = this.generation;
        this.pairHintRoot.active = true;
        this.scheduleOnce(() => {
            if (this.isCurrent(generation) && this.pairHintRoot) this.pairHintRoot.active = false;
        }, 1.5);
    }
    /** 只读取编辑器布局中的补位标记，不调整裁剪区。 */
    private readonly fruitViewport = new FruitViewportLayout();

    /** 处理摇晃请求、引导跟随并读取补位标记；不写入UI适配位置。 */
    lateUpdate(): void {
        if (this.shakeRequested) {
            this.shakeRequested = false;
            if (this.canShake()) this.board?.shakeFruits();
        }
        this.newbieGuide?.follow(this.board?.guideTarget ?? null);
        if (this.board && this.hud) {
            this.board.fruitDisplayTop = this.fruitViewport.apply(
                this.node, this.board.node, this.board.spawner.fruitRoot, this.hud.fruitTopBoundary);
        }
    }

    /** 页面背景节点，单独铺满屏幕，不参与玩法缩放。 */
    @property(Node) backgroundNode: Node = null!;

    /** 页面内棋盘的布局容器。 */
    @property(Node)
    boardRoot: Node = null!;
    /** PageGame内固定的棋盘节点，重开不销毁。 */
    @property(Node) gameBoardNode: Node = null!;
    /** PageGame内固定的顶部HUD节点，重开不销毁。 */
    @property(Node) gameHudNode: Node = null!;

    /** 页面预制体中的 HUD 挂载点，独立于棋盘生命周期。 */
    @property(Node)
    hudRoot: Node = null!;
    /** 游戏界面内直接制作的底部进度节点，不通过子预制体加载。 */
    @property(Node) bottomProgressRoot: Node = null!;
    /** 游戏界面内直接制作的道具栏节点。 */
    @property(Node) propToolbarRoot: Node = null!;

    /** 本显示周期连接的页面内棋盘；退出仅清局并解除监听。 */
    private board: GameBoard | null = null;
    /** 本局星星表现，清局时统一取消。 */
    private readonly collectionFeedback = new CollectionFeedback();
    /** 当前局原版手指预制体，退出时独立销毁。 */
    private newbieGuide: NewbieGuideView | null = null;
    /** 游戏界面内现有道具栏组件，页面退出时只解除监听。 */
    private propToolbar: PropToolbar | null = null;
    /** 跨重开保留的独立库存。 */
    private readonly propInventory = new PropInventory();
    /** 连接PageGame内已有的道具栏，只注册事件，不实例化UI。 */
    private bindProps(): void {
        this.propInventory.refresh();
        this.propToolbar = this.propToolbarRoot.getComponent(PropToolbar);
        this.propToolbarRoot.on('prop-request', this.requestProp, this);
        this.refreshProps();
    }
    /** 将库存映射为道具数量标签。 */
    private refreshProps(): void {
        this.propToolbar?.render(this.propInventory.count('shuffle'), this.propInventory.count('eliminate'));
    }
    /** @param kind 玩家选择的道具类型；奖励校验后只增加库存，再次点击才使用。 */
    private async requestProp(kind: PropKind): Promise<void> {
        if (!this.board?.canUseProp) { this.hud?.showNotice('请等待当前动画结束'); return; }
        if (this.propInventory.count(kind) > 0) {
            const notice = this.board.useProp(kind, () => this.propInventory.consume(kind));
            this.refreshProps();
            this.hud?.showNotice(notice || (kind === 'shuffle' ? '水果位置已刷新' : '已消除一对水果'));
            return;
        }
        if (!this.rewardGate) return;
        const generation = this.generation;
        const result = await this.rewardGate.request(kind);
        if (!this.isCurrent(generation) || !this.board?.canUseProp) return;
        if (result === 'rewarded') {
            this.hud?.showNotice(this.propInventory.grant(kind) ? '已获得1次道具，点击使用' : '道具保存失败');
            this.refreshProps();
        } else this.hud?.showNotice(result === 'cancelled' ? '已取消，道具数量未改变' : '广告暂不可用，道具数量未改变');
    }
    /** 页面内固定HUD组件，所有标签由PageGame序列化绑定。 */
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
        UiClickSound.bind(this.node);
        TikTokStartup.enter();
        // XForge 隐藏模式 2：缓存页面，防止卸载分包破坏共享图片；退出仍执行 onHide 清理。
        this.hideEvent = 2;
        GameTheme.refresh();
        const generation = ++this.generation;
        this.levelNumber = EditorSession.trial ? 1 : data?.level ?? this.controller.progress.level;
        this.loadError = '';
        this.ended = false;
        this.ready = false;
        this.releaseChildren();
        this.settingsController.begin();
        this.rewardGate = new RewardGate({show: request => {
            if (getTikTokGame()) return TikTokRewardProvider.shared.show(request);
            if (DEV && this.developmentReward) return this.developmentReward.show(request);
            return Promise.resolve({...request, status:'unavailable', source:'platform'});
        }}, DEV);
        this.controller.targetOff(this);
        this.controller.on(GameController.Event.Changed, this.refreshState, this);
        this.bindFixedViews();
        this.phoneShake.start(() => this.canShake(), () => this.requestShake());
        this.loadLevel(generation);
        this.loadCollectionFeedback(generation);
        this.loadSettings(generation);
        this.bindProps();
        if (DEV && !getTikTokGame()) this.loadDevelopmentReward(generation);
    }

    /**
     * 判断异步结果是否仍属于当前显示周期。
     * @param generation 发起异步加载时记录的页面代次。
     */
    private isCurrent(generation: number): boolean {
        return isValid(this.node) && generation === this.generation;
    }

    /** 连接页面内固定棋盘与HUD，重开时先解绑再注册，防止重复计数。 */
    private bindFixedViews(): void {
        this.board = this.gameBoardNode.getComponent(GameBoard);
        this.hud = this.gameHudNode.getComponent(GameHud);
        if (!this.board || !this.hud) throw new Error('游戏页面棋盘或HUD绑定缺失');
        this.hud.progressViewRoot = this.bottomProgressRoot;
        this.gameBoardNode.targetOff(this);
        this.gameHudNode.targetOff(this);
        this.gameBoardNode.on('first-guide-drop', this.showPairHint, this);
        this.gameBoardNode.on(BoardEvents.Matched, this.onMatched, this);
        this.gameBoardNode.on(BoardEvents.Failed, this.onFailed, this);
        this.gameBoardNode.on('expand-request', this.requestExpansion, this);
        this.gameHudNode.on('return-home', this.returnHome, this);
        this.gameHudNode.on('replay-first', this.replayFirst, this);
        this.gameHudNode.on('open-settings', this.openSettings, this);
        this.refreshState();
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
                if (!PREVIEW && !EditorSession.trial && this.levelNumber > this.controller.progress.level) throw new Error('该关卡尚未解锁');
                const level = EditorSession.trial
                    ? parseLevel({ ...EditorSession.trial, level: 1 }, 1)
                    : loadCampaignLevel(asset.json.levels, this.levelNumber);
                this.ready = true;
                this.controller.begin(countFruits(level), level.number, !!EditorSession.trial);
                this.board.begin(level);
                this.hud?.setMode(level.mode);
            } catch (error) {
                this.reportLoadError(String(error));
            }
        });
    }

    /** 棋盘已确认一对有效消除，交由控制器更新权威状态。 */
    private onMatched(): void {
        this.controller.matched();
    }

    /** @param generation 异步准备双星反馈，不阻塞水果显示；未就绪时沿用入袋完成通知。 */
    private loadCollectionFeedback(generation: number): void {
        this.loadRes('prefabs/StarFlightView', Prefab, prefab => {
            if (!this.isCurrent(generation) || !this.board) return;
            if (!prefab) { this.reportLoadError('收集特效预制体加载失败'); return; }
            const effects = this.board.removalEffectsRoot.getComponent(RemovalEffects)!;
            effects.collectionFeedback = (source, completed) => {
                if (!this.isCurrent(generation)) return;
                if (!this.hud || this.levelNumber > 30) { completed(); return; }
                this.collectionFeedback.play(prefab, this.hudRoot, source, this.hud.progressTarget,
                    this.levelNumber, () => {
                        if (this.isCurrent(generation)) this.hud?.flashProgress(completed);
                    });
            };
            this.loadGroundFeedback(generation);
        });
    }

    /** @param generation 异步准备触地特效和首关引导，不串行阻塞关卡加载。 */
    private loadGroundFeedback(generation: number): void {
        this.loadRes('prefabs/GroundImpactView', Prefab, prefab => {
            if (!this.isCurrent(generation) || !this.board) return;
            if (!prefab) { this.reportLoadError('触地特效加载失败'); return; }
            this.board.removalEffectsRoot.getComponent(RemovalEffects)!.groundImpactPrefab = prefab;
            if (this.levelNumber !== 1) return;
            this.loadRes('prefabs/NewbieGuideView', Prefab, guide => {
                if (!this.isCurrent(generation)) return;
                if (!guide) { this.reportLoadError('首关引导加载失败'); return; }
                const node = instantiate(guide);
                node.active = false;
                node.parent = this.hudRoot;
                this.newbieGuide = node.getComponent(NewbieGuideView);

            });
        });
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
        this.resultRoot.getComponent(PopResult)!.showEmbedded({
            won: app.store.game.phase === 'won', level: this.levelNumber, notice,
            onRevive: this.board?.canRevive ? () => {
                if (this.isCurrent(generation)) void this.requestRevive();
            } : undefined,
        });
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
        const expectedSlot = this.board.expandedSlots;
        const result = await this.rewardGate.request('expand-slot');
        if (!this.isCurrent(generation) || this.ended) return;
        if (result === 'rewarded') {
            if (this.board?.expandSlot(expectedSlot)) this.hud?.showNotice('底部空间已扩展');
        } else if (result === 'cancelled') this.hud?.showNotice('已取消，底部空间未改变');
        else if (result === 'failed') this.hud?.showNotice('广告暂时无法完成，请稍后重试');
        else if (result === 'unavailable') this.hud?.showNotice('广告暂不可用，请稍后重试');
    }

    /** 未开放关卡提供明确的重玩入口，不修改已保存进度。 */
    private replayFirst(): void {
        this.onShow({ level: 1 });
    }

    /** 固定棋盘和HUD只清局解绑，动态弹窗和特效才销毁。 */
    private releaseChildren(): void {
        if (this.pairHintRoot) this.pairHintRoot.active = false;
        this.phoneShake.stop();
        this.shakeRequested = false;
        if (this.resultRoot && isValid(this.resultRoot, true)) this.resultRoot.getComponent(PopResult)?.closeResult();
        if (this.newbieGuide && isValid(this.newbieGuide.node)) this.newbieGuide.node.destroy();
        this.newbieGuide = null;
        this.collectionFeedback.clear();
        this.hud?.clearFeedback();
        if (this.propToolbar && isValid(this.propToolbar.node)) {
            this.propToolbar.node.targetOff(this);
        }
        this.propToolbar = null;
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
        }
        if (this.hud && isValid(this.hud.node)) {
            this.hud.node.targetOff(this);
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
        this.phoneShake.stop();
        this.generation++;
        this.controller.targetOff(this);
    }
}
