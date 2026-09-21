import { _decorator, Component, Node, Sprite, Label, Button, Color, ScrollView } from 'cc';
import { GameTerrain } from '../../../../../../app-builtin/app-model/expansion/GameTerrain';
import { terrainCatalog } from '../../../../../../app-builtin/app-model/expansion/TerrainProgress';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { RewardGate } from '../../../../../../app-builtin/app-model/expansion/RewardGate';
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
    /** 面板内广告及存储反馈。 */
    @property(Label) status: Label = null!;
    /** 全部地块使用垂直滚动。 */
    @property(ScrollView) scroll: ScrollView = null!;
    /** 只接受真实平台广告结果，不将浏览器预览当作广告完成。 */
    private readonly gate = new RewardGate(TikTokRewardProvider.shared, false);
    /** 当前等待广告的目标，禁止多个卡片并发请求。 */
    private busyId: string | null = null;
    /** 显示代次，关闭重开后不应用旧回调。 */
    private generation = 0;
    /** 稳定语言更新回调。 */
    private readonly languageChanged = (): void => { this.status.string = ''; this.render(); };
    /** 启用时订阅语言变化。 */
    onEnable(): void { GameLanguage.subscribe(this.languageChanged); }
    /** 隐藏后使广告请求失效，图片随缓存预制体保留。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.languageChanged);
        ++this.generation;
        this.gate.invalidate();
        this.busyId = null;
    }
    /** 打开时展示所有地块及当前解锁状态。 */
    open(): void {
        this.node.active = true;
        this.status.string = '';
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
            this.status.string = model.select(id) ? '' : terrainText('saveError');
            this.render();
            return;
        }
        const generation = this.generation;
        this.busyId = id;
        this.status.string = terrainText('busy');
        this.render();
        const result = await this.gate.request('terrain-unlock');
        if (generation !== this.generation || !this.node.activeInHierarchy) return;
        this.busyId = null;
        if (result === 'rewarded') {
            const saved = model.recordReward(id);
            this.status.string = !saved ? terrainText('saveError') : model.isUnlocked(id)
                ? terrainText('unlocked') : terrainText('progress', model.watched(id));
        } else {
            this.status.string = terrainText(result === 'cancelled' ? 'cancelled' : 'unavailable');
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
