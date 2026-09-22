# 结算英文标题与青绿按钮版本

按确认图 exec-45054b5f-8cb6-4d0b-81c9-882d59e1fef1 制作。保持独立 PopResult、无底框、固定英文标题，正文和按钮仍由 ResultOverlay 使用八语种文本。成功只在确有解锁时显示物品，否则为奖章。

## 切图

内置 imagegen 生成参考图对应标题、主/次按钮、主插画和独立特效，保留真实 alpha，裁掉透明留白后按使用尺寸缩放。使用 Creator asset-db 导入并配置按钮九宫格。六图标从同一套透明图标条分别裁出；未把源图标条或生成的大图带入项目，也未新增手工图集。

资源目录：assets/app-bundle/app-view/pop/result/resources/textures/。
- result-title-success、result-title-revive、result-title-failure：奶油白字面，分别绿、橙、蓝侧边。
- result-button-teal、result-button-navy：主按钮550×150，次按钮262×118。
- result-medal-v2、result-heart-v2、result-retry-v2：奖章、爱心、重试插画。
- result-icon-home、next、retry、video、share、friends：64像素以内图标。
- result-fx-burst、pulse、spark：冲击光环、双心跳光环、扫光星芒。

标题最长560像素，光环最长520像素。旧success/retry/heart/share/button-gold/button-cream已经检查序列化资产无引用后通过Creator移除。

## 生成提示词记录

内置工具参考批准图，分别提取重制：英文 LEVEL CLEAR! / ONE MORE TRY? / TRY AGAIN!，奶油字面与对应色彩厚侧边、两行、透明背景、无其它UI；青绿/深蓝空白立体按钮无文字图标；绿叶青绿绶带金奖章；蓝色石质重试徽章；珊瑚红爱心。光效为透明心形环、金色放射冲击环、四角星芒。图标条为同材质奶油白立体home/next/retry/video/share/friends六图标，独立裁切。生成源图留在Codex generated_images，项目只引用最终小尺寸切图。

## 动效

ResultPresentation使用预制体已绑定节点与时间驱动，无运行时造节点，无逐帧图片。
- 成功：标题放大冲入0.24秒、短促回弹/轻震；两道冲击环、14颗星光爆发；主插画随后弹出；每4秒星芒掠过标题。
- 复活：橙色标题收拢落定，爱心双跳；两道心形光环每2.4秒轻循环；入场6颗星光。
- 失败：蓝色标题短回弹，重试插画旋转32度归位，不爆光。
- 主按钮与次按钮错峰轻弹，不新增等待；下一关保留原0.7秒显示规则。入场结束后不覆盖Button自身点击缩放。
- 隐藏、切态、重复打开时恢复预制体位置/比例并清理光效。

## 验证

浏览器查看三态并实际点击关闭复活进入失败结算，未捕获控制台错误。临时PREVIEW探针只展示结算、不改变进度/广告奖励，验证后删除。动画单测覆盖状态切换、低帧率收尾、心跳、关闭恢复及按钮缩放互不覆盖。原结算、复活、多语言/分享测试与预制体引用检查通过；结算TypeScript零诊断，项目原有118条诊断仍在。

未做正式构建和真机性能/分享验证。浏览器画面只验证布局与流程，不代表已测量正式包DrawCall或设备帧率。

成功追加48片四色大彩带，屏幕两侧向中央上方喷出后旋转飘落，4.2秒内结束；使用内置imagegen生成透明奶油色S形缎带，裁切为64×64 PNG（result-confetti.png），编辑器着色复用，不新增图集。

彩带改为每次成功独立随机的喷射轨迹（角度/速度/落点/大小/旋转/摆动/时长）；落点分层随机覆盖实际视口全宽。新增36片顶部持续彩带，按真实屏幕高度下落至底部外再重生；成功页持续显示，关闭和失败态全部隐藏。所有彩带复用同一张64像素切图。
