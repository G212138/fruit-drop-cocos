import { LevelDocument, LevelFruitData, cloneLevelDocument, readLevelDocument, validateLevelForExport } from './LevelDocument';

/** 编辑器数据层；独立于节点、刚体、页面以及玩家关卡存档。 */
export class EditorDraft {
    /** 当前草稿使用原始关卡坐标，单位设计像素。 */
    document: LevelDocument = { level: 1, m: 1, d: [] };
    /** 当前选中列表下标，负一表示未选中。 */
    selected = -1;
    /** 编辑器视口纵向偏移，单位设计像素；导出时不计入坐标。 */
    scrollY = 0;
    /** 横向编辑模式的视口偏移，单位设计像素；不限制范围，允许编辑屏外物品。 */
    scrollX = 0;
    /** 试玩前的独立快照，包含选择和视口，不保存到玩家关卡进度。 */
    private trialSnapshot: { document: LevelDocument; selected: number; scrollY: number; scrollX: number } | null = null;

    /**
     * @param text 单关、关卡表或包装JSON；也可输入原关卡编号。
     * @param selectedLevel 表格中选择的一基关卡序号。
     * @param catalog 数字导入使用的原始关卡表，只读。
     */
    importText(text: string, selectedLevel = 1, catalog: unknown[] = []): void {
        const document = readLevelDocument(this.resolveImport(JSON.parse(text), selectedLevel, catalog));
        this.document = document;
        this.layoutBlackHoleMembers();
        this.selected = -1;
        this.scrollY = 0;
        this.scrollX = 0;
    }

    /**
     * 解开原版最多三层包装，并按第三关起循环的规则选择关卡。
     * @param value JSON解析结果。
     * @param selectedLevel 表格导入选中的一基序号。
     * @param catalog 数字导入使用的内置关卡表。
     */
    private resolveImport(value: unknown, selectedLevel: number, catalog: unknown[]): unknown {
        for (let depth = 0; depth < 3; depth++) {
            if (typeof value === 'string') {
                value = JSON.parse(value);
                continue;
            }
            if (!value || typeof value !== 'object' || Array.isArray(value)) break;
            const wrapper = value as Record<string, unknown>;
            const key = ['json', 'data', 'payload', 'cfg', 'config', 'levelData', 'default']
                .find(name => wrapper[name] !== undefined && wrapper[name] !== null);
            if (!key) break;
            value = wrapper[key];
        }
        let number = Math.max(1, Math.floor(selectedLevel || 1));
        let table: unknown[] | null = null;
        if (typeof value === 'number') {
            if (!Number.isSafeInteger(value) || value < 1) throw new Error('关卡编号必须是正整数');
            number = value;
            table = catalog;
        } else if (value && typeof value === 'object') {
            const source = value as Record<string, unknown>;
            if (Array.isArray(source.level)) table = source.level;
            else if (Array.isArray(source.levels)) table = source.levels;
            else if (source.level && typeof source.level === 'object') {
                const group = source.level as Record<string, unknown>;
                value = Array.isArray(group.d) ? group : group[String(number)] ?? group[Object.keys(group)[0]];
            }
        }
        if (table) {
            if (!table.length) throw new Error('关卡表为空或尚未加载，请稍后重试');
            const index = number <= table.length ? number - 1
                : table.length <= 2 ? table.length - 1 : 2 + (number - 3) % (table.length - 2);
            value = table[index];
        }
        if (value && typeof value === 'object') {
            const source = value as Record<string, unknown>;
            return { ...source, level: typeof source.level === 'number' ? source.level : number,
                m: source.m ?? 1, d: typeof source.d === 'string' ? JSON.parse(source.d) : source.d };
        }
        return value;
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
        this.layoutBlackHoleMembers();
        this.selected = -1;
    }

    /** @param x 拖拽后的原始横坐标。 @param y 拖拽后的原始纵坐标。 */
    moveSelected(x: number, y: number): void {
        if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('坐标无效');
        this.current().p = [x, y];
        if (this.current().BlackHoleID) this.layoutBlackHoleMembers();
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
        this.layoutBlackHoleMembers();
    }

    /** 沿用原版编辑布局：成员按序号围绕宿主，半径六十设计像素，至少六个等分槽位；导出仍使用宿主坐标。 */
    private layoutBlackHoleMembers(): void {
        for (const host of this.document.d) {
            if (!host.BlackHoleID) continue;
            const members = this.document.d.filter(item => item.FatherBlackHoleID === host.BlackHoleID);
            members.sort((a, b) => a.SequenceID! - b.SequenceID!);
            host.BlackHole = members.length + 1;
            members.forEach((member, index) => {
                const angle = 2 * Math.PI * index / Math.max(6, members.length);
                member.p = [host.p[0] + 60 * Math.cos(angle), host.p[1] + 60 * Math.sin(angle)];
            });
        }
    }

    /** 在纵向和横向模式间切换，不改变水果原始坐标。 */
    toggleMode(): void {
        this.document.m = this.document.m === 1 ? 2 : 1;
    }

    /** @param delta 原始滚轮增量；沿用原版小增量放大五十倍、滚动倍率零点二；取消固定边界以访问全部物品。 */
    scroll(delta: number): void {
        if (!Number.isFinite(delta)) return;
        const movement = (Math.abs(delta) < 5 ? delta * 50 : delta) * 0.2;
        if (this.document.m === 2) this.scrollX = this.scrollX + movement;
        else this.scrollY = this.scrollY + movement;
    }

    /** 保存编辑快照并返回独立试玩数据；不允许未完成配对的草稿开始试玩。 */
    beginTrial(): LevelDocument {
        const document = this.buildDocument();
        validateLevelForExport(document);
        this.trialSnapshot = { document: cloneLevelDocument(this.document), selected: this.selected, scrollY: this.scrollY, scrollX: this.scrollX };
        return document;
    }

    /** 从试玩返回时恢复编辑状态，包含成员位置和当前选择。 */
    restoreTrial(): void {
        if (!this.trialSnapshot) return;
        this.document = cloneLevelDocument(this.trialSnapshot.document);
        this.selected = this.trialSnapshot.selected;
        this.scrollY = this.trialSnapshot.scrollY;
        this.scrollX = this.trialSnapshot.scrollX;
        this.trialSnapshot = null;
    }

    /** 获取选中水果，无选中时提供明确操作提示。 */
    private current(): LevelFruitData {
        const result = this.document.d[this.selected];
        if (!result) throw new Error('请先选择一个水果');
        return result;
    }
}
