# 抖音中文图片资源

使用内置 image_gen 生成，未调用 CLI/API。所有文件为带透明通道的 PNG。

- 首页及启动Logo：`assets/app-bundle/app-view/page/home/resources/textures/logo-zh.png`
- 成功：`assets/app-bundle/app-view/pop/result/resources/textures/result-title-success-zh.png`
- 失败：`assets/app-bundle/app-view/pop/result/resources/textures/result-title-failure-zh.png`
- 复活：`assets/app-bundle/app-view/pop/result/resources/textures/result-title-revive-zh.png`

## Logo 最终提示词

Create a production-ready standalone Chinese mobile game logo PNG with TRUE transparent alpha background (no colored background, no black backdrop, no glow cloud). Text exactly 难不到我吧, five perfectly legible Chinese characters, top row 难不到 bottom row 我吧. Golden yellow top row and ivory bottom row, rounded bold 3D toy typography, thick cobalt blue extruded outlines. Small strawberry to left and orange to right, no additional letters. Tight balanced centered composition with 8 percent transparent margin. Bright cheerful casual fruit matching game. No panel. All outside areas and all gaps between letters fully transparent. Landscape 3:2.

## 结算标题提示词模板

Create a single production-ready Chinese casual mobile game result title sprite with genuine transparent alpha background. Exact text "{title}" only, four perfectly correct legible Chinese characters on ONE horizontal line, no punctuation or other words. Beautiful chunky rounded 3D cartoon custom Chinese lettering, {color}, strong crisp sculpted outline, soft glossy bevel highlights, playful premium fruit puzzle game style. Tight text lockup, all four characters equal size, gentle lively tilt. Very wide 3:1 composition, text fills canvas with only 5 percent transparent padding. No decorations, no badge, no panel, no backdrop, no glow clouds, no fruit, no rays, no watermark. All outside lettering and counters genuinely transparent. This is an isolated UI title image for layering over a dark game screen.

参数：
- title=挑战成功；color=warm gold extruded sides, golden yellow and creamy ivory faces
- title=再试一次；color=cobalt blue extruded sides and creamy ivory faces
- title=复活继续；color=coral red orange extruded sides and creamy ivory faces

## 验证边界

已验证图片透明通道、十处预制体图片绑定、平台语言策略和设置行可见性；抖音真机整体显示与加载需在构建后验证。英文原图保留，不修改其他平台的显示。
