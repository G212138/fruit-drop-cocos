// @ts-nocheck
import * as cc from 'cc';

/** 首页内独立礼包素材所在分包，避免从首页跨包加载游戏图片。 */
const folder = 'db://assets/app-bundle/app-view/page/home/resources/revisit/';

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

/** 仅编辑器运行，添加背景后方的三层云，不改动现有按钮和适配。 */
@cc._decorator.ccclass('CloudAuthoring')
export class CloudAuthoring extends cc.Component {
    /** 使用编辑器序列化接口保存云层。 */
    async author() {
        const url = 'db://assets/app-bundle/app-view/page/home/native/PageHome.prefab';
        const root = cc.instantiate(await asset(url));
        cce.Prefab.removePrefabInfoFromNode(root, true);
        const bg = root.getChildByName('Background');
        if (!bg) throw Error('缺少背景');
        const old = root.getChildByName('CloudLayer');
        if (old) { old.removeFromParent(); old.destroy(); }
        const layer = node(root, 'CloudLayer', 750, 1625);
        stretch(layer);
        layer.setSiblingIndex(bg.getSiblingIndex() + 1);
        const frame = await asset('db://assets/app-bundle/app-view/page/home/resources/redesign/cloud.png', true);
        for (const [index, top, x, width, speed, alpha] of [[1,140,-230,280,10,190],[2,400,260,230,-7,150],[3,690,-180,320,8,130]]) {
            const row = node(layer, 'CloudRow'+index, 750, 140);
            const widget=row.addComponent(cc.Widget);
            widget.isAlignLeft=widget.isAlignRight=widget.isAlignTop=true;
            widget.left=widget.right=0; widget.top=top; widget.alignMode=cc.Widget.AlignMode.ALWAYS;
            const cloud=node(row,'Cloud'+index,width,width*0.4,x,0);
            const sprite=cloud.addComponent(cc.Sprite);
            sprite.spriteFrame=frame; sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
            cloud.getComponent(cc.UITransform).setContentSize(width,width*0.4);
            cloud.addComponent(cc.UIOpacity).opacity=alpha;
            cloud.addComponent('HomeCloudMotion').speed=speed;
        }
        const data=cce.Prefab.generatePrefabDataFromNode(root);
        await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);
        root.destroy(); return '云层已保存';
    }
}