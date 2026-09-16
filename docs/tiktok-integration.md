# TikTok Native 接入记录

目标：Cocos Creator 3.8.8 / XForge / TikTok Native 小游戏代码包。纯 IAA，不接 IAP。2026-09-09。

## 已接入客户端

- 消除、刷新、复活与解锁槽位统一使用用户于 2026-09-16 提供的激励视频广告位 `ad7677882286272235538`。公开 Client Key 为 `mg1swkarpsswyb0z`。
- `TikTokRewardProvider` 每次创建新广告实例，只接受关闭回调 `isEnded === true`；展示 Promise 完成不发奖。取消、异常、缺少广告位与超时不发奖；解除监听并防重复结算。
- `RewardGate` 保留请求编号、用途、来源和页面代次检查。TikTok 内不走开发广告模拟；复活与解锁槽位仅完整观看后发奖，取消不发奖。旧版通用道具用途 `prop` 保持停用。
- 当前未接入插页广告；用户指定的插页广告位为 `ad7677881962798794760`，后续接入时使用，本次不增加广告触发点。
- 2026-09-16 验证：通过 Node 读取实际配置，确认四个启用用途均使用新 ID、旧版 `prop` 仍停用；检索业务源码未发现插页广告调用，本次变更的 `git diff --check` 通过。尚未进行 TikTok 真机广告拉取与发奖验收。
- `TikTokLifecycle` 连接宿主前后台、广告暂停与原生短震。后台与广告两种暂停分别记录，避免广告结束但游戏仍在后台时恢复主循环。`AppInit` 仅直接上报宿主加载进度，禁止静态引用业务分包；`TikTokStartup` 在首页/游戏页面进入时连接业务能力。
- `PlatformStorage` 接管语言、设置、关卡、主题、道具的本地存档；保持原存档键。原生存储失败不能回退到另一份浏览器存档。这不是云存档。
- `TikTokLogin` 负责合并登录、取一次性 code、后端交换、校验会话有效期。`TikTokLoginBackend` 只向自有 HTTPS 地址发送 code/Client Key。服务器地址未配置时保持游客，不假装登录成功。
- `PageHome` 内嵌 `TikTokRevisitView`：桌面快捷方式、个人主页回访及返回后查询。用户主动点击才启动导航；能力不支持时隐藏按钮。八种语言与系统/手动语言设置一致。
- 回访通过 `canReceiveReward === true` 校验后发奖。桌面任务奖励消除一次，主页回访奖励刷新一次；每名玩家每任务一次。领取记录与库存同条存档落盘，道具消费保留领取记录。此为本地幂等，跨设备与清除存档后的去重需要服务器。

## 配置及后端契约

配置文件：`assets/app-builtin/app-model/expansion/platform/TikTokConfig.ts`。

用户确认暂无 HTTPS 登录后端，`loginEndpoint` 当前为空。因此登录及依赖有效会话的回访任务尚不能端到端完成。广告 SDK 是否可在当前后台权限/地区返回广告，需要真机验证。

后端部署后填写完整 HTTPS 登录接口。前端请求 `POST` JSON：

```json
{"code":"本次临时登录码","clientKey":"mg1swkarpsswyb0z"}
```

服务器持有 Client Secret，使用官方 OAuth 接口换取 OpenID，保存玩家身份，签发自己的游戏会话。成功应返回 HTTP 200：

```json
{"playerId":"服务器确认的玩家ID","sessionToken":"自有游戏会话令牌","expiresAt":1893456000000}
```

`expiresAt` 是 Unix 毫秒；示例不是可用会话。服务器失败返回非 200。平台 access_token、refresh_token、Client Secret 不返回客户端、不提交 Git。

服务器域名需加入 TikTok 后台允许的请求域名，后台需填写真实隐私政策与服务条款。此阶段没有部署服务器，也没有制作或提交法律文档。

## 构建与运行

1. 使用 `tools/tiktok-build.json` 通过 Creator 命令行构建到 `build/tiktok-base`。基础目标为 `bytedance-mini-game`，仅作为 Cocos 引擎兼容输出，不提交到抖音。
2. 运行 `node tools/prepare-tiktok-native.cjs`，生成 `build/tiktok-native`。旧目录存在时脚本拒绝覆盖，应先保留/重命名旧包。
3. 适配脚本检查正式构建、Client Key、分包路径、总包与主包大小，再给 `game.js` 增加 TikTok Native 命名空间桥接。保留 Cocos 生成的引擎适配文件。
4. 在 `build/tiktok-native` 内运行 `ttmg dev --client-key mg1swkarpsswyb0z`。本机已安装官方 CLI 0.4.1。
5. 用后台配置的 Test User 在 TikTok 手机客户端扫码，验证启动、分包、设置、广告全流程、退出/返回及回访任务。普通浏览器的成功运行不等于 Native 真机验收。

最终本地构建约 12.55 MiB，总包上限 30 MiB；主包约 3.69 MiB，上限 4 MiB。DevTool 本地编译成功。尚未连接手机，未上传发布或提交审核。

## 验证

- `node tools/test-tiktok-startup.cjs`：在所有业务分包均不可用的条件下实例化 AppInit，防止再次引入 Native 冷启动模块缺失问题。
- `node tools/test-tiktok-rewards.cjs`：广告位分流、展示不发奖、取消、失败、空关闭结果、重复回调、监听清理、跨局失效。
- `node tools/test-tiktok-platform.cjs`：缺后端、登录合并、会话有效期、后端失败、任务资格、本地存储分流、幂等奖励、后台/广告暂停。
- 原有广告门禁、道具库存、复活控制器、语言、首页预加载与音频测试通过；预制体引用检查通过。
- 项目 assets TypeScript 检查无错误；工程已有 extensions 类型错误不属于此阶段改动。
- 普通浏览器首页进入第 2 关正常，控制台无新增 error。

## 真机启动问题修复

用户首轮真机反馈 `Unable to instantiate chunks:///_virtual/TikTokLifecycle.ts from chunks:///_virtual/AppInit.ts`。原因是启动包静态依赖尚未加载的 `app-controller` 分包；浏览器预览提前注册脚本，未暴露这一问题。

已删除 AppInit 对 TikTok 业务模块的静态依赖，改为业务分包加载完成后的页面入口调用。用户负责后续真机构建与验证；修复后仅检查源码及本地测试，未自动重建或改动旧 `build` 代码包。

### 首页跨包资源加载修复

真机报错 `Please load bundle page-game-res first`，随后 `PageHome` 加载失败。检查已有代码包的依赖声明：首页依赖 `page-game-res` 和 `page-home-res`，游戏页还依赖 `pop-result-res`。原先在首页 `onShow` 中预热游戏资源，晚于首页预制体的依赖解析。

现通过 AppInit 的 `onUserInit` 扩展点，在框架业务脚本注册后、显示默认首页前依次加载这三个资源包。启动计数包含动画与共享资源两个任务；资源加载失败按 1 秒间隔重试，不将失败计为完成。不修改 XForge 核心，也不在启动包静态引用业务模块。

本地启动测试覆盖资源就绪前不放行、失败重试、全部完成后放行，并通过首页预热和预制体引用检查。本次仅修改源码，没有重新构建或修改现有 Native 代码包；真机效果待用户重新构建验证。

### 首页脚本类未注册修复

后续真机反馈仍有 Error 5302。该错误在 Cocos 3.8.8 中表示找不到脚本类，不是图片缺失。逐一比对脚本 meta 后，截图中的 ID 对应 HomeLogoMotion、TikTokRevisitView、ThemePanel、SettingsToggleView、LanguagePicker、SettingsPanel 和 PageHome。

实际代码包依赖链为 `page-home → page-game → pop-result`：首页引用游戏包中的 SettingsPanel，PageGame 又引用 PopResult。上一轮只加载三个资源包，未覆盖这条脚本依赖链。现保持资源包在前，再依次注册 `pop-result`、`page-game`，全部成功后才允许 XForge 打开默认首页。没有修改框架核心、预制体结构或用户编辑内容。

启动回归测试新增实际源码运行时 import 扫描，验证依赖包必须排在使用方之前；同时覆盖加载失败重试及未就绪不放行。启动与首页预热测试通过，业务代码类型检查无错误。未执行真机构建，现有构建产物未改动，仍需用户重新构建验证。

### 进入游戏集合展开兼容修复

真机进入 PageGame 时在 `restoreWarnings` 读取 `clearWarning` 报错。只读检查用户已有 `build/bytedance-mini-game/subpackages/page-game/game.js`，确认 `getLive()` 的 `[...this.live]` 被转换成 `[].concat(this.live)`，返回包含 Set 本身的数组，导致访问水果字段失败。

已将水果存活列表、黑洞 Map 值列表、关卡配对计数和语言订阅 Set 的展开改为 `Array.from()`。普通数组及对象展开保持原样。新增 `tools/test-native-collections.cjs`，对真实源码施加已观察到的单项展开转换，覆盖空集合、水果快照、待下落筛选、黑洞数量与坐标、语言通知和奇数水果校验。黑洞流程、语言、关卡编辑、水果生命周期测试通过，业务类型检查无错误。生命周期测试补齐世界坐标替身，以适配已有触地反馈。

本次未执行构建或改写现有产物，真机结果待用户重新构建验证。

## 未完成的上线条件

- HTTPS 登录服务、服务端身份落库与跨设备存档/奖励去重。
- 复活广告位；消除、刷新、解锁槽位三个已有广告位的后台启用状态及真机播放确认。
- 真机广告/回访验收、iOS/Android 与目标地区表现、平台代码预检和正式上传审核。
- 此阶段未加分享、插屏、支付；它们并非当前 IAA 必备主链路，避免未经设计增加打断玩法的广告。

## 官方依据

- https://developers.tiktok.com/docs/en/develop-your-mini-game
- https://developers.tiktok.com/docs/en/mini-games-sdk-iaa
- https://developers.tiktok.com/docs/en/silent-login
- https://developers.tiktok.com/docs/en/mini-games-sdk-revisit-incentives
- https://developers.tiktok.com/docs/en/mini-games-sdk-storage
- https://developers.tiktok.com/docs/en/build-mini-games-with-cocos
- https://developers.tiktok.com/docs/en/mini-games-development-troubleshooting（Native 的 tt/wx/TTMinis.game 等价命名空间）
- https://developers.tiktok.com/docs/en/mini-games-technical-overview（包体限制）
