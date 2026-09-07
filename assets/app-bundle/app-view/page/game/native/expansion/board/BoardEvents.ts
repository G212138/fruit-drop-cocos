/** 水果和棋盘间的局部事件，避免散落的字符串。 */
export const BoardEvents = {
    ReleaseRequested: 'release-request',
    FruitContact: 'fruit-contact',
    Matched: 'matched',
    Failed: 'failed',
} as const;
