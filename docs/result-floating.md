# 无底框结算界面

采用确认的悬浮方案：金色文字标题、独立主视觉、金色主按钮、等大的首页/分享次按钮。没有面板底框或标题底板。成功有新解锁时仅显示本关原物品；没有解锁时使用非食物成功徽章。复活使用爱心和实际剩余个数，关闭后进入重试图标的最终失败页。

成功按钮“分享喜悦”，失败“求助好友”。分享只打开好友选择，不推进关卡、不发奖励、不复活。不支持的宿主使用框架Toast。能力判断、失败和重复回调有测试。依据：[TikTok Mini Games Sharing](https://developers.tiktok.com/docs/en/mini-games-sdk-sharing)。真机好友界面尚未验证。

## 实现

PopResult为独立预制体，通过Creator编辑器API移除PageGame/GameResult旧结算树。棋盘就绪后下一帧通过框架load加载，结算时show，隐藏采用缓存模式2。退出或重开取消待显示请求；beforeShow验证所属局代次，阻止迟到结果弹出。ResultOverlay负责八语种文字和解锁主视觉切换，ResultStrings存储文本，ResultShare隔离宿主接口。PageGame传入实际remaining。广告取消或错误走框架Toast。保留两步复活、0.7秒后出现下一关、试玩返回、声音开关及关闭清理。

## 素材与提示词

采用内置imagegen，未使用CLI。六个提示分别生成：金色对勾月桂绶带徽章、蓝色立体重试徽章、红色立体爱心、蓝色弯曲分享箭头、空白金色按钮、空白奶油按钮。共同要求为正视、透明背景、抗锯齿边缘、克制高光、无文字和食物装饰。裁去透明空白并缩放至正常尺寸；按钮通过编辑器配置九宫格。

最终文件位于 assets/app-bundle/app-view/pop/result/resources/textures/：result-success.png、result-retry.png、result-heart.png、result-share.png、result-button-gold.png、result-button-cream.png。物品、广告、首页/下一关、关闭和光效复用原资源。没有新物品缩略图或手工图集。标题和按钮使用真实Label以支持多语言。

## 验证与边界

浏览器预览了有解锁成功、无解锁成功、复活提示及最终失败，确认关闭首层进入第二层。临时预览探针仅展示界面、不写存档、不发奖励，验证后删除。

测试：test-result-view.cjs、test-revive-page.cjs、test-result-overlay.cjs，以及预制体引用检查。结算相关TypeScript无诊断；项目仍有原有118条诊断。本次没有正式构建或真机分享验证。

独立接入验证：游戏页已无GameResult和resultRoot引用；延迟加载、旧代次回调、退出取消显示的回归测试通过。浏览器从首页进入第31关正常，未捕获控制台错误。本次拆分后未在真机重新走完整通关流程；PageGame原有settings字段类型诊断仍保留。

