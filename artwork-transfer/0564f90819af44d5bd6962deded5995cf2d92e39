# 星猫大富翁 5C 整体画面与分支合并实施计划

> 使用原生执行方式完成以下任务，工程通过后按用户授权合并到 main；工程记录不代替用户美术验收。

**Goal:** 完成桌面1080p窗口、全屏工具栏、高清文字与完整美术覆盖记录，并验证后合并分支。

**Architecture:** 继续使用唯一 GameState 和当前 Vue/Pixi 渲染层；布局、全屏工具栏与画质只影响展示。保留800×600逻辑画布，以4:3比例适配可用空间，现有资源失败/暂停机制继续工作。

**Tech Stack:** Vue、TypeScript、PixiJS、Playwright、Python标准库。依据 `docs/modernization/roadmap.md` 第5C行与5A/5B验收记录。

## 约束与重点

- 桌面网页、单机；不新增部署、手机适配或游戏规则。
- 保留原/高清开关、同一控制器/RNG、原帧数/锚点/遮挡与4:3逻辑画面。
- 地图与嵌入位图的源细节限制须逐项记录，不以像素倍率宣称所有美术新增细节。
- 全屏切换、缩放、工具栏操作和打开存档菜单不得触发额外回合；失败/取消后恢复原暂停状态。
- 保留主工作区未提交文件；main在现有隔离工作树中集成，合并后验证。

## Task 1：桌面布局与全屏

- [x] 在 `tests/e2e/modern-display.spec.ts` 先复现1080p页面溢出、4:3画布与全屏工具栏缺失。
- [x] 修改 `ModernApp.vue`：独立的stage-content与4:3 board-area；可用高度由flex分配；通过Teleport把同一工具栏与存档面板放入全屏区域。
- [x] 修改 GamePanel/InteractionPanel/PropertyPanel/EndgamePanel样式：统一sidebar宽度与清晰字号，活动与结果面板限制在可用画面内；保留原热点和素材锚点。
- [x] 浏览器验证1920×1080、1366×768、DPR1/2，窗口/全屏/Escape/存档关闭/画质切换及暂停状态一致。

## Task 2：完整资源覆盖与文字

- [x] 新增 `scripts/report-modern-art-coverage.py`，逐项枚举原图→高清图、来源、方法、尺寸、细节限制，生成 `evidence/phase-5c/art-coverage.csv` 和Markdown汇总。
- [x] 增加可复跑的 `--check` 门禁；所有15,849路径纳入清单，地图/静态公司框和内嵌位图限制明确列出。
- [x] 动态DOM/SVG文字沿用矢量字体；Pixi文字保持随渲染DPR生成；审查选人、手牌、交易、小游戏、结果和存档文字可读性。

## Task 3：检查与交付

- [x] 定向复跑5C桌面/全屏测试、5A/5B画质恢复与完整状态差分、地图标记及金融/小游戏关键回放；记录console/page/HTTP错误和截图。
- [x] 全量单测、类型检查、快照Schema、资源/覆盖门禁和生产构建通过；形成acceptance-5c.md、resume-5c.md。
- [x] 独立复审并定向修复；提交且工作树干净。
- [x] main合并前核对分支祖先与主工作区；在现有隔离工作树切到main并快进合并，检查main最终构建/测试，保留回退点和本地资源包。未经另行授权不部署。

完成记录：工程提交 `754224b`；main与feature快进后文件树完全相同。合并后类型/Schema/覆盖门禁通过，最终构建、627项单测与生产回放复用该同一文件树证据。交付与后续见 `docs/modernization/acceptance-5c.md` 和 `resume-5c.md`。
