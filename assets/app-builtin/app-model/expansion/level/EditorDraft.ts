import { LevelDocument, LevelFruitData, cloneLevelDocument, readLevelDocument, validateLevelForExport } from './LevelDocument';

/** 编辑器数据层；独立于节点、刚体、页面以及玩家关卡存档。 */
export class EditorDraft {
    /** 当前草稿使用原始关卡坐标，单位设计像素。 */
    document: LevelDocument = { level: 1, m: 1, d: [] };
    /** 当前选中列表下标，负一表示未选中。 */
    selected = -1;
    /** 编辑器视口纵向偏移，单位设计像素；导出时不计入坐标。 */
    scrollY = 0;
    /** 试玩前的独立快照，包含选择和视口，不保存到玩家关卡进度。 */
    private trialSnapshot: { document: LevelDocument; selected: number; scrollY: number } | null = null;

    /** @param text 原版单关 JSON 字符串；解析失败不覆盖已有草稿。 */
    importText(text: string): void {
        const document = readLevelDocument(JSON.parse(text));
        this.document = document;
        this.selected = -1;
        this.scrollY = 0;
    }

    /** 返回可直接导入原版的 JSON，检查配对、坐标距离和黑洞关系。 */
    exportText(): string {
        const document = this.buildDocument();
        validateLevelForExport(document);
        return JSON.stringify(document, null, 2);
    }

    /** 导出黑洞成员使用宿主坐标，总数量包含宿主本身。 */
    buildDocument(): LevelDocument {
        const data = cloneLevelDocument(this.document);
        for (const host of data.d) {
            host.p = host.p.map(Math.round) as [number, number];
            if (!host.BlackHoleID) continue;
            const members = data.d.filter(item => item.FatherBlackHoleID === host.BlackHoleID);
            host.BlackHole = members.length + 1;
            members.sort((a, b) => a.SequenceID! - b.SequenceID!);
            members.forEach((member, index) => {
                member.SequenceID = index + 1;
                member.p = [...host.p] as [number, number];
            });
        }
        return data;
    }

    /** @param kind 原版水果编号。 @param x 水平设计像素坐标。 @param y 纵向设计像素坐标。 */
    add(kind: number, x: number, y: number): void {
        const item = readLevelDocument({level:1,m:1,d:[{n:String(kind),p:[x,y]}]}).d[0];
        this.document.d.push(item);
        this.selected = this.document.d.length - 1;
    }

    /** 删除选中水果；删除黑洞宿主时连同其成员删除，防止孤儿引用。 */
    deleteSelected(): void {
        const item = this.current();
        this.document.d = this.document.d.filter(value => value !== item
            && !(item.BlackHoleID && value.FatherBlackHoleID === item.BlackHoleID));
        this.selected = -1;
    }

    /** @param x 拖拽后的原始横坐标。 @param y 拖拽后的原始纵坐标。 */
    moveSelected(x: number, y: number): void {
        if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('坐标无效');
        this.current().p = [x, y];
    }

    /** 切换当前水果的原版花朵遮罩。 */
    toggleHidden(): void {
        const item = this.current();
        if (item.h === 't') delete item.h;
        else item.h = 't';
    }

    /** @param layers 冰层数量，非负整数；零清除冰层。 */
    setIce(layers: number): void {
        if (!Number.isSafeInteger(layers) || layers < 0) throw new Error('冰层数必须是非负整数');
        const item = this.current();
        if (layers === 0) delete item.ice;
        else item.ice = layers;
    }

    /** 开关宿主黑洞；关闭时成员还原普通水果并保留编辑位置。 */
    toggleBlackHole(): void {
        const item = this.current();
        if (item.FatherBlackHoleID) throw new Error('请先选择黑洞宿主');
        if (item.BlackHoleID) {
            for (const member of this.document.d.filter(value => value.FatherBlackHoleID === item.BlackHoleID)) {
                delete member.FatherBlackHoleID;
                delete member.SequenceID;
            }
            delete item.BlackHoleID;
            delete item.BlackHole;
        } else {
            item.BlackHoleID = Math.max(0, ...this.document.d.map(value => value.BlackHoleID || 0)) + 1;
            item.BlackHole = 1;
        }
    }

    /** @param kind 新增黑洞成员的水果编号；成员按添加顺序释放。 */
    addBlackHoleMember(kind: number): void {
        const selected = this.current();
        const id = selected.BlackHoleID || selected.FatherBlackHoleID;
        const host = this.document.d.find(value => id && value.BlackHoleID === id);
        if (!host) throw new Error('请先选择黑洞宿主或其成员');
        const sequence = Math.max(0, ...this.document.d.filter(value => value.FatherBlackHoleID === id).map(value => value.SequenceID || 0)) + 1;
        this.add(kind, host.p[0], host.p[1]);
        const member = this.current();
        member.FatherBlackHoleID = id;
        member.SequenceID = sequence;
        host.BlackHole = this.document.d.filter(value => value.FatherBlackHoleID === id).length + 1;
    }

    /** 在纵向和横向模式间切换，不改变水果原始坐标。 */
    toggleMode(): void {
        this.document.m = this.document.m === 1 ? 2 : 1;
    }

    /** 保存编辑快照并返回独立试玩数据；不允许未完成配对的草稿开始试玩。 */
    beginTrial(): LevelDocument {
        const document = this.buildDocument();
        validateLevelForExport(document);
        this.trialSnapshot = { document: cloneLevelDocument(this.document), selected: this.selected, scrollY: this.scrollY };
        return document;
    }

    /** 从试玩返回时恢复编辑状态，包含成员位置和当前选择。 */
    restoreTrial(): void {
        if (!this.trialSnapshot) return;
        this.document = cloneLevelDocument(this.trialSnapshot.document);
        this.selected = this.trialSnapshot.selected;
        this.scrollY = this.trialSnapshot.scrollY;
        this.trialSnapshot = null;
    }

    /** 获取选中水果，无选中时提供明确操作提示。 */
    private current(): LevelFruitData {
        const result = this.document.d[this.selected];
        if (!result) throw new Error('请先选择一个水果');
        return result;
    }
}
