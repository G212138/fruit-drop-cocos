import { _decorator, Label } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from '../../../../../app/app';
const { ccclass, property } = _decorator;

/** 结算仅展示结果，广告与奖励逻辑不能放入此组件。 */
@ccclass('PopResult')
export class PopResult extends BaseView {
    @property(Label)
    titleLabel: Label = null!;

    /** 根据页面传入的结算结果显示标题。 */
    onShow(data: { won: boolean }): void {
        this.titleLabel.string = data.won ? '全部消除！' : '底部水果堆满了';
    }

    /** 免费重开验证关，不触发模拟广告。 */
    restart(): void {
        this.hide();
        app.manager.ui.show({ name: 'PageGame' });
    }

    /** 返回首页。 */
    home(): void {
        this.hide();
        app.manager.ui.show({ name: 'PageHome' });
    }
}
