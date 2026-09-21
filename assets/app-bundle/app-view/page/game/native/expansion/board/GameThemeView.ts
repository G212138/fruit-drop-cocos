import { _decorator, Component, Sprite, SpriteFrame, Node, UITransform, isValid } from 'cc';
import { GameTheme } from '../../../../../../../app-builtin/app-model/expansion/GameTheme';
const { ccclass, property } = _decorator;

/** 页面内背景和地形主题；嵌套预制体自行绑定主题，避免跨预制体组件引用失效。 */
@ccclass('GameThemeView')
export class GameThemeView extends Component {
    /** 按背景、地形顺序绑定页面内图片。 */
    @property([Sprite]) targets: Sprite[] = [];
    /** 前五张为水果，后五张为甜品，沿用原版主题资源。 */
    @property([SpriteFrame]) frames: SpriteFrame[] = [];
    /** 与地块图片保持同一裁切高度的两侧补边。 */
    @property([Node]) terrainEdges: Node[] = [];
    /** 页面入场及复用时刷新主题。 */
    onEnable(): void {
        GameTheme.refresh();
        this.targets.forEach((sprite, index) => {
            // 编辑器删除节点后可能保留组件引用，跳过已销毁目标。
            if (!isValid(sprite, true) || !isValid(sprite.node, true)) return;
            const frame = this.frames[index];
            if (frame) sprite.spriteFrame = frame;
        });
        const terrain = this.targets[1]?.node;
        if (isValid(terrain, true) && terrain.name === 'TerrainVisual') {
            const grass = true;
            // 草地图裁去底部110源像素，按853源高对应830设计高度换算，顶部与物理位置不动。
            const height = grass ? 830 * 743 / 853 : 830;
            const shift = (830 - height) / 2;
            terrain.getComponent(UITransform)!.setContentSize(750, height);
            terrain.setPosition(0, shift, 0);
            for (const edge of this.terrainEdges) {
                if (!isValid(edge, true)) continue;
                edge.active = true;
                const image = edge.children[0];
                if (!isValid(image, true)) continue;
                image.getComponent(UITransform)?.setContentSize(750, height);
                image.setPosition(image.position.x, shift, 0);
            }
        }
    }
}
