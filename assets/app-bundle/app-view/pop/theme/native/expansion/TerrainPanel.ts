import { app } from '../../../../../../app/app';
import { _decorator, Component, Node, Sprite, Label, Button, Color, ScrollView, Prefab, instantiate, isValid } from 'cc';
import { DEV } from 'cc/env';
import { getTikTokGame } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokRuntime';
import { DevelopmentRewardPanel } from '../../../../page/game/native/expansion/reward/DevelopmentRewardPanel';
import { GameTerrain } from '../../../../../../app-builtin/app-model/expansion/GameTerrain';
import { terrainCatalog } from '../../../../../../app-builtin/app-model/expansion/TerrainProgress';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { RewardGate, RewardRequest, RewardResponse } from '../../../../../../app-builtin/app-model/expansion/RewardGate';
import { TikTokRewardProvider } from '../../../../../../app-builtin/app-model/expansion/platform/TikTokRewardProvider';
import { terrainName, terrainText } from './TerrainText';
const { ccclass, property } = _decorator;
/** 三列地块网格，预览与按钮全部由编辑器预制体提供。 */
@ccclass('TerrainPanel')
export class TerrainPanel extends Component {
    /** 按地块目录顺序绑定的全部卡片。 */
    @property([Node]) cards: Node[] = [];
    /** 本地化标题。 */
    @property(Label) heading: Label = null!;
    /** 全部地块使用垂直滚动。 */
    @property(ScrollView) scroll: ScrollView = null!;
    /** 开发环境允许显式测试框，正式构建仅接受平台完成结果。 */
    private readonly gate = new RewardGate({ show: request => this.showReward(request) }, DEV);
    /** 复用现有广告测试预制体，首次点击时才加载。 */
    private developmentReward: DevelopmentRewardPanel | null = null;
    /** @param request 广告门禁的唯一请求，测试不会自动模拟完成。 */
    private async showReward(request: RewardRequest): Promise<RewardResponse> {
        if (getTikTokGame()) return TikTokRewardProvider.shared.show(request);
        if (!DEV) return { ...request, status: 'unavailable', source: 'platform' };
        const generation = this.generation;
        if (!this.developmentReward || !isValid(this.developmentReward.node)) {
            const prefab = await new Promise<Prefab | null>(resolve => {
                app.manager.loader.load({ bundle: 'page-game-res', path: 'prefabs/DevelopmentRewardPanel', type: Prefab,
                    onComplete: (asset: Prefab) => resolve(asset || null) });
            });
            if (generation !== this.generation || !isValid(this.node) || !this.node.activeInHierarchy) {
                return { ...request, status: 'cancelled', source: 'development' };
            }
            if (!prefab) return { ...request, status: 'unavailable', source: 'development' };
            const node = instantiate(prefab);
            node.active = false;
            node.parent = this.node;
            this.developmentReward = node.getComponent(DevelopmentRewardPanel);
        }
        if (!this.developmentReward) return { ...request, status: 'unavailable', source: 'development' };
        return this.developmentReward.show(request);
    }
    /** 当前等待广告的目标，禁止多个卡片并发请求。 */
    private busyId: string | null = null;
    /** 显示代次，关闭重开后不应用旧回调。 */
    private generation = 0;
    /** 展示中每秒检查一次日期，跨午夜及时刷新卡片。 */
    private dayCheckElapsed = 0;
    /** @param dt 本帧经过的秒数，仅跨天时刷新界面。 */
    update(dt: number): void {
        this.dayCheckElapsed += dt;
        if (this.dayCheckElapsed < 1) return;
        this.dayCheckElapsed = 0;
        if (GameTerrain.current.refreshDay()) this.render();
    }
    /** 稳定语言更新回调。 */
    private readonly languageChanged = (): void => this.render();
    /** 启用时订阅语言变化。 */
    onEnable(): void { GameLanguage.subscribe(this.languageChanged); }
    /** 隐藏后使广告请求失效，图片随缓存预制体保留。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.languageChanged);
        ++this.generation;
        this.gate.invalidate();
        this.developmentReward?.cancel();
        this.busyId = null;
    }
    /** 打开时展示所有地块及当前解锁状态。 */
    open(): void {
        this.node.active = true;
        this.scroll.stopAutoScroll();
        this.scroll.scrollToTop(0);
        this.render();
    }
    /** 关闭不会取消已保存的完整观看次数。 */
    close(): void { this.node.emit('panel-close'); }
    /** @param event 按钮事件。 @param id 编辑器绑定的稳定地块编号。 */
    async choose(event: unknown, id: string): Promise<void> {
        if (this.busyId || !terrainCatalog.some(entry => entry.id === id)) return;
        const model = GameTerrain.current;
        if (model.isUnlocked(id)) {
            if (!model.select(id)) app.manager.ui.showToast(terrainText('saveError'));
            this.render();
            return;
        }
        const generation = this.generation;
        this.busyId = id;
        this.render();
        const result = await this.gate.request('terrain-unlock');
        if (generation !== this.generation || !this.node.activeInHierarchy) return;
        this.busyId = null;
        if (result === 'rewarded') {
            const saved = model.recordReward(id);
            app.manager.ui.showToast(!saved ? terrainText('saveError') : model.isUnlocked(id)
                ? terrainText('unlocked') : terrainText('progress', model.watched(id)));
        } else {
            app.manager.ui.showToast(terrainText(result === 'cancelled' ? 'cancelled' : 'unavailable'));
        }
        this.render();
    }
    /** 更新所有卡片，保留预制体已有的布局与共享地块图片。 */
    private render(): void {
        this.heading.string = GameLanguage.text('themes');
        const model = GameTerrain.current;
        this.cards.forEach((card, index) => {
            const id = terrainCatalog[index].id;
            const unlocked = model.isUnlocked(id), used = model.selected === id;
            card.getChildByName('Title')!.getComponent(Label)!.string = terrainName(index);
            card.getChildByName('Selected')!.active = used;
            const action = card.getChildByName('Action')!;
            action.getComponent(Button)!.interactable = !this.busyId && !used;
            action.getComponent(Sprite)!.color = used ? new Color(204,210,210) : unlocked ? new Color(221,239,221) : new Color(255,212,100);
            action.getChildByName('Ad')!.active = !unlocked;
            action.getChildByName('Caption')!.getComponent(Label)!.string = this.busyId === id ? terrainText('busy')
                : used ? terrainText('used') : unlocked ? terrainText('use') : terrainText('unlock', model.watched(id));
        });
    }
}
