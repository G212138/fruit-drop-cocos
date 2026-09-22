import { _decorator, Component, sp, AudioSource, isValid, Sprite, SpriteFrame, UIOpacity, Color } from 'cc';
import { GameHaptics } from '../../../../../../../app-builtin/app-controller/expansion/GameHaptics';
import { GameSettings } from '../../../../../../../app-builtin/app-model/expansion/GameSettings';
import { GameTerrain } from '../../../../../../../app-builtin/app-model/expansion/GameTerrain';
const { ccclass, property } = _decorator;

/** 原版gamebox草叶飞散，只播放一次并自行清理。 */
@ccclass('GroundImpactView')
export class GroundImpactView extends Component {
    /** yezi骨骼动画，使用yezi资源内的1号片段。 */
    @property(sp.Skeleton) skeleton: sp.Skeleton = null!;
    /** 原版yezi.mp3触地音效。 */
    @property(AudioSource) audio: AudioSource = null!;
    /** 编辑器内固定碎屑节点，按当前地块切换材质。 */
    @property([Sprite]) particles: Sprite[] = [];
    /** 沙尘、岩屑、木屑、饼干、雪粒、冰屑、熔岩、极光素材。 */
    @property([SpriteFrame]) materialFrames: SpriteFrame[] = [];
    /** 每颗碎屑初速度和旋转速度，单位设计像素/秒与度/秒。 */
    private motions: { vx: number; vy: number; spin: number; size: number }[] = [];
    /** 当前播放时间，秒。 */
    private elapsed = 0;
    /** 扬尘模式使用较轻重力并缓慢扩散。 */
    private dust = false;
    /** 挂入特效层后按已选地块播放，完成销毁。 */
    onLoad(): void {
        const terrain = GameTerrain.entry.id;
        const indices: Record<string, number> = { coast: 0, canyon: 1, wood: 2, cream: 3, cake: 3, snow: 4, ice: 5, lava: 6, aurora: 7 };
        const frame = this.materialFrames[indices[terrain]];
        if (frame && this.particles.length) {
            this.skeleton.enabled = false;
            this.dust = terrain === 'coast';
            this.motions = this.particles.map((sprite, i) => {
                sprite.node.active = true;
                sprite.spriteFrame = frame;
                sprite.color = terrain === 'cake' ? new Color(255, 229, 210) : Color.WHITE;
                return { vx: (i % 2 ? 1 : -1) * (35 + Math.random() * 100), vy: 70 + Math.random() * 130, spin: (Math.random() - 0.5) * 500, size: this.dust ? 0.8 + Math.random() * 0.5 : 0.35 + Math.random() * 0.5 };
            });
            this.update(0);
            return;
        }
        for (const particle of this.particles) particle.node.active = false;
        this.skeleton.setCompleteListener(() => this.node.destroy());
        this.skeleton.setAnimation(0, '1', false);
    }
    /** 碎屑一次性飞散并淡出，草地继续使用原版骨骼动画。 */
    update(dt: number): void {
        if (!this.motions.length) return;
        this.elapsed += Math.max(0, dt);
        const t = this.elapsed;
        if (t >= 0.65) { this.node.destroy(); return; }
        this.particles.forEach((sprite, i) => {
            const motion = this.motions[i];
            sprite.node.setPosition(motion.vx * t, motion.vy * t - (this.dust ? 90 : 360) * t * t, 0);
            const scale = motion.size * (this.dust ? 1 + t : 1);
            sprite.node.setScale(scale, scale, 1);
            sprite.node.angle = motion.spin * t;
            sprite.node.getComponent(UIOpacity)!.opacity = 255 * Math.max(0, 1 - t / 0.65);
        });
    }
    /** 等全部组件完成onLoad后播放，避免AudioSource初始化清空提前排队的播放请求。 */
    start(): void {
        GameHaptics.impact();
        if (GameSettings.current.snapshot.sound) this.audio.play();
    }
    /** 退出清局时停止声音和骨骼监听。 */
    onDestroy(): void {
        if (isValid(this.skeleton, true)) this.skeleton.setCompleteListener(null!);
        if (isValid(this.audio, true)) this.audio.stop();
    }
}
