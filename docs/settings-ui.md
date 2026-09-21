# 统一设置界面

首页与游戏共用 `PopSettings.prefab`，按 `home` / `game` 模式切换可见内容，保留现有功能，不暂停游戏。语言列表只包含八种语言；首次使用按设备语言初始化，旧“跟随系统”偏好迁移为当前语言。设置实例缓存，私有脚本与图片集中在 `assets/app-bundle/app-view/pop/settings/`。

## 素材

使用内置 image_gen 按已批准效果图分别生成，再裁掉透明边并降到实际一倍尺寸。文字不烘焙在图片中。

| 图片 | 导出尺寸 |
|---|---|
| panel.png | 240 × 264 |
| header.png | 300 × 86 |
| row.png | 510 × 104 |
| music.png | 72 × 72 |
| sound.png | 72 × 72 |
| vibrate.png | 72 × 72 |
| globe.png | 72 × 72 |
| switch-on.png | 128 × 52 |
| switch-off.png | 128 × 52 |
| close.png | 76 × 76 |
| primary.png | 208 × 104 |
| restart.png | 48 × 48 |
| home.png | 48 × 48 |
| play.png | 52 × 52 |

九宫格：panel 四边32px；row 左右58px、上下0px，功能行原尺寸 SIMPLE 显示；primary 四边42px。其余素材保持比例。语言列表复用 row.png，显示510×76；开关128×52。

## 生成提示词记录

参考：2026-09-21批准的奶油白面板、蓝色边框和金黄按钮设置效果图。

共用要求：Create ONE isolated production UI sprite based on the approved casual mobile game settings mockup. Match sculpted 3D toy materials and soft lighting, straight-on view, true transparent RGBA background, tight margins, smooth antialiased edges, no typography, no scene or surrounding mockup.

逐图主题：panel 空白奶油白面板和蓝色倒角边框；header 空白金黄标题牌；row 空白奶油白内凹行底框；music 红色立体音符；sound 金色扬声器和声波；vibrate 蓝色手机和两侧振动波；globe 蓝色立体经纬球；switch-on 绿色胶囊开关，白色滑块右置；switch-off 灰蓝胶囊开关，白色滑块左置；close 奶油圆按钮、棕色立体叉号；primary 空白金黄主按钮；restart 蓝色立体循环箭头；home 蓝色小屋；play 奶油色立体播放三角。

## 验证

通过启动预加载、设置生命周期和模式切换、首页弹窗、八种语言模型、复活回归及81个预制体引用检查。浏览器实测首页设置、语言列表和英文切换、开关状态跨入口保持、游戏内设置、继续、重新挑战及返回首页。

## 语言选项与开关修正

移除“跟随系统”，保留八种语言，旧偏好迁移成当前实际语言。语言列表复用 row.png，显示510×76；以等比缩放配合横向九宫格延展保持圆角和浅阴影。普通状态奶油白，选中状态暖黄色 tint（#FFE19B）并显示勾选，两个底框互斥。旧 language-normal.png、language-selected.png 已删除。开关为128×52，按源图比例裁切，圆形滑块不再被压窄。

本轮使用内置 image_gen：以金色按钮为参考制作一张长条立体底框，再以该输出为基准只改为奶油白；关闭开关以开启开关为参考，保留外壳和滑块大小，移动滑块到左侧并改成灰蓝色。生成后裁透明边、保留两端圆角并只延展中段，导出实际使用尺寸。

提示词：gold beveled language selection row, matching silhouette and corners, transparent background, no text or icon; ivory variant changes only color and preserves geometry; OFF toggle preserves housing and round knob, moves knob left and changes green to slate gray.
功能行 row.png 最终按用户提供的原设计截图重绘：奶油白哑光圆角矩形、轻微上边高光、浅米色下缘阴影；移除金边与胶囊造型。最终510×104，图标、文字及开关保持独立节点。
提示词：Extract only the blank ivory rounded rectangle row card from approved reference, warm matte ivory, thin soft white upper highlight, subtle beige ambient occlusion, shallow relief, radius18% of height, no gold border, no text/icons/toggle, transparent RGBA. 采用内置 image_gen，裁切后替换 row.png，保留 UUID。