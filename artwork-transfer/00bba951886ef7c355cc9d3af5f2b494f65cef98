# 星猫大富翁 3B 金融与公司实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现代独立对局中交付可验收的 3B 银行、股票、公司与董事权闭环。

**Architecture:** 纯规则模块只接收权威 `GameState` 中的账本并返回新状态和明确流水；控制器处理命令、日期和续办；Vue 显示/提交选择；Pixi 只放原版公司建筑。所有状态须可结构化克隆并从同一快照恢复。

**Tech Stack:** TypeScript、Vue 3、Pixi 8、Vitest、Playwright、Vite。

**Spec:** `docs/superpowers/specs/2026-09-27-modern-3b-finance-design.md`

## Global Constraints

- 原版证据三文件及 `stock-negative-random-runtime.json` 优先于现有 `src/core/rules/bank.ts` 近似版。
- 3A 入口和资源恢复行为必须保持；不合并、推送或部署。
- 先 RED，再最小规则，再回归；每个可审查单元提交并更新 `docs/modernization/resume-3b.md`。

## Review Focus

- 原版负/零 `random` 上界：股票价格更新必须保持 0 结果及既有 RNG 消耗约定；任务 2 测试。
- 股票每日上限大于池值：只限制每日量，不擅自夹到池值；任务 3 测试。
- 月初重复恢复：公司分配、信用/贷款扣款、利息各仅一次；任务 2/4 测试。
- 人类周日关闭而 AI 银行照常运行：任务 4/5 测试。
- 交易完成后途中移动、标记、落地只处理一次：任务 5 测试。

---

### Task 1: 权威日期与金融初态

**Files:** Create `src/modern/features/game/finance-types.ts`, `finance-setup.ts`, `calendar.ts`；Modify `setup.ts`, `types.ts`, `ModernApp.vue`；Test `tests/modern/finance-setup.spec.ts`, `calendar.spec.ts`。

**Interfaces:** `createFinanceState(players): FinanceState`；`advanceCalendar(world): {world, crossedWeek, crossedMonth}`；`createGame(..., initialDate?)` 与旧调用兼容。年月日仅在 `world`，不另建金融日期。

- [x] 先写初始 16 行角色、出生公司/3000 股/2000 待认购、固定二月和跨年 RED 测试。
- [x] 运行定向 Vitest，确认因功能缺失而失败。
- [x] 加入最小权威状态与纯日期推进，不改变既有随机选人顺序。
- [x] 跑定向测试及类型检查，提交。

### Task 2: 股票价格与月结纯规则

**Files:** Create `src/modern/features/game/stock-prices.ts`, `bank-settlement.ts`；Test `tests/modern/stock-prices.spec.ts`, `bank-settlement.spec.ts`。

**Interfaces:** `advanceStockPrices(finance, cadence, rngState)` 返回 finance/RNG/价格流水；`settleMonth(game)` 返回一次性财务状态与分项流水。

- [x] 先写 S6、负上界、周/月/日 RNG 顺序、利润 3:2 分配、信用月还、贷款月还与最后 10% 利息 RED。
- [x] 确认 RED；实施源码取整和顺序；月结用年月键防重。
- [x] 定向 GREEN、类型检查，提交。

### Task 3: 股票交易与公司规则

**Files:** Create `src/modern/features/game/stock-trading.ts`, `company.ts`；Test `tests/modern/stock-trading.spec.ts`, `company.spec.ts`。

**Interfaces:** `buyStock/sellStock/subscribeCompany/chargeCompany/recalculateCeo` 接收明确玩家、公司、股数并返回新账本/资金及流水。

- [x] 先写 S1…S5、资金/持股边界、公共事业禁止交易所卖出、CEO 并列和公司费 RED。
- [x] 确认 RED；最小实现，不引入交易手续费或存款补买。
- [x] 定向 GREEN、类型检查，提交。

### Task 4: 银行命令与 AI

**Files:** Create `src/modern/features/game/bank-operations.ts`；Modify `controller.ts`, `interaction-types.ts`；Test `tests/modern/bank-operations.spec.ts`, `finance-controller.spec.ts`。

**Interfaces:** `applyBankOperation(game, playerId, operation, amount)` 返回新账本/流水或错误；`applyAiBankVisit(game, playerId)` 返回原版等级顺序结果；控制器公开 `bankOperation`。

- [x] 先写取/存/借/还/信用还款边界、AI 档位和周日分流 RED。
- [x] 确认 RED；实现银行纯规则、控制器单次提交与月结续办。
- [x] 定向 GREEN、控制器恢复/暂停测试与类型检查，提交。

### Task 5: 股市和公司途中交互

**Files:** Modify `controller.ts`, `interaction-types.ts`；Test `tests/modern/finance-controller.spec.ts`。

**Interfaces:** `tradeStock`, `subscribeCompany`, `leaveStock`, `leaveCompany`；`after-stock`/`after-company` 可序列化续办。

- [x] 先写自然地图 19 型股市、公司地点、AI 分支、剩余步数/标记只执行一次的 RED。
- [x] 确认 RED；接入真实途中/落地流程。资产查询的玩家面板显示由 Task 6 完成。
- [x] 定向 GREEN、现有交互控制器回归，提交。

### Task 6: Vue 面板与原版公司素材

**Files:** Modify `InteractionPanel.vue`, `GamePanel.vue`, `ModernApp.vue`, `MapScene.ts` 和必要素材 manifest；Create 导出脚本/公司素材；Test `tests/modern/finance-ui.spec.ts`, `tests/modern/company-assets.spec.ts`。

- [ ] 先写按钮禁用、成交额和资金符号、日期/月结展示及 12 张建筑透明边界测试 RED。
- [ ] 确认 RED；导出原版符号，使用源坐标和锚点；实现面板并由 UI 只发命令。
- [ ] 定向 GREEN、构建，提交。

### Task 7: 真实回放、审查与验收

**Files:** Add `tests/e2e/modern-finance.spec.ts`；Create `docs/modernization/acceptance-3b.md`；Update `resume-3b.md`。

- [ ] 生产构建浏览器自然开局，覆盖银行存取借还、股票买卖、公司认购/董事权与跨月结算；每条结果记录状态和截图。
- [ ] 整套 Vitest、typecheck、现代 build、相关 Playwright 及必要回归；修复每个 RED 后复跑相关测试。
- [ ] 核对原版差异、实际入口、提交/回退点和工作树；完成代码审查与复审；交付用户 3B 验收，不自行改写用户验收状态。
