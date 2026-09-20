import { SpriteFrame } from 'cc';
import { app } from '../../../../../../../app/app';
/** 按需加载地块，调用方持有期间加引用，退出或切换时释放。 */
export class TerrainArt {
    /** @param file 地块文件名。 @param done 加载完成回调；返回图片已加引用，接收者必须释放。 */
    static load(file: string, done: (frame: SpriteFrame | null) => void): void {
        app.manager.loader.load({
            bundle: 'shared-terrains', path: 'terrains/' + file + '/spriteFrame', type: SpriteFrame,
            onComplete: (frame: SpriteFrame) => {
                if (frame) frame.addRef();
                done(frame || null);
            },
        });
    }
}
