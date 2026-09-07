import { _decorator, Component, Node, Prefab, instantiate, isValid } from 'cc';
import { FloorFruit } from '../failure/FloorFailureRules';
import { FruitItem } from '../fruit/FruitItem';
import { FruitDefinition } from '../level/LevelDefinition';
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

    /** 存活实例集合，消除时移除，重开时清空。 */
    private readonly live = new Set<FruitItem>();

    /** 返回存活数量，用于判断当前批次是否结束。 */
    get count(): number {
        return this.live.size;
    }

    /**
     * 按关卡坐标实例化水果，并交由棋盘绑定事件。
     * @param wave 整关水果定义列表，保留原配置顺序。
     * @param onSpawned 每个水果实例化完成后绑定局部事件的回调。
     */
    spawn(wave: FruitDefinition[], onSpawned: (fruit: FruitItem) => void): void {
        for (const definition of wave) {
            const prefab = this.fruitPrefabs.find(value => value.data.getComponent(FruitItem)?.kind === definition.kind);
            if (!prefab) throw new Error('水果缺少预制体：' + definition.kind);
            const node = instantiate(prefab);
            node.parent = this.fruitRoot;
            node.setPosition(definition.x, definition.y);
            const fruit = node.getComponent(FruitItem)!;
            fruit.configure(definition.kind);
            this.attachHiddenView(node, definition.hidden);
            this.live.add(fruit);
            onSpawned(fruit);
        }
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

    /** 获取仍未点击的存活水果，已下落水果不跟随补位。 */
    getWaiting(): FruitItem[] {
        return [...this.live].filter(fruit => fruit.waiting);
    }

    /**
     * 从存活集合移除已配对水果；表现结束后才销毁节点。
     * @param fruit 本次操作的水果实例。
     */
    remove(fruit: FruitItem): void {
        this.live.delete(fruit);
    }

    /** 包含消除动画中的水果，避免动画尚未结束时误判失败。 */
    getFloorSnapshots(): FloorFruit[] {
        return this.fruitRoot.children
            .filter(node => isValid(node, true))
            .map(node => node.getComponent(FruitItem))
            .filter((fruit): fruit is FruitItem => !!fruit)
            .map(fruit => fruit.getFloorSnapshot());
    }

    /** 冻结本局存活水果。 */
    freeze(): void {
        for (const fruit of this.live) {
            fruit.freeze();
        }
    }

    /** 销毁全部单体，包括正在播放消除补间的节点。 */
    clear(): void {
        if (isValid(this.fruitRoot)) {
            for (const node of [...this.fruitRoot.children]) {
                node.destroy();
            }
        }
        this.live.clear();
    }
}
