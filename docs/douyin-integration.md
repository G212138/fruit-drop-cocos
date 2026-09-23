# 多平台适配与抖音接入

## 当前状态

抖音 App ID：`ttaf1dd9a03178d36c02`，已写入 DouyinConfig.ts 和 tools/douyin-build.json。
抖音只需五个主动激励广告位：消除、打乱、复活、扩容、主题解锁；已全部配置。
30秒闲置插屏和第二关起50%结算视频仅TikTok启用，其他平台关闭，与是否填写广告位无关。
尚未构建、上传或进行抖音真机验收。

## 代码职责

代码位于 `assets/app-builtin/app-model/expansion/platform`；生命周期和启动入口位于 `assets/app-builtin/app-controller/expansion`。

| 模块 | 职责 |
| --- | --- |
| PlatformContracts | 纯公共接口、能力检查，不引用具体平台 |
| TikTokPlatform / TikTokConfig / TikTokRuntime | TikTok策略、配置与SDK边界 |
| TikTokRewardProvider / TikTokLogin等 | TikTok广告、身份与专属任务 |
| DouyinPlatform / DouyinConfig / DouyinRuntime | 抖音独立策略、配置与SDK边界 |
| DouyinRewardProvider / DouyinSilentLogin | 抖音广告、静默登录，不引用TikTok实现 |
| BrowserPlatform | 浏览器降级，无真实广告或宿主 |
| PlatformRuntime / PlatformRewards | 平台选择与转发，不承载平台业务 |
| TikTokStartup / DouyinStartup | 各自独立启动链 |
| TikTokLifecycle / DouyinLifecycle | 各自维护后台、广告暂停与振动 |
| PlatformStartup / PlatformLifecycle | 启动与生命周期分发 |

游戏页面只调用公共入口、查询能力，不判断平台名称。新增微信时添加独立实现并在选择层注册，自动广告默认关闭。
TikTok优先识别TTMinis.game，避免原生包的tt别名被误识别为抖音。不会创建或覆盖任何SDK全局别名。

## 抖音行为

- 已适配存档、首次启动路由、分享、静默登录、长短震动与前后台恢复。
- 激励视频先load再show，只有isEnded严格为true才向奖励门禁报告完成。
- 空广告位、提前关闭、异常、超时不发奖；自动结算广告在提供器层也被阻断。
- TikTok的桌面/侧栏奖励入口在抖音隐藏，不套用其他平台奖励资格。
- 无后端时保持本地游客体验；临时code或anonymousCode不落盘，不视为OpenID或服务端会话。

## 构建与验收

1. 五个抖音广告位已写入DouyinConfig.ts，构建前核对后台状态。
2. 使用Cocos Creator 3.8.8的抖音小游戏构建和tools/douyin-build.json，输出build/douyin。
3. 不要对抖音产物运行prepare-tiktok-native.cjs；构建后运行node tools/check-douyin-build.cjs。
4. 抖音开发者工具导入build/douyin，验证启动、存档、分享、广告完成/取消/异常、前后台、振动和安全区。
5. TikTok同时真机回归原有广告、桌面/侧栏奖励、登录、分享、复活及后台恢复。

已通过双平台模拟契约、TikTok广告/登录、闲置插屏、结算概率和主题广告测试，不能替代真机验收。
历史检查边界：全量类型检查仍有AppInit模块配置、TerrainProgress旧库以及框架类型问题；旧test-tiktok-startup缺少cc/env模拟，test-game-screen-layout断言与当前布局不一致。本次未修改游戏布局或框架。

## 官方资料

- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/overview
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/log-in/tt-login
- https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-bytedance-mini-game.html


## 手机摇晃输入

抖音独立使用 DouyinMotion 监听加速度，由 PlatformMotion 分发到游戏页面已有摇晃入口。正常游戏中支持连续手机晃动及按钮追加施力，位移限幅32世界像素；设置、广告、后台、结算和退出时停止采样。轻微手抖不触发，初始阈值为两次反向变化幅值至少1.2、间隔不超过650毫秒，仍需抖音真机校准。接口缺失或启动失败时保留按钮，不逐帧重试。TikTok及浏览器不启用此传感器。
