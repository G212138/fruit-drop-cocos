import { _decorator, Component, sp, AudioSource, isValid } from 'cc';
import { GameHaptics } from '../../../../../../../app-builtin/app-controller/expansion/GameHaptics';
import { GameSettings } from '../../../../../../../app-builtin/app-model/expansion/GameSettings';
const { ccclass, property } = _decorator;

/** 原版gamebox草叶飞散，只播放一次并自行清理。 */
@ccclass('GroundImpactView')
export class GroundImpactView extends Component {
    /** yezi骨骼动画，使用yezi资源内的1号片段。 */
    @property(sp.Skeleton) skeleton: sp.Skeleton = null!;
    /** 原版yezi.mp3触地音效。 */
    @property(AudioSource) audio: AudioSource = null!;
    /** 挂入特效层后播放原动画，完成销毁。 */
    onLoad(): void {
        this.skeleton.setCompleteListener(() => this.node.destroy());
        this.skeleton.setAnimation(0, '1', false);
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
