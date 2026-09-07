import { _decorator, Component, Node, Prefab, instantiate, UITransform, AudioSource, isValid } from 'cc';
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
        for (const child of [...this.node.children]) child.destroy();
        this.soundHandled = false;
    }
}
