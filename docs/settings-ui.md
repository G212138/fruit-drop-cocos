# 统一设置界面

首页与游戏共用 `PopSettings.prefab`，按 `home` / `game` 模式切换可见内容，保留现有功能，不暂停游戏。语言列表包含跟随系统及八种语言。设置实例缓存，私有脚本与图片集中在 `assets/app-bundle/app-view/pop/settings/`。

## 素材

使用内置 image_gen 按已批准效果图分别生成，再裁掉透明边并降到实际一倍尺寸。文字不烘焙在图片中。

| 图片 | 导出尺寸 |
|---|---|
| panel.png | 240 × 264 |
| header.png | 300 × 86 |
| row.png | 160 × 104 |
| music.png | 72 × 72 |
| sound.png | 72 × 72 |
| vibrate.png | 72 × 72 |
| globe.png | 72 × 72 |
| switch-on.png | 128 × 64 |
| switch-off.png | 128 × 64 |
| close.png | 76 × 76 |
| primary.png | 208 × 104 |
| restart.png | 48 × 48 |
| home.png | 48 × 48 |
| play.png | 52 × 52 |

九宫格：panel 四边32px；row 四边26px；primary 四边42px。其余素材保持比例。全部PNG约243KB。

## 生成提示词记录

参考：2026-09-21批准的奶油白面板、蓝色边框和金黄按钮设置效果图。

共用要求：Create ONE isolated production UI sprite based on the approved casual mobile game settings mockup. Match sculpted 3D toy materials and soft lighting, straight-on view, true transparent RGBA background, tight margins, smooth antialiased edges, no typography, no scene or surrounding mockup.

逐图主题：panel 空白奶油白面板和蓝色倒角边框；header 空白金黄标题牌；row 空白奶油白内凹行底框；music 红色立体音符；sound 金色扬声器和声波；vibrate 蓝色手机和两侧振动波；globe 蓝色立体经纬球；switch-on 绿色胶囊开关，白色滑块右置；switch-off 灰蓝胶囊开关，白色滑块左置；close 奶油圆按钮、棕色立体叉号；primary 空白金黄主按钮；restart 蓝色立体循环箭头；home 蓝色小屋；play 奶油色立体播放三角。

## 验证

通过启动预加载、设置生命周期和模式切换、首页弹窗、八种语言模型、复活回归及81个预制体引用检查。浏览器实测首页设置、语言列表和英文切换、开关状态跨入口保持、游戏内设置、继续、重新挑战及返回首页。
