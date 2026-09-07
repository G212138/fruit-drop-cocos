/** 原项目 GameSc 的物理数值；修改会改变下落速度和静止判负时机。 */
export const PHYSICS_RULES = {
    /** 原版重力纵向加速度，单位设计像素每平方秒，负数向下。 */
    gravityY: -1600,
    /** 原版点击释放初速度，单位物理米每秒，负数向下；沿用原源码值，由引擎限制最大位移。 */
    dropVelocityY: -300,
    /** 静止判断的线速度平方上限，单位为物理米每秒的平方。 */
    settledSpeedSquared: 25,
    /** 静止判断的角速度绝对值上限，单位为弧度每秒。 */
    settledAngularSpeed: 5,
} as const;
