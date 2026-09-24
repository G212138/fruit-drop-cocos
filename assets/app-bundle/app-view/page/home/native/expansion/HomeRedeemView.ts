import { _decorator, Component, Node, Label, EditBox, isValid } from 'cc';
import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { getPlatformGame } from '../../../../../../app-builtin/app-model/expansion/platform/PlatformRuntime';
import { app } from '../../../../../../app/app';
const { ccclass, property } = _decorator;
/** 兑换界面的八语文案；奖励内容由后续业务确定。 */
const texts: Record<string, string[]> = {
    zh: ['兑换码','请输入兑换码','粘贴','兑换','兑换功能暂未开放','无法读取剪贴板，请长按输入框粘贴'],
    en: ['Redeem Code','Enter your code','Paste','Redeem','Code redemption is not available yet','Unable to read clipboard. Press and hold the input to paste.'],
    ja: ['コード交換','コードを入力','貼り付け','交換','コード交換はまだ利用できません','入力欄を長押しして貼り付けてください'],
    id: ['Tukar Kode','Masukkan kode','Tempel','Tukar','Penukaran kode belum tersedia','Tekan lama kolom untuk menempelkan kode'],
    th: ['แลกโค้ด','กรอกโค้ด','วาง','แลก','ยังไม่เปิดให้แลกโค้ด','กดช่องกรอกค้างไว้เพื่อวางโค้ด'],
    vi: ['Đổi mã','Nhập mã','Dán','Đổi','Tính năng đổi mã chưa khả dụng','Nhấn giữ ô nhập để dán mã'],
    ms: ['Tebus Kod','Masukkan kod','Tampal','Tebus','Penebusan kod belum tersedia','Tekan lama ruang input untuk menampal kod'],
    fil: ['Redeem Code','Ilagay ang code','I-paste','I-redeem','Hindi pa available ang pag-redeem ng code','Pindutin nang matagal ang input para i-paste ang code'],
};
/** 首页内嵌兑换面板，仅处理界面交互，不验证兑换码或发奖。 */
@ccclass('HomeRedeemView')
export class HomeRedeemView extends Component {
    /** 编辑器绑定的遮罩和弹窗根节点。 */
    @property(Node) modal: Node = null!;
    /** 编辑器绑定的真实输入框，最多六十四字符。 */
    @property(EditBox) input: EditBox = null!;
    /** 顺序为入口、标题、提示、粘贴、兑换的本地化文字。 */
    @property([Label]) labels: Label[] = [];
    /** 当前面板会话编号，阻止关闭后异步粘贴写入。 */
    private generation = 0;
    /** 稳定的语言刷新回调。 */
    private readonly refresh = (): void => {
        const t = texts[GameLanguage.current] || texts.en;
        [t[0], t[0], t[1], t[2], t[3]].forEach((value, i) => { if (this.labels[i]) this.labels[i].string = value; });
        if (this.input) this.input.placeholder = t[1];
    };
    /** 首页激活时更新文案并订阅语言变化。 */
    onEnable(): void { this.refresh(); GameLanguage.subscribe(this.refresh); }
    /** 离开首页时收起面板，解除监听。 */
    onDisable(): void { this.close(); GameLanguage.unsubscribe(this.refresh); }
    /** 打开空白兑换表单。 */
    open(): void { this.generation++; this.input.string = ''; this.refresh(); this.modal.active = true; }
    /** 关闭表单并取消未完成的粘贴结果。 */
    close(): void { this.generation++; if (this.modal) this.modal.active = false; }
    /** 只在玩家点击粘贴时读取宿主剪贴板；不可用时允许系统输入框粘贴。 */
    async paste(): Promise<void> {
        const generation = this.generation;
        const t = texts[GameLanguage.current] || texts.en;
        try {
            const api = getPlatformGame() as ReturnType<typeof getPlatformGame> & {
                getClipboardData?: (options: { success: (value: { data: string }) => void; fail: (error?: unknown) => void }) => void;
            };
            const value = api?.getClipboardData
                ? await new Promise<string>((resolve, reject) => api.getClipboardData!({ success: value => resolve(value.data), fail: reject }))
                : await globalThis.navigator.clipboard.readText();
            if (isValid(this) && this.modal.active && this.generation === generation) this.input.string = String(value || '').trim().slice(0, 64);
        } catch {
            if (isValid(this) && this.modal.active && this.generation === generation) app.manager.ui.showToast(t[5]);
        }
    }
    /** 预留兑换操作入口；未接业务时明确提示，不伪造成功。 */
    submit(): void {
        const t = texts[GameLanguage.current] || texts.en;
        app.manager.ui.showToast(this.input.string.trim() ? t[4] : t[1]);
    }
}
