# fruit-drop-cocos

基于 Cocos Creator 3.8.8 和 XForge 的水果重力二消项目。

## 打开工程

使用 Cocos Creator 3.8.8 打开仓库根目录，等待资源导入，打开 assets/app-scene/main.scene 后预览。
默认页面为 PageHome。本地 MCP 扩展及其配置不进入仓库，不影响游戏运行。

## 当前进度

已接入原版前四个普通关卡、二十五种水果独立预制体、原始多边形碰撞、整体补位、底部判负、下一关、原关重开和本地进度。
UI 使用独立预制体；规则、数据、物理、表现与页面流程分开维护，业务方法、字段及参数使用中文注释，并提供数值说明表。

第五关及之后、特殊机制、IAA 广告和海外平台适配尚未完成。当前版本不是正式发行包。

## 开发说明

- [工程结构与阅读顺序](docs/development-guide.md)
- [本阶段验证与边界](docs/phase-03-validation.md)
- [参数与数值说明](docs/parameter-guide.md)
- [本阶段资源来源及摘要](docs/phase-03-resource-copies.json)
- [项目编码约定](AGENTS.md)

## 上游框架

基于 [XForge](https://gitee.com/cocos2d-zp/xforge)，保留其 Git 历史及 LICENSE。
原框架说明见 [XForge README](docs/xforge-readme.md)。素材来源见资源清单，框架许可证不代表其他素材授权。
