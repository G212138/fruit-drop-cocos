import { _decorator } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { SettingsPanel } from './expansion/SettingsPanel';
import { app } from '../../../../../app/app';
import { GameSettings } from '../../../../../app-builtin/app-model/expansion/GameSettings';
import type { PreferencesSnapshot } from '../../../../../app-builtin/app-model/expansion/GamePreferences';
import { UiClickSound } from '../../../../../app-builtin/app-controller/expansion/UiClickSound';
const { ccclass, property } = _decorator;
/** 设置独立弹窗；业务设置由共享控制器管理。 */
@ccclass('PopSettings')
export class PopSettings extends BaseView {
    /** 编辑器绑定的设置内容。 */
    @property(SettingsPanel) panel: SettingsPanel = null!;
    /** 显示当前音效与语言设置，不自行修改游戏运行状态。 */
    onShow(data?: { mode?: 'home' | 'game' }): void {
        this.hideEvent = 2;
        this.panel.setMode(data?.mode === 'game' ? 'game' : 'home');
        UiClickSound.bind(this.node);
        this.node.targetOff(this);
        this.node.on('setting-request', this.changeSetting, this);
        this.node.on('settings-action', this.closePop, this);
        this.panel.open(GameSettings.current.snapshot, GameSettings.current.warning);
    }
    /** @param key 用户选择的开关，由控制器验证并持久化。 */
    private changeSetting(key: keyof PreferencesSnapshot): void {
        const warning = app.controller.settings.toggle(key);
        this.panel.render(GameSettings.current.snapshot, warning);
    }
    /** @param action 关闭结果交给调用页面处理导航。 */
    private closePop(action: 'continue' | 'home' | 'restart'): void { this.hide(action); }
    /** @param action 将关闭原因返回调用方并清理事件。 */
    onHide(action?: string): string | undefined {
        this.node.targetOff(this);
        return action;
    }
}
