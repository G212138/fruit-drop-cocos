// @ts-nocheck
import * as cc from 'cc';

/** 仅在 Creator 编辑器中执行的首页、设置和结算制作脚本。 */
const base = 'db://assets/app-bundle/app-view/';
const settingsTextures = base + 'page/game/resources/textures/settings/';
const settingsRedesign = settingsTextures + 'redesign/';

/** 读取项目资源，图片可选择读取其 SpriteFrame 子资源。 */
async function loadAsset(url: string, frame = false): Promise<any> {
    const info = await Editor.Message.request('asset-db', 'query-asset-info', url);
    if (!info) throw new Error('资源不存在：' + url);
    let uuid = info.uuid;
    if (frame) {
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
        uuid = Object.values(meta.subMetas).find((item: any) => item.importer === 'sprite-frame').uuid;
    }
    return new Promise((resolve, reject) => cc.assetManager.loadAny(uuid,
        (error: Error, value: any) => error ? reject(error) : resolve(value)));
}

/** 使用 Creator 序列化器保存预制体，保留资源 UUID。 */
async function saveAsset(root: cc.Node, url: string): Promise<void> {
    const data = cce.Prefab.generatePrefabDataFromNode(root);
    await Editor.Message.request('asset-db', 'save-asset', url, data.prefabData || data);
    root.destroy();
}

/** 创建 UI 节点并设置编辑器中的尺寸和位置。 */
function makeNode(name: string, parent: cc.Node | null, width: number, height: number, x = 0, y = 0): cc.Node {
    const node = new cc.Node(name);
    node.layer = cc.Layers.Enum.UI_2D;
    node.addComponent(cc.UITransform).setContentSize(width, height);
    if (parent) node.parent = parent;
    node.setPosition(x, y, 0);
    return node;
}

/** 创建透明图片节点，显示尺寸独立于源图像尺寸。 */
async function makeSprite(name: string, parent: cc.Node, url: string,
    width: number, height: number, x = 0, y = 0): Promise<cc.Node> {
    const node = makeNode(name, parent, width, height, x, y);
    const sprite = node.addComponent(cc.Sprite);
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = await loadAsset(url, true);
    return node;
}

/** 创建可缩小的系统字体标签，可选绑定多语言键。 */
function makeLabel(name: string, parent: cc.Node, text: string, fontSize: number,
    width: number, height: number, x = 0, y = 0, key = '', color = new cc.Color(94, 52, 30, 255)): cc.Label {
    const node = makeNode(name, parent, width, height, x, y);
    const label = node.addComponent(cc.Label);
    label.useSystemFont = true;
    label.fontFamily = 'sans-serif';
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.ceil(fontSize * 1.2);
    label.isBold = true;
    label.color = color;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    label.overflow = cc.Label.Overflow.SHRINK;
    label.enableWrapText = false;
    if (key) {
        const localized = node.addComponent('LocalizedLabel');
        localized.key = key;
    }
    return label;
}

/** 给节点绑定按钮缩放反馈及业务回调。 */
function bindButton(node: cc.Node, target: cc.Node, component: string, handler: string, data = ''): cc.Button {
    const button = node.getComponent(cc.Button) || node.addComponent(cc.Button);
    button.transition = cc.Button.Transition.SCALE;
    button.zoomScale = 0.94;
    const event = new cc.EventHandler();
    event.target = target;
    event.component = component;
    event.handler = handler;
    event.customEventData = data;
    button.clickEvents = [event];
    return button;
}

/** 创建带独立多语言文字的图片按钮。 */
async function makeButton(name: string, parent: cc.Node, frame: string, text: string, key: string,
    width: number, height: number, x: number, y: number, target: cc.Node, component: string, handler: string): Promise<cc.Node> {
    const node = await makeSprite(name, parent, frame, width, height, x, y);
    bindButton(node, target, component, handler);
    const label = makeLabel('Caption', node, text, Math.min(40, Math.floor(height * 0.34)), width * 0.76, height * 0.5, 0, 0,
        key, cc.Color.WHITE);
    const outline = label.node.addComponent(cc.LabelOutline);
    outline.color = new cc.Color(35, 75, 45, 230);
    outline.width = 2;
    return node;
}

/** 深度查找指定名字的节点。 */
function find(root: cc.Node, name: string): cc.Node | null {
    if (root.name === name) return root;
    for (const child of root.children) {
        const result = find(child, name);
        if (result) return result;
    }
    return null;
}

/** 删除父节点现有子节点，保留传入的业务节点。 */
function clearChildren(parent: cc.Node, keep: cc.Node[] = []): void {
    for (const child of [...parent.children]) {
        if (keep.indexOf(child) >= 0) continue;
        child.removeFromParent();
        child.destroy();
    }
}

/** 按效果图重建一个设置开关：主页为横条，游戏内为竖向小卡片。 */
async function rebuildToggleRow(row: cc.Node, kind: 'music' | 'sound' | 'vibrate', mode: 'home' | 'game'): Promise<void> {
    const view = row.getComponent('SettingsToggleView');
    clearChildren(row);
    const home = mode === 'home';
    row.getComponent(cc.UITransform).setContentSize(home ? 620 : 192, home ? 118 : 238);
    const card = await makeSprite('Card', row, settingsRedesign + (home ? 'row-card.png' : 'small-card.png'),
        home ? 620 : 192, home ? 118 : 238);
    card.setSiblingIndex(0);
    const titles = { music: 'MUSIC', sound: 'SOUND', vibrate: 'HAPTICS' };
    const keys = { music: 'music', sound: 'sound', vibrate: 'vibrate' };
    await makeSprite('Icon', row, settingsRedesign + kind + (home ? '-home.png' : '-game.png'),
        home ? 82 : 78, home ? 82 : 78, home ? -245 : 0, home ? 0 : 52);
    makeLabel('Caption', row, titles[kind], home ? 31 : 24, home ? 270 : 174, 55,
        home ? -70 : 0, home ? 0 : -12, keys[kind], home ? new cc.Color(28, 45, 82, 255) : new cc.Color(112, 59, 29, 255));
    const switchNode = await makeSprite('Switch', row, settingsRedesign + 'switch-on.png',
        home ? 176 : 132, home ? 78 : 59, home ? 205 : 0, home ? 0 : -78);
    view.switchPicture = switchNode.getComponent(cc.Sprite);
    view.onFrame = await loadAsset(settingsRedesign + 'switch-on.png', true);
    view.offFrame = await loadAsset(settingsRedesign + 'switch-off.png', true);
    view.stateLabel = null;
    bindButton(row, row, 'SettingsToggleView', 'requestToggle');
}

/** 重建一套设置面板外观，首页与游戏内通过 mode 区分功能。 */
async function rebuildSettings(root: cc.Node, mode: 'home' | 'game', owner?: cc.Node): Promise<void> {
    cce.Prefab.removePrefabInfoFromNode(root, true);
    const view = root.getComponent('SettingsPanel');
    const rows = [view.musicRow, view.soundRow, view.vibrateRow];
    for (const row of rows) {
        cce.Prefab.removePrefabInfoFromNode(row, true);
        row.removeFromParent();
    }
    clearChildren(root);
    root.getComponent(cc.UITransform).setContentSize(750, 1625);
    const opacity = root.getComponent(cc.UIOpacity) || root.addComponent(cc.UIOpacity);
    view.opacity = opacity;
    const mask = await makeSprite('Mask', root, base + 'page/game/resources/textures/settings/mask.png', 2000, 2800);
    mask.getComponent(cc.Sprite)!.color = new cc.Color(0, 24, 48, 175);
    mask.addComponent(cc.BlockInputEvents);
    const panelHeight = mode === 'home' ? 720 : 790;
    const content = makeNode('Content', root, 700, panelHeight, 0, mode === 'home' ? 55 : 20);
    content.addComponent(cc.BlockInputEvents);
    await makeSprite('Background', content, settingsRedesign + (mode === 'home' ? 'home-panel.png' : 'pause-panel.png'), 700, panelHeight);
    view.content = content;
    await makeSprite('Title', content, settingsRedesign + (mode === 'home' ? 'settings-title.png' : 'paused-title.png'),
        mode === 'home' ? 620 : 560, mode === 'home' ? 160 : 161, 0, panelHeight / 2 - 5);
    const close = await makeSprite('CloseButton', content, settingsRedesign + 'close-button.png', 104, 104,
        310, panelHeight / 2 - 5);
    bindButton(close, root, 'SettingsPanel', 'continueGame');
    const kinds: Array<'music' | 'sound' | 'vibrate'> = ['music', 'sound', 'vibrate'];
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        row.parent = content;
        row.setPosition(mode === 'home' ? 0 : -210 + index * 210, mode === 'home' ? 210 - index * 135 : 135);
        await rebuildToggleRow(row, kinds[index], mode);
    }
    view.musicRow = rows[0];
    view.soundRow = rows[1];
    view.vibrateRow = rows[2];
    const warning = makeLabel('Warning', content, '', 18, 560, 45, 0, mode === 'home' ? -305 : -355,
        '', new cc.Color(170, 82, 55, 255));
    view.warningLabel = warning;

    if (mode === 'game') {
        const resume = await makeButton('Continue', content, settingsRedesign + 'resume-button.png', 'RESUME', 'continue',
            606, 152, 0, -85, root, 'SettingsPanel', 'continueGame');
        resume.getChildByName('Caption')!.setPosition(45, 0);
        await makeSprite('PlayIcon', resume, settingsRedesign + 'play-icon.png', 78, 70, -205, 2);
        const restart = await makeSprite('Restart', content, settingsRedesign + 'action-card.png', 286, 112, -153, -265);
        bindButton(restart, root, 'SettingsPanel', 'restartGame');
        await makeSprite('Icon', restart, settingsRedesign + 'restart-icon.png', 64, 64, -85, 0);
        makeLabel('Caption', restart, 'RESTART', 27, 175, 55, 38, 0, 'restart', new cc.Color(110, 57, 27, 255));
        const homeButton = await makeSprite('Home', content, settingsRedesign + 'action-card.png', 286, 112, 153, -265);
        bindButton(homeButton, root, 'SettingsPanel', 'returnHome');
        await makeSprite('Icon', homeButton, settingsRedesign + 'home-icon.png', 66, 62, -82, 0);
        makeLabel('Caption', homeButton, 'HOME', 28, 175, 55, 38, 0, 'home', new cc.Color(110, 57, 27, 255));
        return;
    }

    const languageRow = makeNode('LanguageRow', content, 620, 118, 0, -195);
    await makeSprite('Card', languageRow, settingsRedesign + 'row-card.png', 620, 118);
    await makeSprite('GlobeIcon', languageRow, settingsRedesign + 'language-home.png', 82, 82, -245, 0);
    makeLabel('LanguageTitle', languageRow, 'LANGUAGE', 31, 250, 60, -75, 0, 'language', new cc.Color(28, 45, 82, 255));
    const choose = await makeSprite('ChooseLanguage', languageRow, settingsRedesign + 'action-card.png', 245, 76, 175, 0);
    const picker = languageRow.addComponent('LanguagePicker');
    picker.currentLabel = makeLabel('CurrentLanguage', choose, 'English', 24, 175, 52, -18, 0, '', new cc.Color(28, 45, 82, 255));
    await makeSprite('Arrow', choose, settingsRedesign + 'chevron-icon.png', 28, 40, 88, 0);
    bindButton(choose, languageRow, 'LanguagePicker', 'toggle');
    picker.warningLabel = makeLabel('LanguageWarning', languageRow, '', 16, 520, 38, 0, -58,
        '', new cc.Color(170, 82, 55, 255));

    const options = makeNode('LanguageOptions', root, 680, 980, 0, 10);
    options.addComponent(cc.BlockInputEvents);
    await makeSprite('Background', options, settingsRedesign + 'language-panel.png', 680, 980);
    makeLabel('OptionsTitle', options, 'Language', 46, 450, 70, 0, 405, 'language');
    const optionsClose = await makeSprite('CloseButton', options, settingsRedesign + 'close-button.png', 78, 78, 298, 430);
    bindButton(optionsClose, languageRow, 'LanguagePicker', 'toggle');
    const scroll = makeNode('ScrollView', options, 540, 720, 0, -20);
    const scrollView = scroll.addComponent(cc.ScrollView);
    scrollView.horizontal = false;
    scrollView.vertical = true;
    scrollView.inertia = true;
    const viewport = makeNode('View', scroll, 540, 720);
    viewport.addComponent(cc.Mask);
    const contentList = makeNode('Content', viewport, 520, 1, 0, 350);
    contentList.getComponent(cc.UITransform).setAnchorPoint(0.5, 1);
    const layout = contentList.addComponent(cc.Layout);
    layout.type = cc.Layout.Type.VERTICAL;
    layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
    layout.spacingY = 10;
    layout.paddingTop = 8;
    layout.paddingBottom = 8;
    scrollView.content = contentList;
    const choices = [['system','System default'],['en','English'],['ja','日本語'],['id','Bahasa Indonesia'],['th','ไทย'],
        ['vi','Tiếng Việt'],['ms','Bahasa Melayu'],['fil','Filipino'],['zh','简体中文']];
    for (const [code, name] of choices) {
        const option = makeNode('Language_' + code, contentList, 510, 76);
        const selected = await makeSprite('SelectedBackground', option, base + 'page/game/resources/textures/settings/blank-button.png', 500, 72);
        selected.active = false;
        makeLabel('Caption', option, name, 27, 410, 58, -25, 0, code === 'system' ? 'system' : '');
        const check = makeLabel('Checkmark', option, '✓', 34, 55, 55, 205, 0, '', cc.Color.WHITE).node;
        check.active = false;
        bindButton(option, languageRow, 'LanguagePicker', 'choose', code);
    }
    picker.optionsRoot = options;
    options.active = false;
}

/** 重建首页内容，保留主题面板、平台入口和设置业务节点。 */
async function rebuildHome(): Promise<void> {
    const url = base + 'page/home/native/PageHome.prefab';
    const root = cc.instantiate(await loadAsset(url));
    cce.Prefab.removePrefabInfoFromNode(root, false);
    const home = root.getComponent('PageHome');
    const theme = home.themePanel.node;
    const settings = home.settingsPanel.node;
    const revisit = root.getChildByName('TikTokRevisitView');
    clearChildren(root, [theme, settings, revisit].filter(Boolean));
    await makeSprite('Background', root, base + 'page/home/resources/redesign/background.png', 750, 1625);
    const title = await makeSprite('Title', root, base + 'page/home/resources/redesign/title.png', 700, 350, 0, 455);
    const visual = makeNode('LogoVisual', title, 700, 350);
    const titleSprite = title.getComponent(cc.Sprite)!;
    const visualSprite = visual.addComponent(cc.Sprite);
    visualSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    visualSprite.spriteFrame = titleSprite.spriteFrame;
    titleSprite.enabled = false;
    visual.addComponent('HomeLogoMotion');
    const fruitUrls = [1,2,3,4].map(index => base + 'page/home/resources/redesign/demo-fruit-' + index + '.png');
    const positions = [[-165,160],[10,200],[165,130],[-10,70]];
    for (let index = 0; index < fruitUrls.length; index++) {
        const fruit = await makeSprite('DemoFruit' + (index + 1), root, fruitUrls[index], 115, 115,
            positions[index][0], positions[index][1]);
        fruit.angle = [-10,7,14,-6][index];
    }
    const play = await makeSprite('StartButton', root, base + 'page/home/resources/redesign/play.png', 570, 190, 0, -185);
    bindButton(play, root, 'PageHome', 'startGame');
    home.playLabel = makeLabel('PlayLabel', play, 'PLAY', 58, 430, 78, 0, 20, 'play', cc.Color.WHITE);
    home.levelLabel = makeLabel('LevelLabel', play, 'Level 1', 30, 400, 48, 0, -42, '', cc.Color.WHITE);
    const setting = await makeSprite('SettingsButton', root, base + 'page/home/resources/redesign/settings.png', 82, 82, -305, 610);
    bindButton(setting, root, 'PageHome', 'openSettings');
    const dock = makeNode('FeatureDock', root, 700, 210, 0, -525);
    const entries = [
        ['Themes','themes.png','THEMES','themes','openTheme'],
        ['Collection','collection.png','COLLECTION','collection','openCollection'],
        ['DailyGift','daily-reward.png','DAILY GIFT','dailyGift','showComingSoon'],
        ['Leaderboard','leaderboard.png','RANK','leaderboard','showComingSoon'],
    ];
    for (let index = 0; index < entries.length; index++) {
        const [name, file, caption, key, handler] = entries[index];
        const item = makeNode(name, dock, 155, 190, -255 + index * 170, 0);
        const icon = await makeSprite('Icon', item, base + 'page/home/resources/redesign/home-icons/' + file, 118, 118, 0, 28);
        bindButton(icon, root, 'PageHome', handler);
        const captionLabel = makeLabel('Caption', item, caption, 21, 150, 45, 0, -58, key, cc.Color.WHITE);
        const captionOutline = captionLabel.node.addComponent(cc.LabelOutline);
        captionOutline.color = new cc.Color(48, 105, 121, 220);
        captionOutline.width = 2;
    }
    home.themesLabel = find(dock, 'Themes')!.getChildByName('Caption')!.getComponent(cc.Label);
    home.featureNotice = makeLabel('FeatureNotice', root, 'Coming soon', 28, 420, 70, 0, -365, 'comingSoon', cc.Color.WHITE);
    home.featureNotice.node.active = false;
    home.editorLabel = makeLabel('EditorButton', root, 'Level Editor', 18, 300, 44, 0, -745, 'editor', cc.Color.WHITE);
    bindButton(home.editorLabel.node, root, 'PageHome', 'openEditor');
    await rebuildSettings(settings, 'home', root);
    if (revisit) revisit.setSiblingIndex(root.children.length - 1);
    theme.setSiblingIndex(root.children.length - 1);
    settings.setSiblingIndex(root.children.length - 1);
    await saveAsset(root, url);
}

/** 重建游戏内暂停设置预制体。 */
async function rebuildGameSettings(): Promise<void> {
    const url = base + 'page/game/resources/prefabs/SettingsPanel.prefab';
    const root = cc.instantiate(await loadAsset(url));
    await rebuildSettings(root, 'game');
    await saveAsset(root, url);
}

/** 创建结算页中的全宽遮罩和统一奶油色卡片。 */
async function makeResultPanel(root: cc.Node, name: string): Promise<{ layer: cc.Node; card: cc.Node }> {
    const layer = makeNode(name, root, 750, 1625);
    const card = makeNode('Card', layer, 660, 1050, 0, 10);
    card.addComponent(cc.BlockInputEvents);
    await makeSprite('Panel', card, base + 'pop/result/resources/original/revive-panel.png', 660, 1050);
    return { layer, card };
}

/** 重建游戏页内嵌结算节点，保留已有结果流程和解锁资源数组。 */
async function rebuildResult(): Promise<void> {
    const url = base + 'page/game/native/PageGame.prefab';
    const page = cc.instantiate(await loadAsset(url));
    cce.Prefab.removePrefabInfoFromNode(page, false);
    const root = find(page, 'GameResult');
    if (!root) throw new Error('未找到 GameResult');
    const result = root.getComponent('PopResult');
    const unlockIcons = [...result.unlockIcons];
    const successAudio = result.successAudio;
    clearChildren(root);
    root.getComponent(cc.UITransform).setContentSize(750, 1625);
    const mask = await makeSprite('Background', root, base + 'page/game/resources/textures/settings/mask.png', 2000, 2800);
    mask.getComponent(cc.Sprite)!.color = new cc.Color(0, 22, 45, 185);
    mask.addComponent(cc.BlockInputEvents);
    const notice = makeLabel('Notice', root, '', 21, 560, 60, 0, -560, '', cc.Color.WHITE);
    result.titleLabel = notice;

    const success = await makeResultPanel(root, 'Success');
    await makeSprite('Title', success.card, base + 'pop/result/resources/redesign/title-level-complete.png', 620, 310, 0, 410);
    await makeSprite('Illustration', success.card, base + 'pop/result/resources/redesign/illustration-success.png', 470, 394, 0, 135);
    makeLabel('Summary', success.card, 'ALL FRUIT CLEARED', 35, 540, 62, 0, -175, 'allFruitCleared', new cc.Color(45, 132, 34, 255));
    await makeSprite('Progress', success.card, base + 'page/game/resources/textures/settings/blank-button.png', 520, 52, 0, -235);
    result.nextButton = await makeButton('NextButton', success.card, base + 'page/game/resources/textures/settings/blank-button.png',
        'NEXT LEVEL', 'next', 530, 150, 0, -340, root, 'PopResult', 'next');
    result.nextButton.addComponent(cc.UIOpacity);
    await makeButton('HomeButton', success.card, base + 'pop/result/resources/redesign/button-blue.png',
        'HOME', 'home', 220, 82, 0, -465, root, 'PopResult', 'home');
    const unlock = makeNode('Unlock', success.card, 500, 125, 0, -75);
    const glow = await makeSprite('Glow', unlock, base + 'pop/result/resources/original/glow.png', 125, 125, -175, 0);
    const unlockIconNode = makeNode('UnlockIcon', unlock, 95, 95, -175, 0);
    result.unlockIcon = unlockIconNode.addComponent(cc.Sprite);
    result.unlockName = makeLabel('UnlockName', unlock, '', 24, 310, 60, 55, 0);
    const legacyUnlockText = makeLabel('UnlockText', unlock, '', 24, 1, 1, 0, 0).node;
    legacyUnlockText.active = false;
    result.unlockRoot = unlock;
    result.unlockGlow = glow;
    result.unlockIcons = unlockIcons;
    result.successRoot = success.layer;
    result.trialButton = await makeButton('TrialRestart', success.card, base + 'pop/result/resources/redesign/button-orange.png',
        'Retry', 'restart', 260, 92, -145, -350, root, 'PopResult', 'restart');
    result.trialReturn = await makeButton('TrialReturn', success.card, base + 'pop/result/resources/redesign/button-blue.png',
        'Level Editor', 'editor', 260, 92, 145, -350, root, 'PopResult', 'home');
    result.trialButton.active = false;
    result.trialReturn.active = false;

    const failure = await makeResultPanel(root, 'Failure');
    await makeSprite('Title', failure.card, base + 'pop/result/resources/redesign/title-level-failed.png', 620, 230, 0, 425);
    await makeSprite('Illustration', failure.card, base + 'pop/result/resources/redesign/illustration-failed.png', 500, 469, 0, 120);
    makeLabel('Summary', failure.card, 'Give it another try!', 34, 540, 64, 0, -145, 'giveAnotherTry');
    await makeButton('RestartButton', failure.card, base + 'page/game/resources/textures/settings/blank-button.png',
        'TRY AGAIN', 'tryAgain', 530, 150, 0, -275, root, 'PopResult', 'restart');
    await makeButton('HomeButton', failure.card, base + 'pop/result/resources/redesign/button-blue.png',
        'HOME', 'home', 330, 100, 0, -410, root, 'PopResult', 'home');
    result.failureRoot = failure.layer;

    const revive = await makeResultPanel(root, 'RevivePrompt');
    await makeSprite('Title', revive.card, base + 'pop/result/resources/redesign/title-one-more-chance.png', 620, 206, 0, 430);
    await makeSprite('Illustration', revive.card, base + 'pop/result/resources/redesign/illustration-revive.png', 345, 518, 0, 105);
    makeLabel('Summary', revive.card, 'Clear the chute and keep playing', 29, 560, 64, 0, -185, 'clearChute');
    const reviveButton = await makeButton('ReviveButton', revive.card, base + 'page/game/resources/textures/settings/blank-button.png',
        'WATCH AD', 'watchAd', 540, 155, 0, -315, root, 'PopResult', 'revive');
    await makeSprite('Video', reviveButton, base + 'pop/result/resources/original/video.png', 54, 40, -190, 10);
    makeLabel('ContinueCaption', reviveButton, 'CONTINUE', 23, 300, 40, 35, -42, 'continue', cc.Color.WHITE);
    const decline = makeLabel('NoThanks', revive.card, 'NO THANKS', 24, 280, 62, 0, -440, 'noThanks');
    bindButton(decline.node, root, 'PopResult', 'dismissRevivePrompt');
    result.revivePrompt = revive.layer;
    result.reviveButton = reviveButton;

    result.winAnimation = null;
    result.failAnimation = null;
    result.successAudio = successAudio;
    success.layer.active = false;
    failure.layer.active = false;
    revive.layer.active = false;
    await saveAsset(page, url);
}

/** MCP 调用入口，依次保存三个预制体。 */
@cc._decorator.ccclass('UiRedesignAuthoring')
export class UiRedesignAuthoring extends cc.Component {
    /** 执行完整界面制作。 */
    async author(): Promise<string> {
        if (typeof Editor === 'undefined') throw new Error('仅允许 Creator 编辑器执行');
        await rebuildGameSettings();
        await rebuildHome();
        await rebuildResult();
        return '首页、首页设置、语言列表、游戏设置和结算界面已重建';
    }
    /** 仅重新保存结算界面，供布局复核后的小范围调整。 */
    async resultOnly(): Promise<string> {
        if (typeof Editor === 'undefined') throw new Error('仅允许 Creator 编辑器执行');
        await rebuildResult();
        return '结算界面已重新保存';
    }
}
