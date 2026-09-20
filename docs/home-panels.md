# 首页独立面板资源

遵循 XForge 的 UI 资源包规则：面板作为首页子预制体，放在 `page/home/resources/prefabs`，通过 `PageHome.loadRes` 首次点击加载，不作为首页静态字段绑定。脚本仍放 `native/expansion`；SettingsPanel 复用游戏已有组件脚本。

- `ThemePanel.prefab`：图鉴，专用图片放 `resources/textures/panels/collection`。
- `TerrainPanel.prefab`：地块主题，地块使用 `shared-terrains` 中唯一原图；其余复用公共 UI，不额外复制私有图片。
- `SettingsPanel.prefab`：首页设置，专用图片放 `resources/textures/panels/settings`；与游戏设置共用的图片继续放 `shared-ui`。
- 水果和甜品继续引用 `shared-items`，广告图标继续引用 `shared-ui/images/ad-video.png`。

面板首次打开后跟随缓存首页复用实例；首页隐藏时关闭面板、取消待展示意图。并发点击合并加载，失败允许重试。资源生命周期由页面的 loadRes 管理，避免手工 release 破坏其他页面的公共依赖。

这次减少首页的静态资源依赖，不表示首页资源包总大小等比例缩小；平台若整包下载，仍需真机测量分包下载耗时。
