# 结算界面对照记录

参照已确认的 LEVEL COMPLETE、ONE MORE CHANCE 和 LEVEL FAILED 三张设计图重建。
- 独立 PopResult 和 PageGame 内嵌 GameResult 使用同一编辑器制作脚本。
- 标题为英文图片；正文及按钮为多语言 Label。新增 uppercase 仅用于结算按钮的拉丁字母大写。
- success 插画、三个标题、面板、绿色按钮、进度条和圆形首页按钮重新制作切图；复活/失败插画从原稿场景区域切出。按钮箭头、重试、首页、摄像机独立切图。
- 生成方式：内置 imagegen。提示词核心：忠实提取原稿各元素，保持构图材质，透明背景，无文字按钮，完整边缘；不得重设计。PNG 最终保存在 assets/app-bundle/app-view/pop/result/resources/redesign。
- 动画：0.28秒面板入场；插画轻微呼吸；成功金绿碎光、复活蓝色上浮亮点、失败低亮度下落光点。节点全部预先序列化，运行时不创建 UI。
- 音频：成功沿用 success.mp3，失败复制原工程 Fail.mp3，复活提示使用低音量 merge.mp3；按钮沿用统一点击音效。关闭/切换时停止动画音源。
- IAA流程保留：失败先显示复活邀请；拒绝后失败；广告完成验证仍由业务层处理。
- 检查：test-result-view、test-language、validate-prefabs、浏览器三态预览无报错。未执行 Native 构建及真机广告测试。
`n后续恢复：成功页展示原版解锁行（首关舒芙蕾，已有30项资源）；试玩不显示解锁。首关第一次有效放下物品显示配对说明1.5秒。使用 tools/restore-guide-unlock-authoring.ts 在结算制作脚本之后应用此布局。
