import { _decorator, CCString, Component, Label, RichText, Node } from 'cc';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { resultText, ResultKey } from './ResultStrings';
const { ccclass, property } = _decorator;
/** 无底框结算的文案和可选解锁主视觉；布局由预制体负责。 */
@ccclass('ResultOverlay')
export class ResultOverlay extends Component {
    /** 与keys同序的静态文案标签。 */
    @property([Label]) labels: Label[] = [];
    /** 标签对应的八语种文案键。 */
    @property([CCString]) keys: string[] = [];
    /** 成功与失败关卡数字。 */
    @property([Label]) levels: Label[] = [];
    /** 成功时的解锁说明或完成说明。 */
    @property(Label) summary: Label = null!;
    /** 复活页真实剩余物品数量，数字单独着色。 */
    @property(RichText) remaining: RichText = null!;
    /** 失败页大号剩余数量及其前后本地化文字。 */
    @property(Label) failureCount: Label = null!;
    @property(Label) failurePrefix: Label = null!;
    @property(Label) failureSuffix: Label = null!;
    /** 没有新解锁时展示的非食物成功徽章。 */
    @property(Node) successArt: Node = null!;
    /** 本次累计关卡编号。 */
    private level = 1;
    /** 本次剩余个数。 */
    private count = 0;
    /** 本局品类，1水果、2甜品，显示期间保持不变。 */
    private category: 1 | 2 = 1;
    /** 本关是否显示新解锁物品。 */
    private unlocked = false;
    /** 打开时绑定语言更新。 */
    onEnable(): void {
        GameLanguage.subscribe(this.refresh);
        this.refresh();
    }
    /** 隐藏时释放语言订阅。 */
    onDisable(): void {
        GameLanguage.unsubscribe(this.refresh);
    }
    /** @param level 累计关卡。 @param count 棋盘剩余个数。 @param unlocked 本关是否解锁物品。 */
    render(level: number, count: number, unlocked: boolean, category: 1 | 2 = 1): void {
        this.level = level;
        this.category = category;
        this.count = Math.max(0, Math.floor(count));
        this.unlocked = unlocked;
        this.refresh();
    }
    /** 使用稳定回调引用，支持切换语言；不改位置和尺寸。 */
    private readonly refresh = (): void => {
        const language = GameLanguage.current;
        this.labels.forEach((label, i) => { label.string = resultText(language, this.keys[i] as ResultKey); });
        this.levels.forEach(label => { label.string = resultText(language, 'level', { level: this.level }); });
        if (this.summary) this.summary.string = resultText(language, this.unlocked ? 'unlock' : 'complete');
        if (this.remaining) this.remaining.string = resultText(language, this.category === 2 ? 'remainingDessert' : 'remaining', { count: '<color=#FFAD57><b>' + this.count + '</b></color>' });
        const sentence = resultText(language, this.category === 2 ? 'remainingDessert' : 'remaining', { count: '|COUNT|' });
        const [prefix, suffix] = sentence.split('|COUNT|');
        if (this.failureCount) this.failureCount.string = String(this.count);
        if (this.failurePrefix) this.failurePrefix.string = prefix.trim();
        if (this.failureSuffix) this.failureSuffix.string = suffix.trim();
        if (this.successArt) this.successArt.active = !this.unlocked;
    };
}
