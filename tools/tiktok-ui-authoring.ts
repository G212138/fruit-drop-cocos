// @ts-nocheck
import * as cc from 'cc';

/** @param url 编辑器资源地址；加载 Creator 已导入的资源。 */
async function asset(url) {
    const info = await Editor.Message.request('asset-db', 'query-asset-info', url);
    if (!info) throw new Error('资源不存在：' + url);
    return new Promise((resolve, reject) => cc.assetManager.loadAny(info.uuid, (error, value) => error ? reject(error) : resolve(value)));
}

/** @param parent 编辑器父节点。 @param name 节点名称。 @param width 宽度像素。 @param height 高度像素。 */
function node(parent, name, width, height) {
    const value = new cc.Node(name);
    value.layer = cc.Layers.Enum.UI_2D;
    value.parent = parent;
    value.addComponent(cc.UITransform).setContentSize(width, height);
    return value;
}

/** @param parent 编辑器父节点。 @param text 初始显示文字。 @param width 可用于多语言换行的宽度。 */
function label(parent, text, width) {
    const result = node(parent, 'Caption', width, 86).addComponent(cc.Label);
    result.string = text;
    result.useSystemFont = true;
    result.fontSize = 24;
    result.lineHeight = 31;
    result.enableWrapText = true;
    result.overflow = cc.Label.Overflow.SHRINK;
    result.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    result.verticalAlign = cc.Label.VerticalAlign.CENTER;
    result.color = new cc.Color(255, 255, 255);
    return result;
}

/** 仅运行于 Creator 编辑器，通过 MCP 生成并保存首页节点。 */
@cc._decorator.ccclass('TikTokUiAuthoring')
export class TikTokUiAuthoring extends cc.Component {
    /** 在首页内嵌回访按钮，保留已有布局和资源 UUID。 */
    async author() {
        const url = 'db://assets/app-bundle/app-view/page/home/native/PageHome.prefab';
        const root = cc.instantiate(await asset(url));
        cce.Prefab.removePrefabInfoFromNode(root, true);
        if (root.getChildByName('TikTokRevisitView')) throw new Error('回访入口已存在，请先检查，避免覆盖');
        const group = node(root, 'TikTokRevisitView', 750, 1625);
        group.setSiblingIndex(root.getChildByName('ThemePanel').getSiblingIndex());
        const component = group.addComponent('TikTokRevisitView');
        const frame = root.getChildByName('StartButton').getComponent(cc.Sprite).spriteFrame;
        for (const [mission, title, y] of [['shortcut', 'Home shortcut\n+1 Remove', -160], ['profile', 'Profile revisit\n+1 Shuffle', -290]]) {
            const button = node(group, mission === 'shortcut' ? 'ShortcutButton' : 'ProfileButton', 260, 106);
            button.setPosition(-210, y);
            const sprite = button.addComponent(cc.Sprite);
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = frame;
            const caption = label(button, title, 225);
            const click = new cc.EventHandler();
            click.target = group; click.component = 'TikTokRevisitView'; click.handler = 'request'; click.customEventData = mission;
            button.addComponent(cc.Button).clickEvents = [click];
            component[mission === 'shortcut' ? 'shortcutButton' : 'profileButton'] = button;
            component[mission === 'shortcut' ? 'shortcutLabel' : 'profileLabel'] = caption;
        }
        component.notice = label(group, '', 650);
        component.notice.node.name = 'Notice';
        component.notice.node.setPosition(0, -395);
        component.notice.color = new cc.Color(39, 75, 99);
        const data = cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db', 'save-asset', url, data.prefabData || data);
        root.destroy();
        return { saved: url, component: 'TikTokRevisitView' };
    }
}
