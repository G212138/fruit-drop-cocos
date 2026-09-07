# 参数与数值说明

业务字段和方法参数均有中文 JSDoc；接口数据字段也注明用途。下面区分原规则与本次适配，坐标统一为棋盘局部坐标。

| 位置 / 参数 | 当前值 | 用途、单位与调整影响 | 来源 |
| --- | --- | --- | --- |
| LevelDefinition.INITIAL_OFFSET_Y | 700 | 首次生成时给原配置 y 增加的设计像素，修改会改变整关初始布局 | GameSc.InitialOffsetY |
| SUPPORTED_LEVEL_COUNT | 4 | 本阶段已检查的普通关卡开放数量；不能只提高该值就声称支持特殊机制 | 迁移范围 |
| SHIFT_RULES.topThreshold | 600 | 最高未点击水果至少达到的 y，单位设计像素 | shiftFruitIfUnclickedMinYTooHigh |
| bottomThreshold | 100 | 最低未点击水果必须高于的 y，单位设计像素 | 同上 |
| targetBottom | -70 | 整体补位后最低水果的目标 y，单位设计像素 | 同上 |
| speed | 300 | 距离除以该值计算动画秒数；正弦缓出，所以不是实际匀速 | animateShiftUnclickedBalls |
| minDuration / maxDuration | 0.2 / 1.2 | 补位时间上下限，单位秒；调大会延长输入锁定时间 | 同上 |
| PHYSICS_RULES.gravityY | -1600 | 向下重力，单位设计像素每平方秒；引擎内部按像素米比例转换 | 原 GameSc |
| dropVelocityY | -300 | 释放时线速度，单位物理米每秒；保持原始设置值，引擎另有限速 | 原 dropBallNode；核对 3.8.8 Box2D 实现 |
| settledSpeedSquared | 25 | 线速度平方不超过该值才视为静止，单位为物理米每秒的平方 | areDynamicBallsSettled |
| settledAngularSpeed | 5 | 角速度绝对值上限，单位弧度每秒 | 同上；核对 3.8.8 RigidBody2D 文档 |
| canMatch.limit | -80 | 双方 y 都必须严格低于此线；不是水果数量 | BallSc.onPreSolve |
| FLOOR_RULES.bottomY | -250 | 底部接触排序采用的高度线，单位设计像素 | canEliminateNow |
| normalThreshold | 4 | 普通槽判负数量；纯规则也接受扩槽的 5，当前无扩槽操作 | getLoseFloorBallThreshold |
| normalDelay / overflowDelay | 0.5 / 0.15 | 达到/超过阈值后的连续静止秒数；调大会延迟失败 | tickLoseByFourFloorBalls |
| FruitVisual 消除补间 | 0.12 秒、1.15 倍、0.12 秒 | 放大后缩小至零的视觉反馈，不影响原版水果配置 | 迁移适配效果 |
| LevelProgress.key | fruit-drop.progress.v1 | 独立存档键；保存 version 和下次继续的 level，不存节点或整盘物理状态 | 新项目存档设计 |
| PageGame.generation | 每次显示递增 | 异步加载代次；旧局回调不允许写入新局，不是关卡编号 | 生命周期保护 |

水果大小和碰撞顶点保存在独立预制体中，由 Creator 序列化。docs/source-geometry.json 是从原文件提取的核对数据，不是手写预制体。修改形状需要通过编辑器重新保存资产。

当前前四关分别有 12、40、72、126 个水果。原 JSON 的 n 是水果编号，p 是 [x,y]，m=1 是纵向模式，h=f 是未隐藏；h=t、冰块、黑洞及横向模式都不能默认为普通水果。

显示适配：FruitViewport 在预制体中裁剪水果显示，上边界 y=500、下边界 y=-1500，单位设计像素；保持水果容器原点不变，只防止场外水果遮挡 HUD，不改变原关卡坐标。
