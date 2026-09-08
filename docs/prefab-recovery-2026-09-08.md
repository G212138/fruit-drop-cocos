# 预制体误保存排查（2026-09-08）

用户报告保存预制体弹窗后预览报错：Can not find class 372f2CcW9pACbF8oZXte/IE，以及 PageGame.ts 设置棋盘父节点时读取 null.constructor。

## 已确认的差异与恢复

GameBoard.prefab 相对 HEAD 被覆盖：出现缺失脚本类 372f2CcW9pACbF8oZXte/IE，黑洞预制体引用为空；GameBoard 的 removalEffectsRoot、lockWallRoot、levelHintRoot、leftBoundary、rightLine 为空；嵌套预制体节点发生替换。其他业务预制体没有 Git 内容差异。

恢复前已备份覆盖版本到本地工作目录 work/GameBoard-overwritten-20260908.prefab.backup。退出预制体模式后，通过 git restore 从已验证 HEAD 恢复完整 GameBoard，未手写节点、UUID 或序列化内容；随后通过 Creator MCP 刷新资源。

## 防止漏检

原检查只校验非空索引和资源 UUID，无法发现缺失组件类及被清空的必填绑定；Creator MCP 的格式检查也将该损坏文件判为有效。增强 tools/validate-prefabs.cjs：用实际脚本 meta UUID 检查业务组件类标识，并检查 GameBoard 与 FruitSpawner 的必填绑定。

恢复后的49个业务预制体通过；将已备份的损坏文件单独传给检查器，准确报出截图中同一缺失组件类。此检查是资产结构检查，不代替实际运行。

当前预览端口：新项目 xforge 为7456，原逆向项目为7457。端口随编辑器启动顺序变化，验证前以页面标题核实。

## 运行复验
重新加载编辑器并启动浏览器预览后，首页及正式第1关正常显示；棋盘恢复水果、地形、锁墙和关卡信息，预览 error 日志为空。加载过程中出现过黑屏，后续加载完成正常，未发现磁盘主场景内容损坏。
继续实际点击两颗水果，配对消除后剩余12→10、进度16%，error 日志仍为空。
