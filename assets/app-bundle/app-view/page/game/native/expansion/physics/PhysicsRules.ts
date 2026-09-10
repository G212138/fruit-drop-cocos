/** 两代引擎均使用三十二设计像素对应一物理米；2.4 的速度接口额外转换为像素，3.8 不转换。 */
export const PIXELS_PER_PHYSICS_METER = 32;
/** 原版角速度接口为度每秒，3.8 为弧度每秒。 */
export const DEGREES_PER_RADIAN = 180 / Math.PI;

/** 原项目 GameSc 的物理数值及手感适配参数，按两代引擎接口转换单位。 */
export const PHYSICS_RULES = {
    /** 水果碰撞恢复系数，无单位；手感适配从 0 提升至 0.2，越大反弹越明显。 */
    fruitRestitution: 0.2,
    /** 向下重力，单位设计像素每平方秒；由原版 -1600 增强 10% 至 -1760，加快下落加速，负数向下。 */
    gravityY: -1760,
    /** 原版负三百像素每秒换算为负九点三七五米每秒；直接填负三百会放大三十二倍。 */
    dropVelocityY: -300 / PIXELS_PER_PHYSICS_METER,
    /** 静止判断的线速度平方上限，单位为物理米每秒的平方。 */
    settledSpeedSquared: 25 / (PIXELS_PER_PHYSICS_METER ** 2),
    /** 静止判断的角速度绝对值上限，单位为弧度每秒。 */
    settledAngularSpeed: 5 / DEGREES_PER_RADIAN,
} as const;
