// @ts-nocheck
import * as cc from 'cc';
const EDITOR = typeof Editor !== 'undefined';
const base = 'db://assets/app-bundle/app-view/';

/** 加载仅编辑器使用的制作工具。 */

/** 卸载制作工具。 */


/** 创建编辑器节点；此文件不进入游戏构建。 */
function node(name, parent, width = 750, height = 1334, x = 0, y = 0) {
    const result = new cc.Node(name);
    result.layer = cc.Layers.Enum.UI_2D;
    result.addComponent(cc.UITransform).setContentSize(width, height);
    if (parent) result.parent = parent;
    result.setPosition(x, y);
    return result;
}

/** 通过资产数据库查询实际 UUID，加载已导入的资源。 */
async function asset(url, spriteFrame = false) {
    const info = await Editor.Message.request('asset-db', 'query-asset-info', url);
    if (!info) throw new Error('资源不存在：' + url);
    let uuid = info.uuid;
    if (spriteFrame) {
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
        const sub = Object.values(meta.subMetas).find(value => value.importer === 'sprite-frame');
        if (!sub) throw new Error('图片尚无 SpriteFrame：' + url);
        uuid = sub.uuid;
    }
    return new Promise((resolve, reject) => cc.assetManager.loadAny(uuid, (error, value) => error ? reject(error) : resolve(value)));
}

/** 在预制体内放置原项目图片。 */
async function sprite(name, parent, url, width, height, x = 0, y = 0) {
    const result = node(name, parent, width, height, x, y);
    const component = result.addComponent(cc.Sprite);
    component.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    component.spriteFrame = await asset(url, true);
    result.getComponent(cc.UITransform).setContentSize(width, height);
    return result;
}

/** 在编辑器中制作标签并返回组件供业务脚本绑定。 */
function label(name, parent, text, size, y, width = 650) {
    const result = node(name, parent, width, size * 2, 0, y);
    const component = result.addComponent(cc.Label);
    component.string = text;
    component.fontSize = size;
    component.lineHeight = size + 8;
    component.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    component.verticalAlign = cc.Label.VerticalAlign.CENTER;
    component.color = new cc.Color(37, 61, 85, 255);
    return component;
}

/** 把按钮事件序列化到预制体，运行时不搜索节点。 */
async function button(name, parent, frame, text, y, target, componentName, handler) {
    const result = await sprite(name, parent, frame, 320, 104, 0, y);
    // 原按钮图片已含文字，不再叠加标签。
    const component = result.addComponent(cc.Button);
    component.transition = cc.Button.Transition.SCALE;
    component.zoomScale = 0.94;
    const event = new cc.EventHandler();
    event.target = target;
    event.component = componentName;
    event.handler = handler;
    component.clickEvents = [event];
    return result;
}

/** 使用 Creator 自带序列化器保存预制体，不手写资产结构。 */
async function save(root, url) {
    const serialized = cce.Prefab.generatePrefabDataFromNode(root);
    const content = serialized.prefabData || serialized;
    const existing = await Editor.Message.request('asset-db', 'query-asset-info', url);
    const result = await Editor.Message.request('asset-db', existing ? 'save-asset' : 'create-asset', url, content);
    root.destroy();
    return result;
}

/** 制作与地形美术对应的静态矩形碰撞体。 */
function wall(name, parent, x, y, width, height, angle = 0) {
    const result = node(name, parent, width, height, x, y);
    result.angle = angle;
    const body = result.addComponent(cc.RigidBody2D);
    body.type = cc.ERigidBody2DType.Static;
    const collider = result.addComponent(cc.BoxCollider2D);
    collider.size = new cc.Size(width, height);
    collider.friction = 0.12;
    collider.restitution = 0;
}

const methods = {
    /** 使用框架模板设置内置逻辑包，保持与 XForge 创建器一致。 */
    async configureBuiltin() {
        const results = [];
        for (const name of ['app-model', 'app-controller']) {
            const url = 'db://assets/app-builtin/' + name;
            const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
            meta.userData = { isBundle: true, bundleConfigID: 'auto_398Ij6Mc1B2Y7sW3e6BgFC', priority: 1 };
            await Editor.Message.request('asset-db', 'save-asset-meta', url, JSON.stringify(meta));
            results.push(url);
        }
        return results;
    },
    /** 验证编辑器能访问本工具和所有业务组件。 */
    inspect() {
        return ['FruitItem', 'FruitVisual', 'FruitSpawner', 'GameBoard', 'GameHud', 'PageGame', 'PageHome', 'PopResult']
            .map(name => ({ name, found: !!cc.js.getClassByName(name) }));
    },

    /** 按 XForge 自带模板设置页面原生包和资源包。 */
    async configureBundles() {

        const results = [];
        for (const [folder, bundle] of [['page/game', 'page-game'], ['page/home', 'page-home'], ['pop/result', 'pop-result']]) {
            for (const kind of ['native', 'resources']) {
                const url = base + folder + '/' + kind;
                const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
                const template = kind === 'native'
                    ? {
    "isBundle": true,
    "bundleConfigID": "auto_f7NI9WxFVIO6e8LbJGF72k",
    "priority": 1
}
                    : {
    "isBundle": true,
    "bundleConfigID": "auto_11aBEBWDxI/6ryvKvFthEo",
    "priority": 4
};
                meta.userData = { ...template, bundleName: bundle + (kind === 'resources' ? '-res' : '') };
                await Editor.Message.request('asset-db', 'save-asset-meta', url, JSON.stringify(meta));
                results.push({url,bundle:meta.userData.bundleName});
            }
        }
        return results;
    },

    /** 制作水果单体预制体，绑定物理、图片与输入组件。 */
    async createFruit() {
        const root = node('FruitItem', null, 84, 84);
        const body = root.addComponent(cc.RigidBody2D);
        body.type = cc.ERigidBody2DType.Static;
        body.enabledContactListener = true;
        body.linearDamping = 0.15;
        body.angularDamping = 0.2;
        const collider = root.addComponent(cc.CircleCollider2D);
        collider.radius = 36;
        collider.friction = 0.1;
        collider.restitution = 0.08;
        const visualNode = await sprite('Visual', root, base + 'page/game/resources/textures/fruit-21.png', 84, 84);
        const visual = visualNode.addComponent('FruitVisual');
        visual.sprite = visualNode.getComponent(cc.Sprite);
        const item = root.addComponent('FruitItem');
        item.body = body;
        item.collider = collider;
        item.visual = visual;
        return save(root, base + 'page/game/resources/prefabs/FruitItem.prefab');
    },

    /** 制作棋盘预制体，地形与水果容器都保存在资产中。 */
    async createBoard() {
        const root = node('GameBoard');
        await sprite('Background', root, base + 'page/game/resources/textures/background.png', 750, 1667);
        // 原地形高 763；顶部 y=-20，地槽底部约 y=-550。
        await sprite('Terrain', root, base + 'page/game/resources/textures/terrain.png', 750, 763, 0, -401.5);
        const obstacles = node('Obstacles', root);
        wall('LeftSlope', obstacles, -223, -111, 370, 20, -31);
        wall('RightSlope', obstacles, 223, -111, 370, 20, 31);
        wall('LeftChute', obstacles, -51, -380, 20, 310);
        wall('RightChute', obstacles, 51, -380, 20, 310);
        wall('Floor', obstacles, 0, -550, 122, 20);
        wall('LeftEdge', obstacles, -395, 220, 30, 1200);
        wall('RightEdge', obstacles, 395, 220, 30, 1200);
        const fruitRoot = node('Fruits', root);
        const spawner = root.addComponent('FruitSpawner');
        spawner.fruitRoot = fruitRoot;
        spawner.fruitPrefab = await asset(base + 'page/game/resources/prefabs/FruitItem.prefab');
        spawner.frames = [];
        for (const kind of [21, 22, 6, 17]) {
            spawner.frames.push(await asset(base + 'page/game/resources/textures/fruit-' + kind + '.png', true));
        }
        root.addComponent('GameBoard').spawner = spawner;
        return save(root, base + 'page/game/resources/prefabs/GameBoard.prefab');
    },

    /** 制作 HUD 独立预制体及其标签绑定。 */
    async createHud() {
        const root = node('GameHud');
        label('LevelTitle', root, '第 1 关', 36, 595);
        const status = label('Progress', root, '剩余 12 个 · 进度 0%', 28, 545);
        label('Hint', root, '点击同类水果，让它们落到底部相遇', 23, -610);
        root.addComponent('GameHud').status = status;
        return save(root, base + 'page/game/resources/prefabs/GameHud.prefab');
    },

    /** 制作页面根预制体，子预制体由 XForge 资源加载器实例化。 */
    async createGamePage() {
        const root = node('PageGame');
        const component = root.addComponent('PageGame');
        if (component.resetInEditor) component.resetInEditor();
        component.boardRoot = node('BoardRoot', root);
        component.hudRoot = node('HudRoot', root);
        return save(root, base + 'page/game/native/PageGame.prefab');
    },

    /** 制作首页完整节点树，并将开始按钮绑定到页面方法。 */
    async createHome() {
        const root = node('PageHome');
        const component = root.addComponent('PageHome');
        if (component.resetInEditor) component.resetInEditor();
        await sprite('Background', root, base + 'page/home/resources/textures/background.png', 750, 1667);
        label('Title', root, '缤纷消水果', 60, 340);
        await sprite('Mango', root, base + 'page/home/resources/textures/mango.png', 220, 220, 0, 100);
        label('Subtitle', root, '轻点下落 · 同类成对消除', 28, -90);
        await button('StartButton', root, base + 'page/home/resources/textures/start-button.png', '开始游戏', -260, root, 'PageHome', 'startGame');
        return save(root, base + 'page/home/native/PageHome.prefab');
    },

    /** 制作结算弹窗的标签和两枚独立按钮。 */
    async createResult() {
        const root = node('PopResult', null, 620, 740);
        const component = root.addComponent('PopResult');
        if (component.resetInEditor) component.resetInEditor();
        await sprite('Panel', root, base + 'pop/result/resources/textures/panel.png', 620, 740);
        component.titleLabel = label('Title', root, '全部消除！', 44, 310, 560);
        await button('RestartButton', root, base + 'pop/result/resources/textures/restart-button.png', '再玩一次', 10, root, 'PopResult', 'restart');
        await button('HomeButton', root, base + 'pop/result/resources/textures/home-button.png', '返回首页', -150, root, 'PopResult', 'home');
        return save(root, base + 'pop/result/native/PopResult.prefab');
    },

    /** 通知 XForge 按资产重新生成注册表。 */
    async refreshRegistry() {
        await Editor.Message.request('app', 'refresh-executor');
        return 'registered';
    },
};

/** 临时编辑器制作组件，用完删除，不挂载到任何交付资产。 */
@cc._decorator.ccclass('PrefabAuthoring')
export class PrefabAuthoring extends cc.Component {
    /** 从 MCP 执行限定的制作步骤；禁止在游戏运行时调用。 */
    async author(step) {
        if (!EDITOR) throw new Error('仅允许编辑器制作');
        if (!Object.prototype.hasOwnProperty.call(methods, step)) throw new Error('未知制作步骤');
        return methods[step]();
    }
}
