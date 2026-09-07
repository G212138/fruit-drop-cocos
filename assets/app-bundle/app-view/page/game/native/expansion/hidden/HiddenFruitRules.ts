/**
 * 判断原版花朵遮罩是否应揭示；隐藏状态不参与配对规则。
 * @param firstFloorContact 是否为首次接触原版地形。
 * @param dynamic 此次接触时水果是否为动态刚体；补位和悬停不算。
 * @param removing 是否已被配对并进入消除流程。
 */
export function shouldRevealHiddenFruit(firstFloorContact: boolean, dynamic: boolean, removing: boolean): boolean {
    return removing || (firstFloorContact && dynamic);
}
