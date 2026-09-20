# 资源目录与复用规则

- `assets/res-bundle/shared-items/fruit`：30张水果图片，游戏、图鉴、关卡编辑器共用。
- `assets/res-bundle/shared-items/dessert`：30张甜品图片，同样共用。
- `assets/res-bundle/shared-terrains/terrains`：11款地块原图，主题预览和关卡共用；`blocks` 存放对应挡板。
- `assets/res-bundle/shared-ui/fonts`、`images`：跨页面使用的字体和通用美术。
- `page/home/resources/textures/home`、`collection`、`retention`：首页、图鉴和回访弹窗的私有美术。
- `pop/result/resources/textures/result`：结算页私有美术。
- `page/game/resources/textures/hud-actions`：关卡操作区私有美术；其它关卡特效、音效保留原功能目录。
- `page/game/resources/prefabs/fruit`、`dessert`：游戏物品预制体，碰撞和逻辑属于游戏，图片引用共享资源。
- 所有临时编辑器辅助脚本只在制作时导入，执行后立即删除；长期工具保留在 `tools`。

遵循 XForge 的 res-bundle 公共动态资源包及 native/resources 页面分包规则。公共包优先级10，高于页面资源包，启动时先注册 shared-items、shared-terrains、shared-ui，再注册页面资源及代码。

通过 Creator asset-db 移动，保留 UUID。地块加载使用 shared-terrains 包的 terrains 路径。静态预制体依靠 UUID 复用图片，不生成预览副本。

本轮替换旧水果/甜品预览及重复美术引用后删除96份旧图片；此前已删除144份无引用旧素材。按文件内容哈希检查图片、字体、音频，重复组为0。保留由代码或动画间接加载的资源。

验证：预制体引用、主题/图鉴选择、Native启动依赖顺序。完整小游戏构建及真机效果仍需验证。
