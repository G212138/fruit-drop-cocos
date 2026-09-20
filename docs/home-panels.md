# 首页独立 Pop

设置、主题、图鉴均为 XForge 独立 View，位于 `assets/app-bundle/app-view/pop/{settings,theme,collection}`。

- `native/PopSettings.ts`、`PopTheme.ts`、`PopCollection.ts` 继承 BaseView；同名主预制体放 native，私有辅助脚本放 native/expansion。
- 各目录 native/resources 使用 XForge 自带 view-native/view-resources 模板配置为 `pop-名称` 和 `pop-名称-res`，注册文件由框架生成。
- 首页仅通过 `app.manager.ui.show` 打开，不持有面板或 Prefab 静态引用。
- 私有图片迁移至对应 Pop 的 resources/textures；水果、地块及跨页面 UI 仍引用共享包。
- 关闭经 this.hide()，默认 destroy 模式；监听由 onHide 清理，资源释放由框架执行。
- SettingsPanel 展示组件仍与游戏内设置复用；首页 Pop 不改变游戏内现有设置行为。
- 地块内容关闭释放持有图片，快速翻页与销毁后的异步回调受请求代次保护。

组件引用通过编辑器 API 从拆分前预制体恢复。测试检查图鉴60张图片、30个槽位、主题预览、设置开关和各 Pop 入口绑定，防止空引用再次漏检。
