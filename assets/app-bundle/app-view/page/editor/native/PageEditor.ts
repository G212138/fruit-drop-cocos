import { GameTheme } from '../../../../../app-builtin/app-model/expansion/GameTheme';
import { findEditorPlacement } from '../../../../../app-builtin/app-model/expansion/level/EditorPlacement';
import { EditorSession } from '../../../../../app-builtin/app-model/expansion/level/EditorSession';
import { _decorator, Node, Label, EditBox, Prefab, SpriteFrame, instantiate, input, Input, EventKeyboard, KeyCode, EventMouse, JsonAsset } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
import { EditorFruitMarker } from './expansion/EditorFruitMarker';
const { ccclass, property } = _decorator;

/** 关卡编辑页面仅连接数据模型与独立标记预制体，不创建 UI 节点。 */
@ccclass('PageEditor')
export class PageEditor extends BaseView {


    /** 编辑器已有水果挂载点，导出的坐标不含它的滚动偏移。 */
    @property(Node)
    fruitRoot: Node = null!;
    /** 独立无物理的水果标记预制体。 */
    @property(Prefab)
    markerPrefab: Prefab = null!;
    /** 按一至三十顺序绑定原版图片，不读取运行时节点名称。 */
    @property([SpriteFrame])
    fruitFrames: SpriteFrame[] = [];
    /** 按原编号对应的甜品图标，编辑器预览与当前主题一致。 */
    @property([SpriteFrame]) dessertFrames: SpriteFrame[] = [];
    /** 水果编号或冰层数输入，整数。 */
    @property(EditBox)
    numberInput: EditBox = null!;
    /** 原版 JSON 导入导出文本框。 */
    @property(EditBox)
    jsonInput: EditBox = null!;
    /** 操作说明、选择信息和格式校验结果。 */
    @property(Label)
    statusLabel: Label = null!;
    /** 当前移动模式提示。 */
    @property(Label)
    modeLabel: Label = null!;
    /** 页面独立草稿；不读取或改写玩家通关进度。 */
    private readonly draft = EditorSession.draft;

    /** 内置关卡只供数字导入读取，不连接玩家存档。 */
    private originalLevels: unknown[] = [];
    /** 页面加载代次，避免退出后的异步回调更新旧页面。 */
    private loadGeneration = 0;

    /** 显示时恢复已有编辑内容并注册键盘与滚轮。 */
    onShow(): void {
        GameTheme.refresh();
        EditorSession.finishTrial();
        const generation = ++this.loadGeneration;
        app.manager.loader.load({ bundle: 'page-game-res', path: 'levels/original-levels', type: JsonAsset,
            onComplete: asset => {
                if (generation !== this.loadGeneration) return;
                this.originalLevels = asset?.json?.levels || [];
            },
        });
        this.fruitRoot.on('editor-select', this.select, this);
        this.fruitRoot.on('editor-move', this.move, this);
        input.on(Input.EventType.KEY_DOWN, this.keyDown, this);
        this.node.on(Node.EventType.MOUSE_WHEEL, this.wheel, this);
        this.render();
    }
    /** 隐藏时解除全局输入，不影响其他页面。 */
    onHide(): void {
        this.loadGeneration++;
        this.fruitRoot.targetOff(this);
        input.off(Input.EventType.KEY_DOWN, this.keyDown, this);
        this.node.targetOff(this);
    }
    /** 按当前数据实例化标记，布局全部由已有容器与预制体定义。 */
    private render(): void {
        for (const child of [...this.fruitRoot.children]) child.destroy();
        this.updateViewport();
        this.draft.document.d.forEach((item, index) => {
            const node = instantiate(this.markerPrefab);
            node.parent = this.fruitRoot;
            node.setPosition(item.p[0], item.p[1], 0);
            const marker = node.getComponent(EditorFruitMarker)!;
            marker.index = index;
            marker.icon.spriteFrame = this.activeFrames[Number(item.n) - 1];
            const scale = item.FatherBlackHoleID ? 0.5 : 1;
            node.setScale(scale, scale, 1);
            marker.badge.string = (item.h === 't' ? '隐藏 ' : '') + (item.ice ? '冰' + item.ice + ' ' : '')
                + (item.BlackHoleID ? '洞' + item.BlackHoleID + ' 共' + item.BlackHole : '')
                + (item.FatherBlackHoleID ? '洞' + item.FatherBlackHoleID + '-' + item.SequenceID : '');
            marker.highlight(index === this.draft.selected);
        });
        this.modeLabel.string = this.draft.document.m === 1 ? '模式：纵向' : '模式：横向';
        this.statusLabel.string = '共 ' + this.draft.document.d.length + ' 个 · 拖拽移动水果；回车添加，Shift 隐藏';
    }
    /** @param index 本次点击的草稿下标，标记刷新后重新分配。 */
    private select(index: number): void {
        this.draft.selected = index;
        for (const node of this.fruitRoot.children) {
            const marker = node.getComponent(EditorFruitMarker)!;
            marker.highlight(marker.index === index);
        }
        const item = this.draft.document.d[index];
        this.statusLabel.string = '选中水果 ' + item.n + '，坐标 ' + item.p.map(Math.round).join(', ');
    }
    /** @param index 拖拽水果下标。 @param x 原始横坐标。 @param y 原始纵坐标。 */
    private move(index: number, x: number, y: number): void {
        this.draft.selected = index;
        this.draft.moveSelected(x, y);
        for (const node of this.fruitRoot.children) {
            const marker = node.getComponent(EditorFruitMarker)!;
            const item = this.draft.document.d[marker.index];
            node.setPosition(item.p[0], item.p[1], 0);
        }
        this.statusLabel.string = '坐标 ' + Math.round(x) + ', ' + Math.round(y);
    }
    /** @param action 一次编辑操作；错误显示在页面，不清除草稿。 */
    private operate(action: () => void): void {
        try { action(); this.render(); }
        catch (error) { this.statusLabel.string = String((error as Error).message || error); }
    }
    /** 在视口中央附近放置新水果，避免默认重合。 */
    addFruit(): void {
        this.operate(() => {
            const kind = Number(this.numberInput.string);
            if (!Number.isInteger(kind) || kind < 1 || kind > 30) throw new Error('水果编号必须在1至30之间');
            const x = this.draft.document.m === 2 ? this.draft.scrollX : 0;
            const y = this.draft.document.m === 1 ? this.draft.scrollY : 0;
            const existing = this.draft.document.d.map(item => ({ x: item.p[0], y: item.p[1],
                radius: this.fruitRadius(Number(item.n)) * (item.FatherBlackHoleID ? 0.5 : 1) }));
            const position = findEditorPlacement(-x, -y, this.fruitRadius(kind), this.draft.document.m, existing);
            this.draft.add(kind, position[0], position[1]);
        });
    }
    /** 当前主题对应的图标，不改变导出的逻辑编号。 */
    private get activeFrames(): SpriteFrame[] { return GameTheme.active === 2 ? this.dessertFrames : this.fruitFrames; }
    /** @param kind 逻辑编号；以原图片最大边长的一半估算放置半径，单位设计像素。 */
    private fruitRadius(kind: number): number {
        const size = this.activeFrames[kind - 1]?.originalSize;
        return size ? Math.max(size.width, size.height) / 2 : 45;
    }
    /** 删除当前选中水果及其黑洞成员。 */
    deleteFruit(): void {
        this.operate(() => this.draft.deleteSelected());
    }
    /** 开关选中水果的隐藏标记。 */
    toggleHidden(): void {
        this.operate(() => this.draft.toggleHidden());
    }
    /** 将数字输入设为选中水果的冰层数；输入零清除。 */
    setIce(): void {
        this.operate(() => this.draft.setIce(Number(this.numberInput.string)));
    }
    /** 开关选中水果的黑洞宿主状态。 */
    toggleBlackHole(): void {
        this.operate(() => this.draft.toggleBlackHole());
    }
    /** 数字输入作为水果编号，加入所选黑洞的末尾。 */
    addMember(): void {
        this.operate(() => this.draft.addBlackHoleMember(Number(this.numberInput.string)));
    }
    /** 切换纵向和横向编辑模式。 */
    toggleMode(): void {
        this.operate(() => this.draft.toggleMode());
    }
    /** 从文本框导入单关 JSON，失败保留旧内容。 */
    importJson(): void {
        this.operate(() => this.draft.importText(this.jsonInput.string, Number(this.numberInput.string), this.originalLevels));
    }
    /** 输出经过原版约束验证的关卡 JSON。 */
    exportJson(): void {
        this.operate(() => { this.jsonInput.string = this.draft.exportText(); });
    }
    /** 恢复视口原点，不改变水果数据坐标。 */
    resetViewport(): void {
        this.draft.scrollY = 0;
        this.draft.scrollX = 0;
        this.render();
    }
    /** 校验草稿后启动独立试玩，胜利不解锁玩家关卡。 */
    trial(): void {
        try {
            EditorSession.trial = this.draft.beginTrial();
            app.manager.ui.show({ name: 'PageGame' });
        } catch (error) {
            this.statusLabel.string = String((error as Error).message || error);
        }
    }

    /** 返回游戏主页。 */
    home(): void {
        app.manager.ui.show({ name: 'PageHome' });
    }
    /** @param event 滚轮增量；沿用编辑器视口滚动，不改导出坐标。 */
    private wheel(event: EventMouse): void {
        this.draft.scroll(event.getScrollY());
        this.updateViewport();
    }
    /** 只移动当前模式的视口轴，不改变原始关卡坐标。 */
    private updateViewport(): void {
        this.fruitRoot.setPosition(this.draft.document.m === 2 ? this.draft.scrollX : 0,
            this.draft.document.m === 1 ? this.draft.scrollY : 0, 0);
    }
    /** @param event 键盘事件；文本框编辑期间不处理删除快捷键。 */
    private keyDown(event: EventKeyboard): void {
        if (this.numberInput.isFocused() || this.jsonInput.isFocused()) return;
        if (event.keyCode === KeyCode.DELETE || event.keyCode === KeyCode.BACKSPACE) this.deleteFruit();
        else if (event.keyCode === KeyCode.ENTER) this.addFruit();
        else if (event.keyCode === KeyCode.SHIFT_LEFT || event.keyCode === KeyCode.SHIFT_RIGHT) this.toggleHidden();
        else if (event.keyCode === KeyCode.SPACE) this.numberInput.string = '';
        else if (event.keyCode >= KeyCode.DIGIT_0 && event.keyCode <= KeyCode.DIGIT_9) {
            this.numberInput.string += String(event.keyCode - KeyCode.DIGIT_0);
        } else if (event.keyCode >= KeyCode.NUM_0 && event.keyCode <= KeyCode.NUM_9) {
            this.numberInput.string += String(event.keyCode - KeyCode.NUM_0);
        }
    }
}
