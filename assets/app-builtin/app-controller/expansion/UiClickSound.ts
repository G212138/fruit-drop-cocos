import { AudioClip, Button, Node } from 'cc';
import { app } from '../../../app/app';
import { GameSettings } from '../../app-model/expansion/GameSettings';
/** 现有 UI 按钮的统一点击反馈，不创建节点，也不处理水果触摸事件。 */
export class UiClickSound {
    /** 弱引用记录已监听的节点，重复显示不会叠加，销毁后可正常回收。 */
    private static readonly watched = new WeakSet<Node>();
    /** 弱引用记录按钮，避免内嵌弹窗被父页面及自身重复绑定。 */
    private static readonly buttons = new WeakSet<Button>();
    /** 绑定已制作的页面和之后实例化的弹窗。 @param root 页面或弹窗根节点。 */
    static bind(root: Node): void {
        this.watch(root);
        app.manager.loader.load({ path: 'audio/drop', bundle: 'page-game-res', type: AudioClip });
        app.manager.sound.setEffectMute(!GameSettings.current.snapshot.sound);
    }
    /** 遍历现有节点并监听新加入的预制体，不修改节点布局。 @param root 当前子树根节点。 */
    private static watch(root: Node): void {
        const button = root.getComponent(Button);
        if (button && !this.buttons.has(button)) {
            this.buttons.add(button);
            root.on(Button.EventType.CLICK, this.play, this);
        }
        if (this.watched.has(root)) return;
        this.watched.add(root);
        root.on(Node.EventType.CHILD_ADDED, this.watch, this);
        for (const child of root.children) this.watch(child);
    }
    /** 有效点击后读取最新偏好；切换页面和关闭弹窗不会中断本次反馈。 */
    private static play(): void {
        if (!GameSettings.current.snapshot.sound) return;
        app.manager.sound.setEffectMute(false);
        // 复用原版短促下落声，适配音量 0.65（0～1），避免盖过音乐。
        app.manager.sound.playEffect({ name: 'audio/drop', bundle: 'page-game-res', volume: 0.65 });
    }
}
