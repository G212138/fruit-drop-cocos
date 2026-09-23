import { _decorator, Component, Node, Label, EditBox } from 'cc';
const { ccclass, property } = _decorator;
/** 编辑器面板和显示缩放；所有UI由预制体绑定，不改写关卡数据。 */
@ccclass('EditorWorkspace')
export class EditorWorkspace extends Component {
    /** 数据弹窗与反馈文本。 */
    @property(Node)
    dataPanel: Node = null!;
    @property(Label)
    dataNotice: Label = null!;
    @property(Label)
    confirmLabel: Label = null!;
    /** 新增独立输入框，原物品编号输入继续用于添加物品和成员。 */
    @property(EditBox)
    iceInput: EditBox = null!;
    @property(EditBox)
    levelInput: EditBox = null!;
    @property(EditBox)
    tableInput: EditBox = null!;
    /** 画布、辅助线及缩放显示。 */
    @property(Node)
    fruitRoot: Node = null!;
    @property(Node)
    guides: Node = null!;
    @property(Label)
    zoomLabel: Label = null!;
    @property(Label)
    selectionLabel: Label = null!;
    /** 弹窗模式仅用于决定确认按钮，不影响JSON内容。 */
    private exporting = false;
    /** 显示倍率与水平关卡的居中偏移，不进入导出坐标。 */
    private zoom = 1;
    private centerY = 0;
    /** 编辑页重新显示时关闭遮罩，保留输入内容。 */
    onEnable(): void { this.dataPanel.active = false; }
    /** 是否由弹窗独占输入。 */
    get modalOpen(): boolean { return this.dataPanel.active; }
    /** 获取同页面的旧业务方法，避免复制关卡逻辑。 */
    private get page(): any { return this.node.getComponent('PageEditor'); }
    /** 保留当前JSON文本，打开导入。 */
    openImport(): void { this.exporting = false; this.dataPanel.active = true; this.confirmLabel.string = '确认导入'; this.dataNotice.string = '输入关卡编号，或粘贴单关／关卡表 JSON'; }
    /** 原导出校验仍执行，失败在弹窗内提示。 */
    openExport(): void { this.exporting = true; this.dataPanel.active = true; this.confirmLabel.string = '重新导出'; this.dataNotice.string = '在文本框内全选并复制 JSON'; this.page.exportJson(); }
    /** 根据选中的数据操作调用原入口。 */
    confirm(): void { if (this.exporting)
        this.page.exportJson();
    else
        this.page.importJson(); }
    /** 关闭不清空导入导出的文本。 */
    closeData(): void { this.dataPanel.active = false; }
    /** 业务异常和成功均在数据面板内可见。 */
    report(message: string): void { this.dataNotice.string = message; }
    /** 独立关卡编号加载，原数字JSON导入依然保留。 */
    loadLevel(): void { this.page.loadSelectedLevel(); }
    /** 查看放大后仍由原拖拽坐标转换得到原始坐标。 */
    zoomIn(): void { this.zoom = Math.min(2, this.zoom + .15); this.page.refreshCanvas(); }
    /** 最小30%，便于查看屏外布局。 */
    zoomOut(): void { this.zoom = Math.max(.3, this.zoom - .15); this.page.refreshCanvas(); }
    /** 参考线仅辅助排布，不声称等同所有机型的游戏安全区。 */
    toggleGuides(): void { this.guides.active = !this.guides.active; }
    /** 导入横向关卡时垂直居中，让低于原点的物品也能直接看见。 */
    center(points: number[][], horizontal: boolean): void {
        this.centerY = horizontal && points.length ? -(Math.min(...points.map(p => p[1])) + Math.max(...points.map(p => p[1]))) / 2 : 0;
    }
    /** 原视口归零语义保留：位置归原点、缩放回100%。 */
    reset(): void { this.zoom = 1; this.centerY = 0; }
    /** 显示变换不会写回草稿，滚轮仍沿当前模式移动。 */
    applyCanvas(x: number, y: number): void {
        this.fruitRoot.setScale(this.zoom, this.zoom, 1);
        this.fruitRoot.setPosition(x * this.zoom, (y + this.centerY) * this.zoom);
        this.zoomLabel.string = Math.round(this.zoom * 100) + '%';
    }
    /** 新物品仍添加到当前视口中心附近。 */
    get verticalOffset(): number { return this.centerY; }
    /** 输入框聚焦时让原有键盘编辑快捷键保持避让。 */
    get inputFocused(): boolean { return this.iceInput.isFocused() || this.levelInput.isFocused() || this.tableInput.isFocused(); }
}
