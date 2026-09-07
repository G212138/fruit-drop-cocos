import { _decorator, Component, Node, Prefab, instantiate, isValid } from 'cc';
import { IceFruitView } from '../ice/IceFruitView';
import { FloorFruit } from '../failure/FloorFailureRules';
import { FruitItem } from '../fruit/FruitItem';
import { FruitDefinition } from '../level/LevelDefinition';
import { BlackHoleFlow } from '../black-hole/BlackHoleFlow';
const { ccclass, property } = _decorator;

/** 水果实例集合，只实例化编辑器制作的预制体。 */
@ccclass('FruitSpawner')
export class FruitSpawner extends Component {
    /** 预制体内的水果容器，局部原点与棋盘一致。 */
    @property(Node)
    fruitRoot: Node = null!;

    /** 按原版类型制作的独立预制体，包含各自图片、尺寸和多边形碰撞体。 */
    @property([Prefab])
    fruitPrefabs: Prefab[] = [];

    /** 独立花朵遮罩预制体，仅为原配置标记隐藏的水果实例化。 */
    @property(Prefab)
    hiddenFruitPrefab: Prefab = null!;

    /** 独立冰层骨骼预制体，附着于配置有冰层的水果。 */
    @property(Prefab)
    iceFruitPrefab: Prefab = null!;
    /** 独立黑洞与剩余数量预制体，使用原版图片。 */
    @property(Prefab)
    blackHolePrefab: Prefab = null!;
    /** 黑洞成员生命周期，与单体实例集合分别管理。 */
    private readonly blackHoles = new BlackHoleFlow();
    /** 当前棋盘的事件绑定回调，重开时替换。 */
    private onSpawned: ((fruit: FruitItem) => void) | null = null;

    /** 存活实例集合，消除时移除，重开时清空。 */
    private readonly live = new Set<FruitItem>();

    /** 返回存活数量，用于判断当前批次是否结束。 */
    get count(): number {
        return this.live.size + this.blackHoles.pendingCount;
    }

    /**
     * 按关卡坐标实例化水果，并交由棋盘绑定事件。
     * @param wave 整关水果定义列表，保留原配置顺序。
     * @param onSpawned 每个水果实例化完成后绑定局部事件的回调。
     */
    spawn(wave: FruitDefinition[], onSpawned: (fruit: FruitItem) => void): void {
        this.onSpawned = onSpawned;
        for (const definition of wave) {
            if (definition.fatherBlackHoleId) continue;
            const fruit = this.spawnOne(definition);
            if (definition.blackHoleId) {
                if (!this.blackHolePrefab) throw new Error('黑洞预制体未绑定');
                this.blackHoles.attach(fruit, wave.filter(item => item.fatherBlackHoleId === definition.blackHoleId),
                    this.blackHolePrefab, this.fruitRoot);
            }
        }
    }

    /** @param definition 单颗水果定义；黑洞复用同一工厂，保证隐藏、冰层和事件绑定一致。 */
    private spawnOne(definition: FruitDefinition): FruitItem {
        const prefab = this.fruitPrefabs.find(value => value.data.getComponent(FruitItem)?.kind === definition.kind);
        if (!prefab) throw new Error('水果缺少预制体：' + definition.kind);
        const node = instantiate(prefab);
        node.parent = this.fruitRoot;
        node.setPosition(definition.x, definition.y);
        const fruit = node.getComponent(FruitItem)!;
        fruit.configure(definition.kind);
        this.attachHiddenView(node, definition.hidden);
        if (definition.iceLayers > 0) {
            if (!this.iceFruitPrefab) throw new Error('冰层预制体未绑定');
            const cover = instantiate(this.iceFruitPrefab);
            cover.parent = node;
            fruit.attachIce(definition.iceLayers, cover.getComponent(IceFruitView)!);
        }
        this.live.add(fruit);
        this.onSpawned!(fruit);
        return fruit;
    }

    /**
     * 仅实例化编辑器已制作的遮罩，不用代码创建 UI 节点。
     * @param owner 所属水果节点，遮罩跟随它移动与销毁。
     * @param hidden 原关卡是否要求隐藏外观。
     */
    private attachHiddenView(owner: Node, hidden: boolean): void {
        if (!hidden) return;
        if (!this.hiddenFruitPrefab) throw new Error('隐藏水果缺少遮罩预制体');
        const cover = instantiate(this.hiddenFruitPrefab);
        cover.parent = owner;
    }

    /** 一对水果真正移除后削减当前在场水果的冰层。 */
    reduceIce(): void {
        for (const fruit of this.live) if (!this.blackHoles.isPendingAppearance(fruit)) fruit.reduceIce();
    }

    /** @param fruit 即将下落或被移除的水果；非黑洞成员不会触发生成。 */
    releaseBlackHole(fruit: FruitItem): void {
        this.blackHoles.advance(fruit, definition => this.spawnOne(definition));
    }

    /** @param dt 当前帧时长，单位秒；更新黑洞表现及出现碰撞保护。 */
    updateBlackHoles(dt: number): void {
        this.blackHoles.tick(dt, [...this.live]);
    }

    /** 获取仍未点击的存活水果，已下落水果不跟随补位。 */
    getWaiting(): FruitItem[] {
        return [...this.live].filter(fruit => fruit.waiting);
    }

    /** 返回所有未消除的在场水果，供横向补位计算最左边界。 */
    getLive(): FruitItem[] {
        return [...this.live];
    }

    /**
     * 从存活集合移除已配对水果；表现结束后才销毁节点。
     * @param fruit 本次操作的水果实例。
     */
    remove(fruit: FruitItem): void {
        this.releaseBlackHole(fruit);
        this.live.delete(fruit);
    }

    /** 包含消除动画中的水果，避免动画尚未结束时误判失败。 */
    getFloorSnapshots(): FloorFruit[] {
        return this.fruitRoot.children
            .filter(node => isValid(node, true))
            .map(node => node.getComponent(FruitItem))
            .filter((fruit): fruit is FruitItem => !!fruit && !fruit.spawning)
            .map(fruit => fruit.getFloorSnapshot());
    }

    /** 冻结本局存活水果。 */
    freeze(): void {
        this.blackHoles.stop();
        for (const fruit of this.live) {
            fruit.freeze();
        }
    }

    /** 销毁全部单体，包括正在播放消除补间的节点。 */
    clear(): void {
        this.blackHoles.clear();
        this.onSpawned = null;
        if (isValid(this.fruitRoot)) {
            for (const node of [...this.fruitRoot.children]) {
                node.destroy();
            }
        }
        this.live.clear();
    }
}
