# 工程说明

引擎 Cocos Creator 3.8.8，工程 E:/tiktok/xforge，预览 http://localhost:7457/。

## 阅读顺序

1. PageHome：从存档进度进入 PageGame。
2. PageGame：用 XForge loadRes 加载棋盘、HUD 与原始关卡 JSON，并校验请求关卡。
3. LevelDefinition：原版格式校验、坐标初始偏移、支持范围。
4. GameController / store.game：单局权威状态和通关事件；LevelProgress 单独处理存档。
5. GameBoard：协调输入、配对、补位和失败；不包含 UI 布局。
6. FruitSpawner：通过独立预制体生成整关水果；FruitItem 负责点击与物理，FruitVisual 负责表现。
7. VerticalShiftRules / FruitShift：纯规则决定移动计划，协调器移动已有实例。
8. MatchRules / MatchQueue / FloorFailureRules：独立配对与失败规则。
9. GameHud / PopResult：只展示数据及响应按钮，不判定胜负或广告奖励。

## 资源结构

UI 资源放各页面 resources，脚本放 native/expansion；子预制体统一放 resources/prefabs。当前有五个页面/棋盘/HUD/结算预制体与二十五个水果预制体，另有独立 HiddenFruitView 遮罩预制体，总计三十一个。

所有 UI 节点和按钮绑定由 Creator 制作并序列化。运行时代码只实例化预制体，不 new Node 或 addComponent 拼 UI。tools/prefab-authoring.ts 是编辑器制作脚本存档，不参与游戏构建，临时制作组件在保存后删除。

## XForge 约定

沿用 native/resources 分包、BaseView.BindController、内置 model/controller 目录和 App 自动注册。不得手工编辑 executor.ts 或框架核心。字段、参数和方法使用中文说明，参数表见 parameter-guide.md。

## 当前支持范围与检查

已接入原版前五关及隐藏水果、整体补位、判负、下一关、原关重开和进度持久化。后续特殊机制明确拒绝加载，最新验证见 phase-04-validation.md，前阶段记录见 phase-03-validation.md；phase-02-validation.md 保留上一阶段历史记录。

运行 node tools/test-game-rules.cjs 和 node tools/validate-prefabs.cjs。全项目类型检查仍有 XForge 扩展原有严格类型报错；业务代码单独检查。平台 SDK、广告和平台构建不在本阶段交付范围。
