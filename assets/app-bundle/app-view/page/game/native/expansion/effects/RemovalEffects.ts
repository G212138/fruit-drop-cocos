import { _decorator, Component, Node, Prefab, instantiate, UITransform, AudioSource, isValid, Vec3 } from 'cc';
import { ExplosionView } from './ExplosionView';
import { FruitBagView } from './FruitBagView';
import { GameSettings } from '../../../../../../../app-builtin/app-model/expansion/GameSettings';
const { ccclass, property } = _decorator;

/** 独立特效层，只实例化编辑器爆炸预制体，音源也由预制体提供。 */
@ccclass('RemovalEffects')
export class RemovalEffects extends Component {
    /** 原版爆炸资源对应的独立预制体。 */
    @property(Prefab)
    explosionPrefab: Prefab = null!;
    /** 编辑器音源绑定原 bomb.mp3；使用可停止播放，清局不会残留一次性声音。 */
    @property(AudioSource)
    audio: AudioSource = null!;
    /** 原 hecheng.mp3 音源，由预制体提供。 */
    @property(AudioSource)
    mergeAudio: AudioSource = null!;
    /** 独立袋子预制体实例，通过节点读取组件避免跨预制体组件绑定丢失。 */
    @property(Node)
    bagRoot: Node = null!;

    /** 页面连接的进度反馈；无页面连接时保持入袋即通知的独立预览能力。 */
    collectionFeedback: ((source: Node, completed: () => void) => void) | null = null;

    /** @param first 第一颗退出物理的水果。 @param second 同类伙伴。 @param completed 入袋完成后的计数通知。 */
    showNormalPair(first: Node, second: Node, completed: () => void): void {
        const midpoint = Vec3.add(new Vec3(), first.worldPosition, second.worldPosition).multiplyScalar(0.5);
        const effect = instantiate(this.explosionPrefab);
        effect.setPosition(this.node.getComponent(UITransform)!.convertToNodeSpaceAR(midpoint));
        effect.getComponent(ExplosionView)!.setMidpointCallback(() => {
            if (!isValid(first, true) || !isValid(second, true)) return;
            const bag = this.bagRoot.getComponent(FruitBagView)!;
            bag.collect([first, second], () => {
                if (this.collectionFeedback) this.collectionFeedback(bag.target, completed);
                else completed();
            });
        });
        effect.parent = this.node;
        if (GameSettings.current.snapshot.sound) this.mergeAudio.play();
    }
    /** 当前复活是否已经处理过爆炸音，避免两对四颗叠加播放。 */
    private soundHandled = false;

    /** 开始一次复活，重置音效次数；纯回收不会调用播放。 */
    beginRevive(): void {
        this.soundHandled = false;
    }

    /** @param first 第一颗仍未销毁的水果节点。 @param second 同类伙伴节点。 */
    showRevivePair(first: Node, second: Node): void {
        this.spawnAt(first);
        this.spawnAt(second);
        if (this.soundHandled) return;
        this.soundHandled = true;
        if (GameSettings.current.snapshot.sound) this.audio.play();
    }

    /** @param fruit 取得世界位置后换算到特效层，支持水果和特效处于不同父节点。 */
    private spawnAt(fruit: Node): void {
        const position = this.node.getComponent(UITransform)!.convertToNodeSpaceAR(fruit.worldPosition);
        const effect = instantiate(this.explosionPrefab);
        effect.setPosition(position);
        effect.parent = this.node;
    }

    /** 重开和退出时清理特效，不能让它们进入下一局。 */
    clear(): void {
        if (isValid(this.audio, true)) this.audio.stop();
        if (isValid(this.mergeAudio, true)) this.mergeAudio.stop();
        this.bagRoot?.getComponent(FruitBagView)?.clear();
        for (const child of [...this.node.children]) {
            if (child.getComponent(ExplosionView)) child.destroy();
        }
        this.soundHandled = false;
    }
}
