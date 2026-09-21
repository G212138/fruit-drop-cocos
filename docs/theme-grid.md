# 主题地块网格

PopTheme 使用三列垂直滚动网格，按 terrainCatalog 展示全部11个地块。每张卡片包含八语种名称、现有共享地块预览、状态按钮和统一广告图标。按钮与图标独立，不烘焙文字。UI节点、滚动及点击绑定均通过 Creator 编辑器制作。

默认仅晴日草坡解锁。其他地块分别完整观看两次激励广告，显示0/2、1/2；完成两次后显示“使用”，点击后切换为“使用中”。广告关闭、失败、不可用、失效回调和并发点击不增加次数。保存失败不更新内存权益，不能绕过锁定直接选择。

广告位：ad7686756249044322312，用途 terrain-unlock。使用全局 TikTokRewardProvider 与 RewardGate，浏览器不伪造完成。真实投放与设备回调需要在 TikTok 真机确认。

存档沿用 fruit-drop.terrain.v1 键，内部结构升级为 version:2，保存 selected 和各地块 views。旧version:1没有付费/广告权益，按新规则默认回到草坡；有效新版记录保留进度。切换掉落物图鉴不受影响。

设置与主题共用图片已移动到 assets/res-bundle/shared-ui/images/dialog-{panel,header,row,close}.png，保持原UUID，没有复制第二套。预览直接引用 shared-terrains 的现有素材。主题私有脚本仍在 pop/theme/native/expansion；弹窗随XForge缓存。

验证：地块两次解锁/存档迁移/失败回滚/并发/关闭失效/八语种回归、TikTok广告位路由和真实完成标识模拟、启动预加载、Pop绑定与资源引用检查。浏览器检查三列预览、上下滚动、无平台广告时不增加进度。
