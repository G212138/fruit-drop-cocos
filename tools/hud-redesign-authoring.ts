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

/** 编辑器制作：只替换指定 HUD 的视觉，不修改物理、存档和按钮回调。 */
@cc._decorator.ccclass('HudRedesignAuthoring')
export class HudRedesignAuthoring extends cc.Component {
    /** 保存局内六处界面。 */
    async author() {
        const url='db://assets/app-bundle/app-view/page/game/native/PageGame.prefab';
        const root=cc.instantiate(await asset(url));
        cce.Prefab.removePrefabInfoFromNode(root,true);
        const find=(name)=>{const all=[];const walk=n=>{if(n.name===name)all.push(n);n.children.forEach(walk);};walk(root);if(all.length!==1)throw Error(name+':'+all.length);return all[0];};
        const size=(n,w,h)=>n.getComponent(cc.UITransform).setContentSize(w,h);
        const plain=(l,w,h,font)=>{l.fontSize=font;l.lineHeight=font*1.15;l.isBold=true;l.useSystemFont=true;l.fontFamily='sans-serif';l.overflow=cc.Label.Overflow.SHRINK;l.horizontalAlign=1;l.verticalAlign=1;l.color=new cc.Color(76,38,15);size(l.node,w,h);const out=l.node.getComponent(cc.LabelOutline);if(out)out.enabled=false;};
        const localized=(parent,name,key,w,h,font,x,y)=>{const l=label(parent,name,key,w,h,font,x,y);plain(l,w,h,font);l.node.addComponent('LocalizedLabel').key=key;return l;};
        const replace=async(n,file,w,h)=>{const s=n.getComponent(cc.Sprite)||n.addComponent(cc.Sprite);s.enabled=true;s.spriteFrame=await asset(folder+file,true);s.type=cc.Sprite.Type.SIMPLE;s.sizeMode=cc.Sprite.SizeMode.CUSTOM;s.color=cc.Color.WHITE;size(n,w,h);return s;};
        const progress=find('FruitProgressView'), view=progress.getComponent('FruitProgressView');
        if(!('barFill' in view))throw Error('进度脚本未编译');
        const card=await sprite(progress,'RemainingCard','remaining-card.png',182,116,-260,0);
        const cw=card.addComponent(cc.Widget);cw.isAlignBottom=true;cw.bottom=390;cw.alignMode=cc.Widget.AlignMode.ALWAYS;
        const caption=find('RemainingCaption');caption.active=false;
        localized(card,'Caption','remaining',90,33,24,31,27);
        const count=view.remaining.node;const countWidget=count.getComponent(cc.Widget);if(countWidget)countWidget.enabled=false;count.parent=card;count.setPosition(32,-22,0);plain(view.remaining,90,52,40);
        const fruit=cc.instantiate(await asset('db://assets/app-bundle/app-view/page/game/resources/prefabs/fruit/Fruit01.prefab'));
        const fs=fruit.getComponentInChildren(cc.Sprite);
        const icon=node(card,'FruitIcon',66,70,-47,0);const is=icon.addComponent(cc.Sprite);is.spriteFrame=fs.spriteFrame;is.sizeMode=cc.Sprite.SizeMode.CUSTOM;size(icon,66,70);fruit.destroy();
        const collectible=view.progressRoot;
        const track=await sprite(collectible,'ProgressTrack','progress-track.png',188,55,0,-83);
        const fill=await sprite(track,'ProgressFill','progress-fill.png',162,33,0,1);
        const fillSprite=fill.getComponent(cc.Sprite);fillSprite.type=cc.Sprite.Type.FILLED;fillSprite.fillType=cc.Sprite.FillType.HORIZONTAL;fillSprite.fillStart=0;fillSprite.fillRange=0;view.barFill=fillSprite;
        const percentage=view.percentage.node;percentage.parent=track;percentage.setPosition(0,1,0);plain(view.percentage,150,42,31);view.percentage.color=cc.Color.WHITE;const po=percentage.getComponent(cc.LabelOutline)||percentage.addComponent(cc.LabelOutline);po.enabled=true;po.color=new cc.Color(32,69,8);po.width=2;
        for(const [name,kind,key,file] of [['EliminateButton','eliminate','eliminate','clear-icon.png'],['ShuffleButton','shuffle','shuffle','shuffle-icon.png']]) {
            const n=find(name);await replace(n,'action-card.png',162,162);
            await sprite(n,'ActionIcon',file,105,112,0,17);
            localized(n,'ActionCaption',key,137,36,28,0,-51);
            const ad=find(kind+'Ad');await replace(ad,'video-badge.png',44,32);ad.setPosition(57,53,0);ad.setSiblingIndex(n.children.length-1);
            const badge=find(kind+'Badge');badge.setPosition(57,53,0);badge.setSiblingIndex(n.children.length-1);
        }
        const shake=find('ShakeButton');await replace(shake,'shake-card.png',210,82);shake.getComponent(cc.Widget).bottom=277;
        const si=node(shake,'ShakeIcon',82,76,-59,0);const ss=si.addComponent(cc.Sprite);ss.spriteFrame=await asset('db://assets/app-bundle/app-view/page/game/resources/textures/shake-icon.png',true);ss.sizeMode=cc.Sprite.SizeMode.CUSTOM;size(si,82,76);
        const sl=shake.getChildByName('Label').getComponent(cc.Label);sl.node.setPosition(38,0,0);plain(sl,110,52,26);
        // 锁墙保留两种原皮肤；独立多语言标签由 tools/unlock-text-authoring.ts 制作。
        const data=cce.Prefab.generatePrefabDataFromNode(root);await Editor.Message.request('asset-db','save-asset',url,data.prefabData||data);root.destroy();return 'HUD 六处图片、独立文字和进度填充已保存';
    }
}