# 首页回访礼包（2026-09-14）

- 首页新增侧边栏礼包、添加桌面两个 128px 图标与独立弹窗；图片拆分在 home/resources/revisit。
- 布局、按钮和事件引用保存于 PageHome 预制体，通过 Cocos 编辑器 API 制作。运行时不构建 UI、不调整位置。
- 美术沿用已确认的奶油色面板、橙金标题、绿色按钮；标题图片固定英文，说明支持现有八种语言。
- 项目不需要后端。TikTokSilentLogin 调用官方静默登录，仅验证成功回调存在临时 code，随后丢弃；不保存 code、不伪造 OpenID 或账号会话。现有可选 backend 配置为空，不参与此流程。
- 官方 canReceiveReward 为 true 才发奖：侧边栏 +1 刷新、桌面 +1 消除。导航成功不算任务完成。
- 道具和领取标记写入同一份本地存档，避免重复发奖。此记录是当前本地存档的记录，不提供跨设备账号同步。
- 普通浏览器开发预览可查看弹窗，但不会伪造登录或领奖；正式环境按宿主能力显示入口。

验证通过：test-revisit-dialog.cjs、test-tiktok-platform.cjs、test-tiktok-startup.cjs、validate-prefabs.cjs。首页及两个弹窗的浏览器预览无运行错误，已修正 Sprite 设置图片时覆盖预设尺寸的问题。

尚待用户真机验证：TikTok 原生导航、添加桌面、返回后官方资格与实际奖励。未执行 Native 真机构建。

编辑器制作工具：tools/retention-dialog-authoring.ts；只能作为临时编辑器组件执行，不加入运行时分包。
