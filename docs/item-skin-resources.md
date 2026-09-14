# 物品皮肤资源

游戏物品按皮肤放在 `assets/app-bundle/app-view/page/game/resources/themes/items/`：

- `fruit/textures`：30 张水果图片。
- `fruit/prefabs`：30 个水果预制体；`FruitItem.prefab` 是第 21 种水果，沿用原名称和 UUID。
- `dessert/textures`：30 张甜品图片。
- `dessert/prefabs`：30 个甜品预制体。

新增物品皮肤时，在 `items` 下创建独立目录，分别放入 `textures` 和 `prefabs`，然后在编辑器绑定物品列表。仅新建目录不会自动注册新皮肤。

地块、背景、挡板、袋子属于场景主题，本次没有混入物品目录；公共特效和功能预制体仍在原公共目录。关卡编辑器自己的缩略图资源保留在编辑器资源包。

本次通过 Creator 资源移动接口迁移，保留 UUID；已同步制作脚本和验证脚本中的路径。
