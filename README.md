# fruit-drop-cocos

基于 Cocos Creator 3.8.8 和 XForge 的水果重力二消项目。

## 打开工程

使用 Cocos Creator 3.8.8 打开仓库根目录，等待资源导入，打开 assets/app-scene/main.scene 后预览。
默认页面为 PageHome。本地 MCP 扩展及其配置不进入仓库，不影响游戏运行。

## 当前进度

已实现第一阶段验证关：首页、物理下落、同类触底消除、进度、胜利结算、重开和返回首页。
UI 使用独立预制体；规则、数据、物理、表现与页面流程分开维护，业务方法使用中文注释。

尚未完成原版完整关卡、失败规则、特殊机制、IAA 广告和海外平台适配。当前版本不是正式发行包。

## 开发说明

- [工程结构与阅读顺序](docs/development-guide.md)
- [运行验证记录](docs/validation-2026-09-07.md)
- [资源来源及摘要](docs/resource-copies.json)
- [项目编码约定](AGENTS.md)

## 上游框架

基于 [XForge](https://gitee.com/cocos2d-zp/xforge)，保留其 Git 历史及 LICENSE。
原框架说明见 [XForge README](docs/xforge-readme.md)。素材来源见资源清单，框架许可证不代表其他素材授权。
