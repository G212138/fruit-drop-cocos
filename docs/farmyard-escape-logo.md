# Farmyard Escape logo 更新记录

- 日期：2026-09-16。
- 替换资源：`assets/app-bundle/app-view/page/home/resources/redesign/title.png`。启动页与首页均引用该资源，保留现有 UUID 与预制体绑定。
- 使用内置 imagegen 编辑原 logo；最终提示要求：将上行 TUMBLE 改为 FARMYARD、下行 MATCH 改为 ESCAPE，保留黄绿立体字、蓝紫底板、白描边、苹果、甜甜圈和叶片，透明背景，1024×512 像素。
- 生成工具输出了棋盘格背景；经用户明确同意，使用本地图片处理脚本移除背景及甜甜圈孔内棋盘格，并适配原尺寸。
- 已验证：文字拼写与透明边缘人工检查，PNG 为 1024×512 RGBA，透明度覆盖 0–255；启动页与首页预制体引用同一图片 UUID。
- 未完成边界：尚未进行 Creator 运行预览与 TikTok 真机显示验收。
