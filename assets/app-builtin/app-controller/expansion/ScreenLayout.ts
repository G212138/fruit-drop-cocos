import { Node, UITransform, Vec3, sys, view } from 'cc';

/** 页面内容等比适配；仅调整预制体已有节点，不创建UI或修改物理关卡坐标。 */
export class ScreenLayout {
    /** 原始子节点变换，防止窗口变化时累计缩放。 */
    private readonly originals = new Map<Node, { position: Vec3; scale: Vec3 }>();
    /** 上次适配尺寸签名，尺寸未变化时不重复写入节点。 */
    private signature = '';

    /**
     * 在页面布局完成后更新；新增异步挂载点也会触发重算。
     * @param root 页面根节点，保持框架Widget负责全屏尺寸。
     * @param bottom 内容最低边界，单位设计像素；游戏包含袋子和底部操作区。
     * @param top 内容最高边界，单位设计像素。
     */
    apply(root: Node, bottom = -667, top = 667): void {
        const visible = view.getVisibleSize();
        const safe = sys.getSafeAreaRect(false);
        const size = root.getComponent(UITransform)!;
        const signature = [visible.width, visible.height, safe.x, safe.y, safe.width, safe.height,
            size.width, size.height, root.children.length, bottom, top].join(',');
        if (signature === this.signature) return;
        this.signature = signature;
        // 四周24设计像素为适配留白；设计宽度750沿用原项目，禁止横纵不同倍率拉伸玩法。
        const padding = 24;
        const scale = Math.min(Math.max(1, safe.width - padding * 2) / 750,
            Math.max(1, safe.height - padding * 2) / (top - bottom));
        const centerX = safe.x + safe.width / 2 - visible.width / 2;
        const centerY = safe.y + safe.height / 2 - visible.height / 2 - (top + bottom) / 2 * scale;
        for (const child of [...root.children]) {
            if (!this.originals.has(child)) this.originals.set(child,
                { position: child.position.clone(), scale: child.scale.clone() });
            const original = this.originals.get(child)!;
            if (child.name === 'Background') {
                // 背景固定在内容后方；使用快照遍历，避免调整已有节点顺序时跳过其他挂载点。
                child.setSiblingIndex(0);
                const background = child.getComponent(UITransform)!;
                const cover = Math.max(visible.width / background.width, visible.height / background.height);
                child.setScale(cover, cover, original.scale.z);
                child.setPosition(0, 0, original.position.z);
                continue;
            }
            child.setScale(original.scale.x * scale, original.scale.y * scale, original.scale.z);
            child.setPosition(original.position.x * scale + centerX,
                original.position.y * scale + centerY, original.position.z);
        }
        for (const child of this.originals.keys()) {
            if (child.parent !== root) this.originals.delete(child);
        }
    }
}
