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

## 已完成 / 下一步（2026-09-27 17:13 Asia/Shanghai）

- 最近提交：`78877c3`（金融面板/原版公司图片）、`37f4818`（自然股市/公司控制器）、`fd22db0`（银行与月结）、`bb4290d`（交易/公司规则）；此前 `ae24af2`、`240cab4`、`2d20cde`、`07de84a`。本段 Task 7 新生产回放和额度差值修复 WIP 即将提交，以实际 `git log` 为准。银行和股票取证工作者均已完成，无须重派。
- 已有规格和逐项计划：`docs/superpowers/specs/2026-09-27-modern-3b-finance-design.md` 与 `docs/superpowers/plans/2026-09-27-modern-3b-finance.md`。计划 Task 1…6 均已定向 RED→GREEN；Task 7 的生产浏览器完整金融回放、全量检查、审查与验收记录未完成。目标是**整个 3B**，不能把局部截图当作最终验收。
- 最新验证：`npm test` **366/366**，`npm run build:modern` 771 模块通过；生产预览 4184 的 `modern-turns.spec.ts` 5 项通过。新 `modern-finance.spec.ts` 分别以生产构建自然开局跑通 seed8 银行存取/借还/授信、seed5 股市买卖、seed16 电力公司认购/董事权、四真人跨月月结共 4 项；截图在 `.analysis-cache/acceptance-3b/`。seed1 全图截图确认四处原版公司建筑。
- 已运行旧 3A `seed153` 长路线回放并**失败**于第 2 轮地块83预期：实际第 3 轮玩家位置32,28，旧脚本按固定旧 RNG 路线等不到地产格。旧 `modern-property.spec.ts` seed235 也在第2轮地块81预期失败。新增 AI 银行和每日股票 RNG 改变掷骰序列；旧用例需按新实际路线改写，保留真正的地产/卡牌回归。`modern-fixtures.spec.ts` 用生产预览运行的 6 个 404 **不是产品失败**：fixture 页面只由开发服务器提供，后续在默认 5184 dev 环境重跑。
- 银行首轮生产回放曾暴露信用申请通知显示 `credit-granted` 和“账户无变化”；已 RED→修复为中文结果、`creditAvailableDelta` 等真实额度变化，并在相同 seed8 生产构建回放复测通过。`bank-operations/bank-settlement/finance-ui` 12 项定向 GREEN。
- 原版预览 HTTP `http://127.0.0.1:4173/` 此前验证 200，原 exec session 94102；现代生产预览 `http://127.0.0.1:4184/modern.html` exec session **29812** 已用于上述 Playwright。恢复时先检查进程/HTTP，勿仅因工具超时重启。未运行部署、推送、合并。
- **下一条工作：**先把旧固定 RNG 路线测试重写为有意义的稳定场景：`tests/e2e/modern-interactions.spec.ts:202-275,354-390` 与 `modern-property.spec.ts:39-86`，旧失败上下文位于 `/tmp/starcat-modern-e2e/`。新 `modern-finance.spec.ts` 已承担银行/股市/公司/月结生产验收。可先运行除旧失败外其余生产测试定位其他路径漂移；fixture 用默认 dev 服务器 5184 独立跑。随后完整 Playwright、审查/修复/复审、写 `acceptance-3b.md`，按全目标核对后才请用户验收。
- 静态/动态差异：负/零 AVM1 `random` 已在 Ruffle 原语探针确认返回 0；自然价格流尚未逐项回放。固定二月 28 天与 `znmu` 反编译疑点均如证据所述；不能因静态拼写擅自改轮转。
