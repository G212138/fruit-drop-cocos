/** 水果和棋盘间的局部事件，避免散落的字符串。 */
export const BoardEvents = {
    ReleaseRequested: 'release-request',
    FruitContact: 'fruit-contact',
    FruitContactBegan: 'fruit-contact-began',
    /** 首次接触原版地形，参数为是否动态下落。 */
    FirstFloorContact: 'first-floor-contact',
    /** 首次动态触地的草叶表现，参数为世界接触坐标。 */
    GroundImpact: 'ground-impact',
    /** 配对已确认，单体开始消除表现。 */
    Removing: 'fruit-removing',
    Matched: 'matched',
    Failed: 'failed',
} as const;
