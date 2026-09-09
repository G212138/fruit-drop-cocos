# 多语言接入

默认 `system`，优先读取 Creator 的 `sys.languageCode`，缺省读取 `sys.language`。
首批语言为英语 en、日语 ja、印尼语 id、泰语 th、越南语 vi、马来语 ms、Filipino fil、简体中文 zh。
兼容 `in` → `id`、`tl` → `fil`，未支持语言回退英语。

语言偏好独立保存到 `tumble-match.language.v1`，不会改变原有音乐、音效和震动存档。
设置内可以选择语言或恢复跟随系统，切换立即广播给当前可见标签。
存储失败仍在当前会话生效，并显示真实错误提示。

代码分工：LanguageCatalog 管理词表与解析；GameLanguage 管理偏好和事件；LocalizedLabel 刷新预制体已有文字；LanguagePicker 管理设置内已有选项。
新增界面静态文字使用 LocalizedLabel，动态文字使用 GameLanguage.text(key, values)，不要拼接语序。
选项使用各语言自称，文本使用系统字体、充足行高和 SHRINK，需在 Google/TikTok 真机包检查字体覆盖。

已接入：首页入口、首页及游戏设置、语言选择器、关卡序号、剩余标题、主题名称与使用状态、主题切换按钮、结算下一关/重开/复活/返回按钮及解锁标题。

仍需逐项迁移：原版骨骼动画中的中文、道具图标及洞口图片烘焙文字、复活提示图片、解锁甜品的具体名称、动态玩法/广告/异常提示和开发关卡编辑器文本。当前不是全游戏文案翻译完成版；后续接入同一词表，不另建语言系统。

验证：test-language.cjs 覆盖八语言词表、区域码/别名、回退、偏好持久化、监听解除、存储失败；首页预热、设置生命周期和预制体引用检查通过。浏览器实测泰语切换、刷新保留、恢复系统语言，无运行错误。
TypeScript 检查本次 assets 代码无新增诊断；框架 extensions 中原有类型错误不在本阶段修改。

编辑器制作脚本 tools/localization-authoring.ts 仅临时复制到 assets 执行，不能打入发布包或挂载到交付预制体。
