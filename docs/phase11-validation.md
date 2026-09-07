# 原版设置面板与音频开关

原版 Pause.js 与 GameSc.openPauseUI 只打开设置面板，没有暂停物理或游戏计时。本阶段保留该行为，遮罩阻止点击穿透；不把名称 Pause 误解为全局暂停。

新增 GamePreferences 纯模型、GameSettings 会话设置、XForge 自动注册的 SettingsController。页面使用框架注册实例，未手写 executor.ts；该文件变更由 Creator 自动生成。三项默认开启，独立存储在 fruit-drop.preferences.v1；坏档恢复默认并提示，保存失败保留当前会话选择并提示。

通过 Creator MCP 制作 SettingsPanel、SettingsMusicRow、SettingsSoundRow、SettingsVibrateRow 四个预制体，所有 UI 节点和事件均在编辑器生成。设置行使用共同 SettingsToggleView 组件，按用途命名三个预制体变体。原版三行位置和图片见 source-settings.json；主面板 627×621 设计像素，内容 y=150，黑色遮罩透明度120/255；0.3秒 backOut 弹出、0.3秒 backIn 淡出。HUD 设置入口暂用文字按钮，完整原版 HUD 仍待迁移。

复制源 music.mp3 并通过 XForge SoundManager 循环播放；音乐与音效开关独立。碎冰独立 AudioSource 读取相同音效设置。退出时停止音乐并防止迟到加载重新播放。震动仅保存偏好，当前版本未执行平台震动，界面明确说明。

实测：第2关打开面板，三项从开分别改为关，Creator刷新后关闭状态仍在；重新开始仍进入第2关且保留开关；继续返回棋盘；测试结束恢复三项开启。初次实测发现嵌套行位置重叠，已改为普通布局容器承载各行；重开时父组件晚于子节点销毁导致事件系统已释放，已将监听解除移到停用阶段并回归。

最终确认设置面板返回主页成功，修复后重开、继续和返回均无新增错误；日志最后错误仍是修复前的 2026-09-07 19:49:20 UTC。

测试：test-preferences 覆盖默认、独立切换、关闭持久化、存档隔离、坏档与写入失败；test-settings-audio 覆盖实际控制器调用和实际碎冰音效门禁；test-settings-lifecycle 覆盖重复启停、关闭去重及子节点先销毁。45个预制体引用有效，assets业务代码无TypeScript诊断，完整工程既有扩展诊断仍保留。

边界：声音已通过调用级测试和预览无加载错误验证，未进行录音或真人听感验收；平台震动、新手引导、主题、道具、复活和IAA仍未完成。试玩设置入口的返回/重开、音乐在后台切换时的行为、设置期间发生结算、多设备布局还需回归。此模块不是整项目完成。
