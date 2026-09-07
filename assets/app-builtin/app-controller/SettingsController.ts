import { app } from '../../app/app';
import BaseController from 'db://app/base/BaseController';
import { GameSettings } from '../app-model/expansion/GameSettings';
import { PreferencesSnapshot } from '../app-model/expansion/GamePreferences';

/** 设置副作用边界，使用 XForge 音频管理器，不持有页面或棋盘节点。 */
export class SettingsController extends BaseController<SettingsController, {}>() {
    /** 本显示周期是否仍需要背景音乐，异步载入结束后再次检查。 */
    private active = false;

    /** 进入游戏后播放原版循环音乐，并应用已保存的开关。 */
    begin(): void {
        this.active = true;
        this.applyAudio();
        app.manager.sound.playMusic({ name: 'audio/music', bundle: 'page-game-res', onPlay: () => {
            if (!this.active) app.manager.sound.stopMusic();
            else this.applyAudio();
        } });
    }

    /** @param key 被点击的设置项；返回保存或平台支持说明。 */
    toggle(key: keyof PreferencesSnapshot): string {
        const enabled = GameSettings.current.toggle(key);
        this.applyAudio();
        // 震动平台适配尚未接入；设置正常保存，但不能声称已经执行震动。
        if (key === 'vibrate' && enabled) return GameSettings.current.warning || '震动偏好已保存，当前版本暂不提供震动反馈';
        return GameSettings.current.warning;
    }

    /** 同步两个独立音频开关；碎冰独立音源同时读取同一业务设置。 */
    private applyAudio(): void {
        const settings = GameSettings.current.snapshot;
        app.manager.sound.setEffectMute(!settings.sound);
        app.manager.sound.setMusicMute(!settings.music);
        if (settings.music) app.manager.sound.resumeMusic();
        else app.manager.sound.pauseMusic();
    }

    /** 页面退出时释放本局背景音乐，避免资源包卸载后继续持有声音。 */
    end(): void {
        this.active = false;
        app.manager.sound.stopMusic();
    }
}
