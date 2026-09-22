# 无用资源清理（2026-09-22）

删除28张旧界面图片及对应meta，图片源文件共 4986582 字节（约4.76 MiB）。实际构建包变化取决于合图和压缩，未重新构建测量。

已检查序列化UUID引用及代码/配置文件名称引用；通过Creator资产接口删除。保留首页用户调整的素材及用途待确认的地块图。

验证：validate-prefabs、test-shared-resources、test-app-init、test-result-impact、test-result-overlay 均通过。

## 删除清单

- assets/app-appinit/res/progress-fill.png
- assets/app-appinit/res/progress-track-soft.png
- assets/app-appinit/res/progress-track.png
- assets/app-appinit/res/tumble-match-logo.png
- assets/app-bundle/app-view/page/game/resources/textures/hud-actions/action-card.png
- assets/app-bundle/app-view/page/game/resources/textures/hud-actions/clear-icon.png
- assets/app-bundle/app-view/page/game/resources/textures/hud-actions/shake-card.png
- assets/app-bundle/app-view/pop/collection/resources/textures/confirm-button.png
- assets/app-bundle/app-view/pop/collection/resources/textures/equipped-check.png
- assets/app-bundle/app-view/pop/collection/resources/textures/item-card.png
- assets/app-bundle/app-view/pop/collection/resources/textures/status-strip.png
- assets/app-bundle/app-view/pop/collection/resources/textures/tab-normal.png
- assets/app-bundle/app-view/pop/collection/resources/textures/tab-selected.png
- assets/res-bundle/shared-ui/images/resources-redesign-button-blue.png
- assets/res-bundle/shared-ui/images/resources-redesign-button-decline.png
- assets/res-bundle/shared-ui/images/resources-redesign-button-green.png
- assets/res-bundle/shared-ui/images/resources-redesign-button-revive.png
- assets/res-bundle/shared-ui/images/resources-redesign-home-round.png
- assets/res-bundle/shared-ui/images/resources-redesign-icon-home.png
- assets/res-bundle/shared-ui/images/resources-redesign-icon-restart.png
- assets/res-bundle/shared-ui/images/resources-redesign-illustration-failed.png
- assets/res-bundle/shared-ui/images/resources-redesign-illustration-revive.png
- assets/res-bundle/shared-ui/images/resources-redesign-illustration-success.png
- assets/res-bundle/shared-ui/images/resources-redesign-progress-complete.png
- assets/res-bundle/shared-ui/images/resources-redesign-result-panel.png
- assets/res-bundle/shared-ui/images/resources-redesign-title-level-complete.png
- assets/res-bundle/shared-ui/images/resources-redesign-title-level-failed.png
- assets/res-bundle/shared-ui/images/resources-redesign-title-one-more-chance.png
