import { _decorator, Component, Node, Prefab, SpriteFrame, instantiate, isValid } from 'cc';
import { FruitItem } from '../fruit/FruitItem';
import { FruitDefinition } from '../level/LevelDefinition';
const { ccclass, property } = _decorator;

/** 水果实例集合，只实例化编辑器制作的预制体。 */
@ccclass('FruitSpawner')
export class FruitSpawner extends Component {
    @property(Node)
    fruitRoot: Node = null!;

    @property(Prefab)
    fruitPrefab: Prefab = null!;

    @property([SpriteFrame])
    frames: SpriteFrame[] = [];

    private readonly frameKinds = [21, 22, 6, 17];
    private readonly live = new Set<FruitItem>();

    /** 返回存活数量，用于判断当前批次是否结束。 */
    get count(): number {
        return this.live.size;
    }

    /** 按关卡坐标实例化水果，并交由棋盘绑定事件。 */
    spawn(wave: FruitDefinition[], onSpawned: (fruit: FruitItem) => void): void {
        for (const definition of wave) {
            const frame = this.frames[this.frameKinds.indexOf(definition.kind)];
            if (!frame) {
                throw new Error('水果缺少图片绑定：' + definition.kind);
            }
            const node = instantiate(this.fruitPrefab);
            node.parent = this.fruitRoot;
            node.setPosition(definition.x, definition.y);
            const fruit = node.getComponent(FruitItem)!;
            fruit.configure(definition.kind, frame);
            this.live.add(fruit);
            onSpawned(fruit);
        }
    }

    /** 从存活集合移除已配对水果；表现结束后才销毁节点。 */
    remove(fruit: FruitItem): void {
        this.live.delete(fruit);
    }

    /** 检查验证版出界条件，暂不代表原版完整失败规则。 */
    hasEscaped(bottom: number): boolean {
        return [...this.live].some(fruit => fruit.node.position.y < bottom);
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
