// @ts-nocheck
import * as cc from 'cc';

/** 首页内独立礼包素材所在分包，避免从首页跨包加载游戏图片。 */
const folder = 'db://assets/app-bundle/app-view/page/game/resources/textures/hud-actions/';

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

@cc._decorator.ccclass('FixUnlockText')
export class FixUnlockText extends cc.Component {
    /** 仅增加独立译文，原主题图及碰撞保持不变。 */
    async author() {
        for(const url of ['db://assets/app-bundle/app-view/page/game/native/PageGame.prefab','db://assets/app-bundle/app-view/page/game/resources/prefabs/LockWallView.prefab']) {
            const root=cc.instantiate(await asset(url));cce.Prefab.removePrefabInfoFromNode(root,true);
            const visual=url.endsWith('PageGame.prefab')?root.getChildByPath('BoardRoot/GameBoard/LockWallLayout/LockWallView/Visual'):root.getChildByName('Visual');
            if(!visual)throw Error('缺少锁墙图片');
            for(const name of ['UnlockPlaque','VideoBadge']){const n=visual.getChildByName(name);if(n){n.removeFromParent();n.destroy();}}
            visual.getComponent(cc.UITransform).setContentSize(163,95);
            const theme=visual.getComponent('ThemeSprite');
            visual.getComponent(cc.Sprite).spriteFrame=theme?theme.fruitFrame:await asset('db://assets/app-bundle/app-view/page/game/resources/textures/themes/part-2.png',true);
            visual.getComponent(cc.Sprite).sizeMode=cc.Sprite.SizeMode.CUSTOM;
            visual.getComponent(cc.UITransform).setContentSize(163,95);
            let n=visual.getChildByName('UnlockCaption');
            if(!n)n=label(visual,'UnlockCaption','Unlock',125,30,23,0,-19).node;
            n.setPosition(0,-19,0);n.getComponent(cc.UITransform).setContentSize(125,30);
            const l=n.getComponent(cc.Label);l.fontSize=23;l.lineHeight=28;l.color=cc.Color.WHITE;l.isBold=true;l.overflow=cc.Label.Overflow.SHRINK;
            const o=n.getComponent(cc.LabelOutline)||n.addComponent(cc.LabelOutline);o.enabled=true;o.color=new cc.Color(37,29,23);o.width=2;
            const loc=n.getComponent('LocalizedLabel')||n.addComponent('LocalizedLabel');loc.key='unlock';
            const data=cce.Prefab.generatePrefabDataFromNode(root);await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);root.destroy();
        }
        return '两种原皮肤保留，解锁文字已改独立多语言标签';
    }
}