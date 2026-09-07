# 第一阶段工程说明

引擎：Cocos Creator 3.8.8。工程：E:\tiktok\xforge。预览：http://localhost:7457/。

## 预制体入口

| 资产 | 位置（相对 assets/app-bundle/app-view） | 职责 |
| --- | --- | --- |
| PageHome | page/home/native/PageHome.prefab | 首页布局、开始按钮 |
| PageGame | page/game/native/PageGame.prefab | BoardRoot 与 HudRoot 固定层级 |
| GameBoard | page/game/resources/prefabs/GameBoard.prefab | 原背景、地形、碰撞体、水果容器 |
| FruitItem | page/game/resources/prefabs/FruitItem.prefab | 刚体、圆碰撞体、Visual 图片子节点 |
| GameHud | page/game/resources/prefabs/GameHud.prefab | 关卡、进度和提示标签 |
| PopResult | pop/result/native/PopResult.prefab | 结算标题、重开和返回首页按钮 |

业务代码禁止 new Node / addComponent 拼装 UI。动态水果和页面子模块通过 instantiate 已保存的 Prefab 创建。水果图片、背景、地形、按钮和弹窗底图复制自原项目；旧版 meta 不复用。

## 阅读代码的顺序

1. PageHome.startGame：调用 XForge UIManager 进入 PageGame。
2. PageGame：加载预制体与 JSON，绑定局部事件，映射控制器状态。
3. LevelDefinition：关卡结构、类型/坐标/配对数量校验；没有引擎依赖。
4. GameController 与 store.game：权威局内状态、剩余计数、胜负终态。
5. GameBoard：批次推进、允许点击的时机、延迟处理物理接触。
6. MatchRules 与 MatchQueue：纯数据匹配、同帧去重，不访问 UI。
7. FruitSpawner：实例集合、图片绑定、生成和移除。
8. FruitItem：单体点击、下落、触底记录；FruitVisual：图片和消除补间。
9. GameHud 与 PopResult：显示和按钮响应。

方法采用中文 JSDoc 和多行排版。页面、棋盘、物理、表现、数据分开维护。

## XForge 约束

- 页面 native/resources 使用框架提供的 bundle 配置，名称为 page-home、page-game、pop-result 及对应 -res 包。
- controller、store 放 app-builtin 对应目录，通过 App/刷新生成 executor.ts；不手工维护注册表。
- 子资源跟随所属页面管理，resources 中不放业务脚本。
- PageGame 使用 BaseView.BindController(GameController)，通过 this.loadRes 加载所属资源。
- UI 节点绑定在编辑器中序列化，运行时不依赖 find 路径定位。

## 当前实现边界

当前是可交互的第一阶段验证关，不是原项目的完整移植。它复现了点击物理下落、底部同类配对、计数、分批补充和胜利结算。消除要求双方局部 y<-80，至少一方触底。

验证关使用 12 个水果的适配分批布局。原始第一关 JSON 保存在 docs/source-level-001.json；教程、原移动模式和真实失败规则仍需逐项迁移。出界 y<-650 是临时验证条件，不能视为原版判负规则；选错水果可能堵塞，尚未接入原版失败/复活机制。

未实现：完整关卡导入、冰块/黑洞/隐藏水果、道具、音效、存档、海外本地化、Google/TikTok SDK、IAA 广告与奖励验证。不会用假广告成功回调发奖。当前中文图片只用于迁移核对，正式海外版需要替换含字素材。

## 检查命令与限制

- node tools/test-game-rules.cjs：配对边界、重复通知锁定、关卡异常、终态保护与重新开局。
- node tools/validate-prefabs.cjs：6 个 Prefab 的节点索引和跨资产 UUID 引用。
- 全项目 tsc 的剩余错误位于 XForge 扩展原有严格类型代码；新增业务目录没有类型错误。未修改框架以掩盖这些错误。
- 浏览器预览验证不等于 Android/TikTok 构建通过；尚未生成正式平台包。

tools/prefab-authoring.ts 是本次编辑器制作脚本的存档，不属于 assets，不参与游戏运行。它使用 Creator 序列化器，不手写 prefab JSON。临时制作节点与 assets 下的制作组件已清理。
