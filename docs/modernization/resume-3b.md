# 3B 续跑入口（先读本页）

status: active
objective: 完成整个 3B 金融与公司批次，而非只交付规则笔记或银行子模块。
workspace: `/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/modern-map-foundation`
branch: `feat/modern-map-foundation`
base: `629db6e`（3A 本地完成、验收记录仍待用户明确通过）

## 恢复时只做三步

1. `collaboration.list_agents`，再运行 `/opt/homebrew/bin/git status --short` 和 `/opt/homebrew/bin/git log -4 --oneline`。以实际句柄、工作树与提交为准；不要重复派活跃工作者或丢弃 WIP。
2. 读本页末尾的“已完成 / 下一步”，再只读相应的 3B 证据或实施计划。不要重新扫描 3A、重导出原素材或重跑已通过的 332 项旧测试。
3. 若额度再次中断，在本页更新实际 HEAD、未提交文件、运行中的进程或 session、最近一次 RED/GREEN、下一条精确命令；重新启动长进程前必须核对原句柄。

## 当前事实

- 用户已明确授权执行所给计划直到 3B 完成；这不等于用户已明确验收 3A。3A 验收记录：`docs/modernization/acceptance-3a.md`。原版 SWF 和 2C 回退点保留，不合并、推送或部署。
- 3B 全范围：原版金融取证；日期和月末顺序；银行存取、贷款、还款、信用月结及 AI；原版 12 家可交易公司股票及正确区分其他表行；公司建筑、股份与董事权；真实界面、浏览器回放、分项与整批审查、验收记录。
- 当前 3A 核心：`src/modern/features/game/{setup,types,controller,world-cards}.ts`，前端 `src/modern/ModernApp.vue`，现代构建仍在同一工作区。源脚本已跟踪于 `docs/modernization/evidence/source/play.swf/scripts/`，完整 JPEXS 输出在父仓库 `.analysis-cache/ffdec/play.swf/scripts/`。
- 系统 `/usr/bin/git`、`python3` 会触发 Xcode 许可；使用 `/opt/homebrew/bin/git` 和 `/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`。不要替用户接受许可，不使用额度重置点。

## 已完成 / 下一步（2026-09-27 09:14 Asia/Shanghai）

- 最近提交：`fd22db0`（银行业务、月结控制器和面板）、`bb4290d`（交易所/公司纯规则）；此前 `ae24af2`、`240cab4`、`2d20cde`、`07de84a`。本段 Task 5 自然股市/公司控制器 WIP 正在提交，以实际 `git log` 为准。银行和股票取证工作者均已完成，无须重派。三份源证据位于 `docs/modernization/phase-3b-{bank,stock,calendar-company}-evidence.md`，探针见 `evidence/stock-negative-random-runtime.json`。
- 已有规格和逐项计划：`docs/superpowers/specs/2026-09-27-modern-3b-finance-design.md` 与 `docs/superpowers/plans/2026-09-27-modern-3b-finance.md`。计划 Task 1…5 的规则/控制器 RED→GREEN 已完成；Task 6…7 未完成。目标是**整个 3B**，不能把控制器 API 当作最终可玩验收。
- 最新 RED/GREEN：Task 5 `finance-controller` 6 项 GREEN，连同既有 `interaction-controller` 共 63 项 GREEN，`vue-tsc --noEmit` 通过。股市自然途中入口、周日关闭、AI 跳过、公司自然落地/AI 最大认购/费用恢复均在这些测试内；停留卡起点误触发公司已由既有回归捕获并修正。整套单元、现代构建和生产浏览器尚未为 3B 运行。
- 原版预览 HTTP `http://127.0.0.1:4173/` 已验证 200，原 exec session 94102；如果要重跑原版探针，先检查该端口/句柄。现代预览 4184 状态未重新核对。未运行部署、推送、合并。
- **下一条工作：**读计划 Task 6、`InteractionPanel.vue`、`GamePanel.vue`、`ModernApp.vue` 和 `MapScene.ts`。先加 `tests/modern/finance-ui.spec.ts` 的股票/公司命令、成交额符号、CEO/贷款/日期显示 RED；实现股票/公司真实 Vue 入口和权威账本显示。随后从原 SWF 导出 12 个 `gufen` 建筑素材并保留原坐标/锚点，接入 Pixi，最后进入 Task 7 的现代生产构建真实浏览器回放与整批审查。
- 静态/动态差异：负/零 AVM1 `random` 已在 Ruffle 原语探针确认返回 0；自然价格流尚未逐项回放。固定二月 28 天与 `znmu` 反编译疑点均如证据所述；不能因静态拼写擅自改轮转。
