# 主题界面制作

新增九张独立透明切图，位于首页 resources/theme-redesign。标题固定英文，其余文本由语言组件显示；物品使用项目现有图片。

首页内嵌 ThemePanel 保留水果与甜品两类，5列6行，共30个格子。切换分类仅预览，确认后保存；正在使用及未解锁分类不能重复确认。关闭不会保存预览，存储失败保留原主题。沿用页面统一点击音效和弹出动画。

验证：浏览器预览无 pageerror；预制体引用、字体绑定、多语言词表及 test-theme-confirm.cjs 通过。未进行原生设备测试。

制作脚本 tools/theme-design-authoring.ts 通过 Creator 编辑器 API 执行，不直接写预制体 JSON。
