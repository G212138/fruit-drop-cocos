import { assetManager, isValid, SpriteFrame } from 'cc';
import { app } from '../../../../../../../app/app';
/** 按需加载地块，调用方持有期间加引用，退出或切换时释放。 */
export class TerrainArt {
    /** @param file 地块文件名。 @param done 加载完成回调；返回图片已加引用，接收者必须释放。 */
    static load(file: string, done: (frame: SpriteFrame | null) => void): void {
        const path = 'terrains/' + file + '/spriteFrame';
        // 启动页已加载的图片同步交付，避免框架缓存回调延后一帧显示默认草坡。
        const cached = assetManager.getBundle('shared-terrains')?.get(path, SpriteFrame);
        if (cached && isValid(cached)) {
            cached.addRef();
            done(cached);
            return;
        }
        app.manager.loader.load({
            bundle: 'shared-terrains', path, type: SpriteFrame,
            onComplete: (frame: SpriteFrame) => {
                if (frame) frame.addRef();
                done(frame || null);
            },
        });
    }
}
