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
- 抖音使用独立的侧边栏、添加桌面任务及中文弹窗，依据宿主能力显示入口，不套用TikTok奖励资格。
- 无后端时保持本地游客体验；临时code或anonymousCode不落盘，不视为OpenID或服务端会话。

## 构建与验收

1. 五个抖音广告位已写入DouyinConfig.ts，构建前核对后台状态。
2. 使用Cocos Creator 3.8.8的抖音小游戏构建和tools/douyin-build.json，输出build/douyin。
3. 不要对抖音产物运行prepare-tiktok-native.cjs；构建扩展douyin-entry会在game.js首行注入入口来源监听；扩展尚未加载时先运行node tools/prepare-douyin.cjs，再运行node tools/check-douyin-build.cjs。
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


## 抖音中文界面

DouyinPlatform.fixedLanguage 固定为 zh，GameLanguage 在读取存档之前优先应用该策略，不覆盖其他平台语言偏好。设置隐藏语言行并重排高度。DouyinArtwork 仅在抖音加载中文首页/启动Logo“难不到我吧”，以及结算“挑战成功”“再试一次”“复活继续”；原图与扫光副本一起替换并保持比例，TikTok原英文图片不变。中文图片使用内置imagegen生成，保存在首页及结算资源包textures目录，提示词要求圆润立体中文、对应金/蓝/红描边和透明背景。

## 抖音回访奖励与界面

首页侧边栏每日奖励打乱道具1个；添加桌面首次奖励消除道具1个。领取记录以douyin命名空间写入原道具存档，保存失败不标记已领取，重复点击不重复发放。目前为本地存档，未接入服务端跨设备领取记录。

抖音弹窗与TikTok节点、业务组件分离。采用白色圆角面板、深色中文标题、浅粉奖励卡、红色主按钮、三步操作说明和明确关闭入口。此配色是本项目的视觉设计，不代表官方强制模板。按钮根据实际状态显示前往任务、立即领奖、今日已领取或已领取。

侧边栏先通过checkScene探测能力；game.js启动时同步注册onShow，以最新launch_from=homepage、location=sidebar_card和当天日期判断资格。普通来源返回会清除旧资格，导航成功不会直接发奖。添加桌面仅在受支持的Android宿主展示，addShortcut直接由点击回调同步触发，checkShortcut确认存在后才允许领取。

已验证：来源更新、每日/首次奖励幂等、同步手势调用、存储失败、平台隔离、构建注入及原TikTok任务回归。尚需抖音开发者工具及正式包真机验证侧边栏返回、桌面添加、各屏幕尺寸与实际奖励到账；桌面快捷方式正式发布后才能完整验证。

官方依据：
- https://partner.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/open-ability/Introduction-for-tech
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/sidebar-capacity/tt-navigate-to-scene
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/shortcut/add-shortcut
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/shortcut/check-shortcut