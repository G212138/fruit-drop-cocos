// @ts-nocheck
import * as cc from 'cc';
/** 仅用于 Creator 编辑器制作，完成后从 assets 移除。 */
const base = 'db://assets/app-bundle/app-view/';
/** @param url 现有资源地址。 @param frame 是否读取图片的 SpriteFrame 子资源。 */
async function loadAsset(url, frame = false) {
    const info = await Editor.Message.request('asset-db', 'query-asset-info', url);
    if (!info) throw new Error('资源不存在：' + url);
    let uuid = info.uuid;
    if (frame) {
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
        uuid = Object.values(meta.subMetas).find(item => item.importer === 'sprite-frame').uuid;
    }
    return new Promise((resolve, reject) => cc.assetManager.loadAny(uuid, (error, value) => error ? reject(error) : resolve(value)));
}
/** @param root 待保存的编辑器实例。 @param url 原预制体地址，保留其 UUID。 */
async function saveAsset(root, url) {
    const data = cce.Prefab.generatePrefabDataFromNode(root);
    await Editor.Message.request('asset-db', 'save-asset', url, data.prefabData || data);
    root.destroy();
}
/** @param name 节点名。 @param parent 编辑器父节点。 @param w 宽度像素。 @param h 高度像素。 @param y 局部纵坐标。 */
function makeNode(name, parent, w, h, y = 0) {
    const node = new cc.Node(name); node.layer = cc.Layers.Enum.UI_2D;
    node.addComponent(cc.UITransform).setContentSize(w, h); node.parent = parent; node.setPosition(0, y);
    return node;
}
/** @param node 已有节点。 @param key 译文键。 @param size 字号。 @param width 标签宽度。 */
function caption(node, key, size = 32, width = 240) {
    const picture = node.getComponent(cc.Sprite);
    if (picture) {
        picture.enabled = false;
        node = node.getChildByName('Translation') || makeNode('Translation', node, width, size * 1.9);
    }
    const label = node.getComponent(cc.Label) || node.addComponent(cc.Label);
    label.useSystemFont = true; label.fontFamily = 'sans-serif'; label.fontSize = size; label.lineHeight = Math.ceil(size * 1.4);
    label.overflow = cc.Label.Overflow.SHRINK; label.enableWrapText = false;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER; label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    label.color = new cc.Color(120, 74, 42); node.getComponent(cc.UITransform).setContentSize(width, size * 1.9);
    if (key) { const translated = node.getComponent('LocalizedLabel') || node.addComponent('LocalizedLabel'); translated.key = key; label.string = key; }
    return label;
}
/** @param node 按钮节点。 @param target 目标组件节点。 @param component 组件类名。 @param handler 方法名。 @param data 语言代码。 */
function bind(node, target, component, handler, data = '') {
    const button = node.getComponent(cc.Button) || node.addComponent(cc.Button);
    const event = new cc.EventHandler(); event.target = target; event.component = component; event.handler = handler; event.customEventData = data;
    button.clickEvents = [event]; button.transition = cc.Button.Transition.NONE;
}
/** @param node 图片节点。 @param frame 无文字按钮底图。 */
function background(node, frame) {
    const sprite = node.getComponent(cc.Sprite) || node.addComponent(cc.Sprite);
    sprite.enabled = true; sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; sprite.spriteFrame = frame;
    return sprite;
}
/** 通过 MCP 调用的有限编辑器制作入口。 */
@cc._decorator.ccclass('LocalizationAuthoring')
export class LocalizationAuthoring extends cc.Component {
    /** 迁移主要页面中的纯文字图片和按钮标题，保留按钮事件及原节点位置。 */
    async mainLabels() {
        const blank = await loadAsset(base + 'page/game/resources/textures/settings/blank-button.png', true);
        for (const relative of ['page/game/native/PageGame.prefab', 'page/home/native/PageHome.prefab']) {
            const url = base + relative; const root = cc.instantiate(await loadAsset(url));
            cce.Prefab.removePrefabInfoFromNode(root, true);
            const walk = (node) => {
                const name = node.name;
                if (name === 'RemainingCaption') caption(node, 'remaining', 30, 120);
                if (name === 'UnlockText') caption(node, 'unlocked', 28, 250);
                if (name === 'Heading' && node.parent.name === 'Content' && node.parent.parent.name === 'ThemePanel') caption(node, 'themes', 40, 500);
                const buttons = {NextButton:'next',TrialRestart:'restart',TrialReturn:'editor',RestartButton:'restart',ReviveButton:'revive',HomeButton:'home'};
                const resultPart = !!node.getComponent(cc.Button) && buttons[name];
                const themePart = node.parent?.parent?.name === 'ThemePanel' && (name.startsWith('Tab') || name === 'CloseButton');
                if (resultPart || themePart) {
                    const key = resultPart || (name === 'CloseButton' ? 'close' : Number(name.slice(3)) < 2 ? 'fruits' : 'sweets');
                    const width = node.getComponent(cc.UITransform).width * 0.86;
                    if (node.getComponent(cc.Label)) caption(node, key, 30, width);
                    else {
                        background(node, blank);
                        caption(makeNode('LocalizedCaption', node, width, 70), key, 30, width);
                    }
                }
                for (const child of [...node.children]) walk(child);
            };
            walk(root); await saveAsset(root, url);
        }
        return '主要关卡与主题按钮译文已接入';
    }
    /** 批量迁移设置与首页文本，并创建预制体语言选项；运行时不会调用。 */
    async author() {
        if (typeof Editor === 'undefined') throw new Error('仅允许编辑器执行');
        const blank = await loadAsset(base + 'page/game/resources/textures/settings/blank-button.png', true);
        const panelFrame = await loadAsset(base + 'page/game/resources/textures/settings/panel.png', true);
        for (const relative of ['page/game/resources/prefabs/SettingsPanel.prefab', 'page/home/native/PageHome.prefab']) {
            const url = base + relative;
            const root = cc.instantiate(await loadAsset(url));
            cce.Prefab.removePrefabInfoFromNode(root, true);
            const panel = root.name === 'SettingsPanel' ? root : root.getChildByName('SettingsPanel');
            const view = panel.getComponent('SettingsPanel'); const content = view.content;
            content.getChildByName('Background').getComponent(cc.UITransform).setContentSize(627, 710);
            const title = content.getChildByName('Title'); title.setPosition(0, 305); caption(title, 'settings', 44, 400);
            for (const [field, key, y] of [['musicRow','music',165],['soundRow','sound',55],['vibrateRow','vibrate',-55]]) {
                const row = view[field]; row.parent.setPosition(-14, y); cce.Prefab.removePrefabInfoFromNode(row, true);
                caption(row.getChildByName('Text'), key, 31, 210);
                const toggle = row.getComponent('SettingsToggleView'); toggle.onFrame = blank; toggle.offFrame = blank;
                background(toggle.switchPicture.node, blank);
                const text = makeNode('StateLabel', toggle.switchPicture.node, 160, 65);
                toggle.stateLabel = caption(text, '', 25, 160); toggle.stateLabel.string = 'ON';
            }
            for (const [name,key] of [['Home','home'],['Restart','restart'],['Continue','continue']]) {
                const button = content.getChildByName(name); background(button, blank);
                caption(makeNode('LocalizedCaption', button, 290, 75), key, 32, 285);
            }
            const languageRow = makeNode('LanguageRow', content, 550, 120, -200);
            caption(makeNode('LanguageTitle', languageRow, 500, 50, 35), 'language', 27, 500);
            const chooseButton = makeNode('ChooseLanguage', languageRow, 520, 66, -25); background(chooseButton, blank);
            const picker = languageRow.addComponent('LanguagePicker');
            picker.currentLabel = caption(makeNode('CurrentLanguage', chooseButton, 480, 60), '', 26, 475);
            bind(chooseButton, languageRow, 'LanguagePicker', 'toggle');
            picker.warningLabel = caption(makeNode('LanguageWarning', languageRow, 540, 55, -90), '', 18, 540);
            const options = makeNode('LanguageOptions', panel, 660, 900); picker.optionsRoot = options;
            background(options, panelFrame); options.addComponent(cc.BlockInputEvents);
            caption(makeNode('OptionsTitle', options, 550, 70, 410), 'language', 38, 550);
            const choices = [['system',''],['en','English'],['ja','日本語'],['id','Bahasa Indonesia'],['th','ไทย'],['vi','Tiếng Việt'],['ms','Bahasa Melayu'],['fil','Filipino'],['zh','简体中文']];
            choices.forEach(([code,name], i) => {
                const option = makeNode('Language_' + code, options, 500, 66, 310 - i * 77); background(option, blank);
                const label = caption(makeNode('Caption', option, 460, 60), code === 'system' ? 'system' : '', 28, 460);
                if (name) label.string = name; bind(option, languageRow, 'LanguagePicker', 'choose', code);
            });
            options.active = false;
            view.warningLabel.node.setPosition(0, -330);
            await saveAsset(root, url);
        }
        return '设置与首页语言选择已制作';
    }
}
