# 原版爆炸资源与独立特效层

日期：2026-09-08。已接入复活强制消除，实际画面及听感尚待混合机制试玩验收。

- 复制源 baozha.json、baozha.atlas、baozha.png 和 bomb.mp3，不复制旧 meta。四个文件的 SHA256 与源文件一致，记录见 phase15-resource-copies.json。
- ExplosionView.prefab 按原资源制作：尺寸945.82×2328.04、Spine动画1、不循环、timeScale=1.2、premultipliedAlpha=false。独立组件在完成后销毁自身，退出时解除骨骼回调。
- RemovalEffects.prefab 提供独立实例层与预置音源。每颗强制消除水果生成一份爆炸，世界坐标换算为该层局部坐标；特效不混入水果集合和触底计数。
- 同次复活最多两对水果，但只播放一次 bomb；纯回收分支不播放。音效遵守现有设置。使用 AudioSource.clip + play，使 clear 可以 stop；核实 Creator 3.8.8 的 playOneShot 创建独立播放器，不适合这里的退出停止要求。
- GameBoard 通过独立预制体节点获取 RemovalEffects，复活前重置次数，强制配对前播放，清局时销毁特效并停止音频。节点、骨骼、音源和绑定均通过 Creator MCP 编辑器制作，临时制作节点与目录已由 MCP 删除。
- `test-removal-effects.cjs` 验证坐标转换、每颗一次、同次复活音频去重、静音、清局和骨骼完成清理；`test-board-revive.cjs` 通过。新增两份预制体后，引用校验范围从47更新为49，全部通过。TypeScript 无 assets 目录诊断，不声明既有框架扩展检查全部通过。

待验证：横向复活、黑洞成员回退消除时爆炸位置和遮挡、音效实际播放及退出停止、连续复活和静音开关实玩。当前没有实玩截图或听感证据，不能将组件测试描述为这些项目验收通过。原普通配对、入袋、胜利动画等仍属于完整复刻的后续范围。
