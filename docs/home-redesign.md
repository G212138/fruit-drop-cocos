# Tumble Match 首页改版与语言预留

- 按用户确认稿拆分天空背景、品牌标题、无字开始按钮、无字主题按钮；通过 Creator 编辑器 API 保存 PageHome，未手写预制体。
- 首页仍通过 XForge 打开 PageGame、预加载关卡资源；保留原主题和设置面板。设置图标暂用已有资源，主题按钮为同风格重新生成，与稿件并非逐像素相同。
- HomeLocalization.ts 管理中、英、德、法、西、葡、日、韩首页文案；languageOverride 留空使用系统语言，未知语言回退英文。调用 refreshLanguage 可刷新文字。
- PLAY、THEMES、关卡及开发编辑器入口均为独立 Label；关卡用 {level} 占位符，Label 开启 SHRINK 并预留宽度。品牌标题 Tumble Match 不翻译。
- 本次仅首页文案多语言化；原主题弹窗、设置弹窗、游戏内文字和图片字尚未全量翻译。未新增语言选择弹窗或存档设置。其他语言、RTL 与定制字体需后续扩展验证。
- 首页内容适配参考高度 1625 设计像素，上下边界 ±812.5；背景等比覆盖，内容保持安全区域等比适配。
- 预览已显示新版首页与系统中文标签。八种语言词条、区域代码回退、关卡占位符、原首页预加载/入口测试通过，预制体引用检查通过。尚未完成所有语言和设备实机截图验收。

## 美术生成记录
使用内置 imagegen。背景提示：保留确认稿天空云朵草地，移除标题和按钮。标题提示：提取 TUMBLE MATCH 品牌标志并输出透明背景。开始按钮提示：提取绿色按钮底板并删除所有文字。主题按钮提示：透明背景蓝色圆角按钮，上部调色盘与画笔，下部留空供多语言文字。
最终资源位于 assets/app-bundle/app-view/page/home/resources/redesign/。未使用生成失败的棋盘格背景版本。

## 设置图标与标题动画
- 设置入口换为确认稿同风格橙黄色透明齿轮，仍绑定 openSettings。
- HomeLogoMotion 挂在 Title/LogoVisual，父节点只负责屏幕适配；不对整个首页做缩放。
- floatDistance：7 设计像素；scaleAmount：0.015（1.5%）；halfCycleSeconds：1.8 秒，完整周期 3.6 秒。
- onDisable/onDestroy 停止自身补间并还原快照，再次显示不累计位移。
- 图标由内置 imagegen 根据确认稿提取生成，提示要求独立橙黄色齿轮、白色描边、真实透明背景。保存为 resources/redesign/settings.png。
- 重启后通过 prefab edit_save 正式清除 HomeMotionAuthor；退出预制体编辑模式后完成动画绑定。最终预览首页和设置面板正常，错误日志为空；预制体引用检查通过。
