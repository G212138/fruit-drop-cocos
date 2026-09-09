# TikTok Native 接入记录

目标：Cocos Creator 3.8.8 / XForge / TikTok Native 小游戏代码包。纯 IAA，不接 IAP。2026-09-09。

## 已接入客户端

- 消除与刷新广告位分别使用 `ad7683069395916933127`、`ad7683068205057099783`。公开 Client Key 为 `mg1swkarpsswyb0z`。
- `TikTokRewardProvider` 每次创建新广告实例，只接受关闭回调 `isEnded === true`；展示 Promise 完成不发奖。取消、异常、缺少广告位与超时不发奖；解除监听并防重复结算。
- `RewardGate` 保留请求编号、用途、来源和页面代次检查。TikTok 内不走开发广告模拟；复活、扩容暂无广告位，返回不可用。
- `TikTokLifecycle` 连接宿主前后台、广告暂停、原生短震和加载进度。后台与广告两种暂停分别记录，避免广告结束但游戏仍在后台时恢复主循环。
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

- `node tools/test-tiktok-rewards.cjs`：广告位分流、展示不发奖、取消、失败、空关闭结果、重复回调、监听清理、跨局失效。
- `node tools/test-tiktok-platform.cjs`：缺后端、登录合并、会话有效期、后端失败、任务资格、本地存储分流、幂等奖励、后台/广告暂停。
- 原有广告门禁、道具库存、复活控制器、语言、首页预加载与音频测试通过；预制体引用检查通过。
- 项目 assets TypeScript 检查无错误；工程已有 extensions 类型错误不属于此阶段改动。
- 普通浏览器首页进入第 2 关正常，控制台无新增 error。

## 未完成的上线条件

- HTTPS 登录服务、服务端身份落库与跨设备存档/奖励去重。
- 复活、扩容广告位；两个已有广告位的后台启用状态及真机播放确认。
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
