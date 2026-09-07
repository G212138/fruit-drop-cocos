# 第二阶段进展：底部失败规则

本次完成底部判负迁移和重开回归，第二阶段的原版关卡布局、滚动和特殊机制仍待继续。当前仍使用十二个水果的分批验证布局，不能标记为原关卡完整复现。

## 源码依据

只读核对原项目 assets/_script/GameSc.js 和 BallSc.js：

- getLoseFloorBallThreshold：普通槽四个，扩槽五个。本次棋盘使用普通槽；纯规则已支持传入阈值，未接入扩槽道具。
- onBallBallContactForDropRule：非消除水果中，局部 y<-250 的数量达到阈值，并且最高两个水果产生新接触时判负；不能把这里的数量误写成触底数量。
- canEliminateNow：按高度排序的相邻同类水果中，至少一方触底时阻止判负；没有额外增加距离限制。
- tickLoseByFourFloorBalls：触底数量达到阈值，所有动态水果静止累计 0.5 秒判负；超过阈值时改为 0.15 秒。消除中、可消除、移动和触底数量变化会重置计时。
- areDynamicBallsSettled：线速度平方不超过 25、角速度绝对值不超过 5。
- onBallDropped 和 checkLoseByDropsWithoutElimination 是空实现，没有迁移不存在的“连续点击四次失败”。

## 模块职责

- failure/FloorFailureRules.ts：纯数据判负，不依赖 cc 或 UI。
- FruitItem：区分新接触和持续接触，输出位置、触底和刚体静止快照。
- FruitSpawner：提供包括消除动画中实例的快照。
- GameBoard：先结算配对，再于物理回调之外处理判负；停止、重开、销毁时清理接触队列和计时。
- PopResult：复用已有预制体，失败标题改为“底部水果堆满了”。

## 验证

- node tools/test-game-rules.cjs 通过：原有匹配/终态测试，以及接触双方、高度边界、触底与高度区别、静止延时、移动/数量/消除重置、阈值变化和重开。
- node tools/validate-prefabs.cjs 通过：六个预制体引用有效。
- Creator 3.8.8 已导入新模块并生成 meta；没有手工修改序列化资产。
- TypeScript 检查：新增业务目录无报错，XForge 原有严格类型错误仍在，不声称全项目类型检查通过。
- localhost:7457 实际点击：四颗芒果正常消除；第二批不同种类堆积触发失败弹窗；重新挑战恢复十二个水果。

## 下一步的关卡依据

initFruitByLevelData 使用原配置坐标并统一 y+700。模式一在点击后调用 shiftFruitIfUnclickedMinYTooHigh：仍未点击水果的最高 y 至少 600、最低 y 大于 100 时，整体移动到最低 y=-70；移动时间由距离/300 限制在 0.2 到 1.2 秒。移动期间禁止点击。

这不是“清空一批才生成下一批”。后续必须结合原场景父节点坐标、地形和水果碰撞尺寸一起迁移，不能只替换 JSON。模式二横向移动、冰块、黑洞、隐藏水果、预警闪色、复活与广告尚未实现。

补充预览结果：失败后重开，按同类配对完成全部十二个水果，显示“全部消除”和进度 100%；本次刷新以来浏览器错误日志为空。
