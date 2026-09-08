import { Node, Prefab, instantiate, isValid } from 'cc';
import { StarFlightView } from './StarFlightView';

/** 页面拥有的收集表现协调器，独立于棋盘计数和道具业务。 */
export class CollectionFeedback {
    /** 当前局正在飞行的双星实例。 */
    private readonly flights = new Set<StarFlightView>();
    /** 清局代次，阻止迟到回调。 */
    private generation = 0;

    /**
     * @param prefab 编辑器制作的双星预制体。
     * @param parent 页面适配后的HUD挂载点。
     * @param source 已有袋口节点。
     * @param target 已有进度标签节点。
     * @param level 原版关卡编号，大于30不播放星星。
     * @param arrived 星星抵达后交给HUD播放短反馈。
     */
    play(prefab: Prefab, parent: Node, source: Node, target: Node, level: number, arrived: () => void): void {
        if (level > 30 || !isValid(source, true) || !isValid(target, true)) {
            arrived();
            return;
        }
        const generation = this.generation;
        const node = instantiate(prefab);
        node.parent = parent;
        const flight = node.getComponent(StarFlightView)!;
        this.flights.add(flight);
        flight.play(source.worldPosition, target, () => {
            this.flights.delete(flight);
            if (generation === this.generation) arrived();
        });
    }

    /** 清局先失效回调，再销毁仍在飞行的预制体实例。 */
    clear(): void {
        this.generation++;
        for (const flight of this.flights) {
            if (!isValid(flight.node, true)) continue;
            flight.cancel();
            flight.node.destroy();
        }
        this.flights.clear();
    }
}
