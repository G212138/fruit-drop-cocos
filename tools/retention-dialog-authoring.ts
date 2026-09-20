// @ts-nocheck
import * as cc from 'cc';

/** 首页内独立礼包素材所在分包，避免从首页跨包加载游戏图片。 */
const folder = 'db://assets/app-bundle/app-view/page/home/resources/textures/retention/';

/** @param url Creator 资源 URL。 @param frame 是否读取 SpriteFrame 子资源。 */
async function asset(url, frame = false) {
    const info = await Editor.Message.request('asset-db', 'query-asset-info', url);
    if (!info) throw Error('资源未导入：' + url);
    let uuid = info.uuid;
    if (frame) {
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
        uuid = Object.values(meta.subMetas).find(item => item.importer === 'sprite-frame').uuid;
    }
    return new Promise((resolve, reject) => cc.assetManager.loadAny(uuid, (error, value) => error ? reject(error) : resolve(value)));
}

/** @param parent 父节点。 @param name 名称。 @param w 宽度。 @param h 高度。 @param x 编辑器横坐标。 @param y 编辑器纵坐标。 */
function node(parent, name, w, h, x = 0, y = 0) {
    const n = new cc.Node(name);
    n.layer = cc.Layers.Enum.UI_2D;
    n.addComponent(cc.UITransform).setContentSize(w, h);
    n.parent = parent;
    n.setPosition(x, y);
    return n;
}

/** @param parent 父节点。 @param name 名称。 @param file PNG 文件。 @param w 宽度。 @param h 高度。 @param x 横坐标。 @param y 纵坐标。 */
async function sprite(parent, name, file, w, h, x = 0, y = 0) {
    const n = node(parent, name, w, h, x, y);
    const s = n.addComponent(cc.Sprite);
    s.spriteFrame = await asset(folder + file, true);
    s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    s.trim = true;
    n.getComponent(cc.UITransform).setContentSize(w, h);
    return n;
}

/** @param parent 父节点。 @param name 节点名。 @param text 初始文案。 @param w 宽度。 @param h 高度。 @param size 字号。 @param x 横坐标。 @param y 纵坐标。 */
function label(parent, name, text, w, h, size, x = 0, y = 0) {
    const n = node(parent, name, w, h, x, y);
    const l = n.addComponent(cc.Label);
    l.string = text;
    l.useSystemFont = true;
    l.fontFamily = 'sans-serif';
    l.fontSize = size;
    l.lineHeight = size * 1.2;
    l.isBold = true;
    l.enableWrapText = true;
    l.overflow = cc.Label.Overflow.SHRINK;
    l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    l.verticalAlign = cc.Label.VerticalAlign.CENTER;
    l.color = new cc.Color(83, 43, 24);
    return l;
}

/** @param n 按钮节点。 @param target 业务组件节点。 @param method 回调。 @param mission 任务名。 */
function button(n, target, method, mission = '') {
    const b = n.addComponent(cc.Button);
    b.transition = cc.Button.Transition.SCALE;
    b.zoomScale = .95;
    const e = new cc.EventHandler();
    e.target = target;
    e.component = 'TikTokRevisitView';
    e.handler = method;
    e.customEventData = mission;
    b.clickEvents = [e];
}

/** @param n 节点，使用 Widget 在编辑器中拉伸至父节点边界。 */
function stretch(n) {
    const w = n.addComponent(cc.Widget);
    w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
    w.top = w.bottom = w.left = w.right = 0;
    w.alignMode = cc.Widget.AlignMode.ALWAYS;
}

/** 仅编辑器调用，保留首页其他节点和用户调整，仅替换旧回访入口。 */
@cc._decorator.ccclass('RetentionDialogAuthoring')
export class RetentionDialogAuthoring extends cc.Component {
    /** 创建两个完整礼包弹窗并通过 Creator 序列化保存首页。 */
    async author() {
        if (typeof Editor === 'undefined') throw Error('仅允许编辑器执行');
        const url = 'db://assets/app-bundle/app-view/page/home/native/PageHome.prefab';
        const root = cc.instantiate(await asset(url));
        cce.Prefab.removePrefabInfoFromNode(root, true);
        const group = root.getChildByName('TikTokRevisitView');
        if (!group) throw Error('缺少原有回访组件');
        for (const child of [...group.children]) {
            child.removeFromParent();
            child.destroy();
        }
        const view = group.getComponent('TikTokRevisitView');
        if (!view || !('shortcutDialog' in view)) throw Error('新脚本未编译，请重试');
        group.getComponent(cc.UITransform).setContentSize(750, 1625);
        if (!group.getComponent(cc.Widget)) stretch(group);
        for (const mission of ['profile', 'shortcut']) {
            const shortcut = mission === 'shortcut';
            const prefix = shortcut ? 'shortcut' : 'profile';
            const entry = node(group, shortcut ? 'ShortcutButton' : 'ProfileButton', 128, 154, shortcut ? 280 : -280, 45);
            await sprite(entry, 'Icon', shortcut ? 'add-desktop.png' : 'sidebar-reward.png', 112, 112, 0, 10);
            const caption = label(entry, 'Caption', shortcut ? 'Add to Home' : 'Sidebar Gift', 150, 44, 22, 0, -66);
            caption.color = cc.Color.WHITE;
            const stroke = caption.node.addComponent(cc.LabelOutline);
            stroke.color = new cc.Color(37, 86, 95);
            stroke.width = 2;
            button(entry, group, 'request', mission);
            view[prefix + 'Button'] = entry;
            view[prefix + 'Label'] = caption;
        }
        view.notice = label(group, 'Notice', '', 620, 65, 25, 0, -370);
        view.notice.node.active = false;
        for (const mission of ['profile', 'shortcut']) {
            const shortcut = mission === 'shortcut';
            const prefix = shortcut ? 'shortcut' : 'profile';
            const layer = node(group, shortcut ? 'DesktopGiftDialog' : 'SidebarGiftDialog', 750, 1625);
            stretch(layer);
            const mask = await sprite(layer, 'Mask', 'mask.png', 750, 1625);
            stretch(mask);
            mask.getComponent(cc.Sprite).color = new cc.Color(0, 20, 40, 180);
            mask.addComponent(cc.BlockInputEvents);
            button(mask, group, 'close');
            mask.getComponent(cc.Button).transition = cc.Button.Transition.NONE;
            const card = node(layer, 'Content', 650, 900);
            card.addComponent(cc.BlockInputEvents);
            await sprite(card, 'Background', 'panel.png', 650, 900);
            await sprite(card, 'Title', shortcut ? 'title-desktop.png' : 'title-sidebar.png', 530, 150, -10, 407);
            await sprite(card, 'Illustration', shortcut ? 'illustration-desktop.png' : 'illustration-sidebar.png', shortcut ? 310 : 280, 245, 0, 213);
            view[prefix + 'Description'] = label(card, 'Description', shortcut ? 'Add a shortcut. Play anytime!' : 'Find us in your TikTok sidebar!', 530,  70, 28, 0, 57);
            await sprite(card, 'RewardCard', 'reward-card.png', 536, 219, 0, -110);
            await sprite(card, 'RewardIcon', shortcut ? 'reward-clear.png' : 'reward-shuffle.png', 205, 158, 0, -90);
            view[prefix + 'Reward'] = label(card, 'RewardCaption', shortcut ? 'FREE CLEAR ×1' : 'FREE SHUFFLE ×1', 460, 43, 29, 0, -185);
            view[prefix + 'Reward'].color = new cc.Color(24, 55, 94);
            const action = await sprite(card, 'ActionButton', 'button-green.png', 465, 115, 0, -295);
            button(action, group, 'begin', mission);
            view[prefix + 'Action'] = label(action, 'Caption', shortcut ? 'ADD NOW' : 'GO NOW', 390, 75, 38);
            view[prefix + 'Action'].color = cc.Color.WHITE;
            const outline = view[prefix + 'Action'].node.addComponent(cc.LabelOutline);
            outline.color = new cc.Color(27, 83, 25);
            outline.width = 3;
            view[prefix + 'Notice'] = label(card, 'Notice', '', 515, 70, 22, 0, -385);
            const close = await sprite(card, 'CloseButton', 'close.png', 85, 85, 277, 385);
            button(close, group, 'close');
            layer.active = false;
            view[prefix + 'Dialog'] = layer;
        }
        const data = cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db', 'save-asset', url, data.prefabData || data);
        root.destroy();
        return '首页两个独立礼包弹窗与图标入口已保存';
    }
}

