# 参数与数值说明

业务字段和方法参数均有中文 JSDoc；接口数据字段也注明用途。下面区分原规则与本次适配，坐标统一为棋盘局部坐标。

| 位置 / 参数 | 当前值 | 用途、单位与调整影响 | 来源 |
| --- | --- | --- | --- |
| LevelDefinition.INITIAL_OFFSET_Y | 700 | 首次生成时给原配置 y 增加的设计像素，修改会改变整关初始布局 | GameSc.InitialOffsetY |
| SUPPORTED_LEVEL_COUNT | 5 | 本阶段普通及隐藏水果关卡开放数量；不能只提高该值就声称支持特殊机制 | 迁移范围 |
| SHIFT_RULES.topThreshold | 600 | 最高未点击水果至少达到的 y，单位设计像素 | shiftFruitIfUnclickedMinYTooHigh |
| bottomThreshold | 100 | 最低未点击水果必须高于的 y，单位设计像素 | 同上 |
| targetBottom | -70 | 整体补位后最低水果的目标 y，单位设计像素 | 同上 |
| speed | 300 | 距离除以该值计算动画秒数；正弦缓出，所以不是实际匀速 | animateShiftUnclickedBalls |
| minDuration / maxDuration | 0.2 / 1.2 | 补位时间上下限，单位秒；调大会延长输入锁定时间 | 同上 |
| PHYSICS_RULES.gravityY | -1600 | 向下重力，单位设计像素每平方秒；引擎内部按像素米比例转换 | 原 GameSc |
| dropVelocityY | -300 / 32 = -9.375 | 原版像素/秒转换为3.8米/秒，负数向下 | 2.4.15 CCRigidBody.linearVelocity 与3.8.8 setLinearVelocity 源码 |
| settledSpeedSquared | 25 / 1024 | 原版像素速度平方转换为米速度平方，严格静止判定 | 两代引擎速度接口源码 |
| settledAngularSpeed | 5 × π / 180 | 原版5度/秒转换为弧度/秒 | 2.4.15 CCRigidBody.angularVelocity 与3.8.8接口源码 |
| canMatch.limit | -80 | 双方 y 都必须严格低于此线；不是水果数量 | BallSc.onPreSolve |
| FLOOR_RULES.bottomY | -250 | 底部接触排序采用的高度线，单位设计像素 | canEliminateNow |
| normalThreshold | 4 | 普通槽判负数量；纯规则也接受扩槽的 5，当前无扩槽操作 | getLoseFloorBallThreshold |
| normalDelay / overflowDelay | 0.5 / 0.15 | 达到/超过阈值后的连续静止秒数；调大会延迟失败 | tickLoseByFourFloorBalls |
| FruitVisual 消除补间 | 0.12 秒、1.15 倍、0.12 秒 | 放大后缩小至零的视觉反馈，不影响原版水果配置 | 迁移适配效果 |
| LevelProgress.key | fruit-drop.progress.v1 | 独立存档键；保存 version 和下次继续的 level，不存节点或整盘物理状态 | 新项目存档设计 |
| PageGame.generation | 每次显示递增 | 异步加载代次；旧局回调不允许写入新局，不是关卡编号 | 生命周期保护 |

水果大小和碰撞顶点保存在独立预制体中，由 Creator 序列化。docs/source-geometry.json 是从原文件提取的核对数据，不是手写预制体。修改形状需要通过编辑器重新保存资产。

当前前四关分别有 12、40、72、126 个水果。原 JSON 的 n 是水果编号，p 是 [x,y]，m=1 是纵向模式，h=f 是未隐藏；h=t 已接入独立花朵遮罩；冰块、黑洞及横向模式仍拒绝加载。

显示适配：FruitViewport 在预制体中裁剪水果显示，上边界 y=500、下边界 y=-1500，单位设计像素；保持水果容器原点不变，只防止场外水果遮挡 HUD，不改变原关卡坐标。

隐藏水果参数：hidden 从原配置 h=t 读取，只控制外观；HiddenFruitView 尺寸 117×117 设计像素、缩放 0.9，均来自原 flower 预制体和 GameSc 配置。首次地形接触时必须为动态刚体才揭示；配对移除也揭示。没有额外延时、奖励或种类变化。
# 入场动画参数补充

EntryRules 中场外边距为 80 设计像素；增大后水果从更远处进入。速度基准为 900 设计像素/秒；增大后计算时长缩短。时长限制为 0.25 至 1.2 秒，避免极短或过长入场；以上值沿用原版。EntryFlow 使用 sinOut 缓动，入场时锁定棋盘操作并暂停水果物理，完成后恢复。当前边界取棋盘 UITransform 尺寸，不等同于所有设备的实际可见边界。

## 水果等待区上移（2026-09-08 用户调整）
初始纵向偏移 INITIAL_OFFSET_Y：700→840；纵向补位 topThreshold：600→740，bottomThreshold：100→240，targetBottom：-70→70；复活 minimumY：-70→70。单位均为750宽设计坐标的像素，统一上移140，以增加水果与斜坡的距离。已下落水果的物理位置不参与补位；原关卡JSON不改写。复活黑洞仍保留原半量容器抬升计算，因此极低黑洞布局的基准抬升可能增加280，需另外实玩核对。

### 洞口后整体补位（用户调整）
- `SHIFT_MOUTH_Y = -165.638`：棋盘局部设计像素，取原地形位置 -363.538、碰撞偏移0.9、洞口左上沿197之和。水果中心到达该高度即视为到达洞口；调高提前补位，调低延后。
- 连续点击按一批等待，全部到达洞口或已经消除后，才消费一次纵向补位请求；不用固定秒数估计下落。
- 开局入场补位独立执行；横向模式保留原规则。结束、重开、销毁清空等待集合。

验证记录：洞口门控的连续点击、到口边界、途中消除、动画忙碌和重开清理规则测试通过；复活规则及棋盘流程回归通过，50份业务预制体引用检查通过，TypeScript未输出assets业务目录诊断。预览第二关确认等待区上移，并执行连续释放；未逐帧录制完整补位过程。当前用户已有的GameBoard裁剪修改使顶部水果进入HUD区域，本次未覆盖或提交该预制体修改。
