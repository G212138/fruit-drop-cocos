# 抖音小游戏适配

当前为代码适配完成、待提供参数与真机验收。App ID 和所有广告位按要求留空，不生成虚假奖励。

## 平台边界

- `TTMinis.game` 优先识别为 TikTok；其原生包中即使同时有 `tt`，仍使用原有 TikTok 配置、广告、登录与任务实现。
- 只有 `tt` 时启用独立抖音实现。不会创建或覆盖全局 SDK 别名。
- 游戏页面通过 PlatformRuntime / PlatformRewards / PlatformStartup 选择实现；微信尚未接入，后续另加适配。
- 抖音已接入本地存储、首次启动路由、静默登录、分享按钮、前后台暂停、短震与长震、广告生命周期。
- 抖音激励视频显式 load 后 show，仅 isEnded === true 才向奖励门禁报告完成；失败、取消、超时及空广告位不发奖。
- TikTok 桌面/侧栏任务在抖音中隐藏，包括抖音调试包。没有套用另一平台的任务奖励资格。
- 抖音暂为本地游客模式；静默登录允许 anonymousCode，但不保存凭证，不将其当作 OpenID 或服务端会话。

## 后续填写

1. `assets/app-builtin/app-model/expansion/platform/DouyinConfig.ts`：App ID 与七种激励用途、闲置插屏广告位。未使用的 prop 保持空。
2. `tools/douyin-build.json`：`packages.bytedance-mini-game.appid` 填相同抖音 App ID。
3. Cocos Creator 3.8.8 选择抖音小游戏，使用该配置；输出为 `build/douyin`。保留原 TikTok 构建配置及输出目录。
4. **抖音包不要执行 `prepare-tiktok-native.cjs`。** 构建后运行 `node tools/check-douyin-build.cjs`。
5. 用抖音开发者工具导入 `build/douyin`，完成真机预览后再上传；当前尚未构建、上传或发布抖音包。

## 验收

- 首次进入关卡、回首页、重开，重新启动后关卡/设置/语言/道具存档保留。
- 分享按钮、小游戏切后台与前台，振动开关及晃一晃长震。
- 各广告用途：完整观看、中途关闭、无库存、加载失败、重复点击、后台返回、旧局回调。
- 闲置插屏：空配置不启动；配置后点击任意位置重计时，游戏进行中不出现。
- 第二关起结算视频保持50%概率，空配置无展示无奖励。
- TikTok 回归：广告位未变，桌面/侧栏任务、分享、登录、存档、复活和暂停恢复逐项真机检查。

已运行模拟契约测试，不等同真实 SDK 或真机验收。项目完整类型检查仍有历史 tsconfig / 框架问题，本次新增适配未发现类型报错。

## 官方资料

- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/overview
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/log-in/tt-login
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/retweet/tt-share-app-message
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/data-caching/tt-set-storage-sync
- https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-bytedance-mini-game.html

历史测试边界：test-tiktok-startup.cjs 的旧模拟器缺少 cc/env 支持；test-game-screen-layout.cjs 与当前地形布局断言不一致。这两项仍未通过，未为本次适配修改游戏布局。
