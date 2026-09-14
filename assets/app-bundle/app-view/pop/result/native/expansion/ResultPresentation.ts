import { _decorator, Component, Node, Tween, tween, UIOpacity, Vec3, AudioSource } from 'cc';
import { GameSettings } from '../../../../../../app-builtin/app-model/expansion/GameSettings';
const { ccclass, property } = _decorator;
/** 结算装饰动画；所有节点、粒子和音源均由编辑器绑定。 */
@ccclass('ResultPresentation')
export class ResultPresentation extends Component {
    /** 成功、复活、失败三个面板，按此顺序绑定。 */
    @property([Node]) cards: Node[] = [];
    /** 与面板对应的插画，仅做轻微呼吸缩放。 */
    @property([Node]) illustrations: Node[] = [];
    /** 编辑器制作的装饰粒子，分为三个状态容器。 */
    @property([Node]) particleRoots: Node[] = [];
    /** 原版失败提示音，复活入口和最终失败均使用。 */
    @property(AudioSource) failureAudio: AudioSource = null!;
    /** 复活提示使用原版合成提示音，降低音量。 */
    @property(AudioSource) reviveAudio: AudioSource = null!;
    /** 动画节点原始位置，防止复用后偏移累积。 */
    private readonly origins = new Map<Node, Vec3>();
    /** @param mode 0成功、1复活、2失败；位置来自预制体，时长单位秒。 */
    play(mode: number): void {
        this.stop();
        const card = this.cards[mode];
        if (!card) return;
        card.setScale(0.9, 0.9, 1);
        tween(card).to(0.28, { scale: new Vec3(1, 1, 1) }, { easing: mode === 2 ? 'sineOut' : 'backOut' }).start();
        const illustration = this.illustrations[mode];
        if (illustration) tween(illustration).repeatForever(tween().to(1.4, { scale: new Vec3(1.025, 1.025, 1) }, { easing: 'sineInOut' }).to(1.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })).start();
        this.particleRoots.forEach((root, index) => {
            root.active = index === mode;
            if (!root.active) return;
            root.children.forEach((particle, i) => {
                if (!this.origins.has(particle)) this.origins.set(particle, particle.position.clone());
                const origin = this.origins.get(particle)!;
                const opacity = particle.getComponent(UIOpacity)!;
                const duration = mode === 0 ? 1.8 : 2.2;
                const end = new Vec3(origin.x + (i % 2 ? 22 : -22), origin.y + (mode === 1 ? 95 : -110), origin.z);
                tween(particle).repeatForever(tween().delay(i * 0.09).call(() => { particle.setPosition(origin); opacity.opacity = 0; })
                    .call(() => { tween(opacity).to(0.2, { opacity: mode === 2 ? 85 : 210 }).delay(duration - 0.55).to(0.35, { opacity: 0 }).start(); })
                    .to(duration, { position: end }, { easing: 'sineInOut' })).start();
            });
        });
        if (GameSettings.current.snapshot.sound) {
            if (mode === 1) this.reviveAudio?.play();
            if (mode === 2) this.failureAudio?.play();
        }
    }
    /** 关闭、切换结算或复用时停止音效和所有装饰动画。 */
    stop(): void {
        this.failureAudio?.stop(); this.reviveAudio?.stop();
        for (const node of [...this.cards, ...this.illustrations]) { Tween.stopAllByTarget(node); node.setScale(1, 1, 1); }
        for (const root of this.particleRoots) for (const node of root.children) {
            Tween.stopAllByTarget(node);
            const opacity = node.getComponent(UIOpacity);
            if (opacity) { Tween.stopAllByTarget(opacity); opacity.opacity = 0; }
            const origin = this.origins.get(node); if (origin) node.setPosition(origin);
        }
    }
    /** 页面隐藏时取消循环，防止后台继续播放。 */
    onDisable(): void { this.stop(); }
}
