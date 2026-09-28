# 星猫大富翁3C实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** 完成整个3C普通NPC、特殊地点与两个真实小游戏，统一交付验收。
**Architecture:** 复用唯一GameState、原续办和私有画面生命周期；规则纯数据，控制器命令/时序，Vue/Pixi原图交互。
**Tech Stack:** TypeScript/Vue/Pixi/Vitest/Playwright。
**Spec:** docs/superpowers/specs/2026-09-28-modern-3c-activities-design.md

## Global Constraints

- 基线6c2238c，当前隔离分支；不推送/合并/部署。用户执行指令覆盖计划末尾仅规划的旧措辞；不自动登记3A/3B验收。
- 源文件play.swf SHA 790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba。每模块不确定动态项先取证，不凭直觉改平衡。
- 本会话实施，按RED→GREEN推进；模块完成后继续，最后统一独立复审。续跑文件保存当前HEAD/WIP/句柄/下一步。

## Review Focus

- NPC返回同格不能再次遭遇，重新放置排除玩家/现有标记；Task2。
- 两条招领镜像不可相加；实际现金/券增减不能混用源金额；Task2。
- 法院座次+1和整轮日期扣天兼容；转移不触发第二次地点；Task3。
- 半场小游戏资产失败/暂停时无后台推进，不能再抽骰/重复入账；Task4/5。
- 原素材及键鼠监听不泄漏到普通掷骰，显示刷新/2倍速不改变小游戏结果；Task4/5。

### Task 1: 原版取证与素材入口表

**Files:** docs/modernization/phase-3c-activities-evidence.md；原版probe/素材导出脚本与证据。
**Interfaces:** 源入口表、字段语义、静态推导输入/输出及动态探针结果供Task2…5使用。
- [x] 核对NPC/地点/AI源分支和素材符号、源几何/时间轴；记录未知项并在所属实现前探针验证。
- [x] 不可达定义登记；源输入/预期完整可复现，源码/动态/推导分层。
- [x] 源哈希和证据检查，提交。

### Task 2: NPC、奖券兑换与招领闭环

**Files:** npc-encounters.ts、activity-types.ts、ticket-exchange.ts；world-cards/controller/interaction-types/原图Vue面板；npc-encounters/ticket-exchange/activity-controller/activity-ui测试。
**Interfaces:** resolveWorldCell返回普通NPC结果；finishNpcEncounter完成帐篷后的迁移；exchangeTickets/claimLostFunds返回状态、receipt、error；控制器exchangeTickets(amount)、leaveExchange()。
- [x] 写六NPC、30/31券、3/4卡、3000/3001现金、支付/招领镜像/唯一重新放置RED，运行确认失败。
- [x] 最小纯规则GREEN，再接控制器续办和AI空分支；写重复/取消/恢复RED并实现。
- [x] 原trait/witch/lottery图面与fog/car2动画、实际选择输入；素材错误走原恢复。
- [x] 定向/整套规则、类型及自然入口回放；提交并记checkpoint。

### Task 3: 魔法门与法院转运

**Files:** portal.ts/court.ts；控制器和原素材场景/面板；对应规则/时序/UI测试。
**Interfaces:** portal destination与court target/case命令；GameInteraction保存转移/判决阶段，复用WorldPlayerStatus。
- [x] 源四站/放弃/当前站、AI抽签、法院无目标/阈值/目标先后刑期RED→GREEN。
- [x] 飞行/镜头/car1原图和时序；已提交转移资源失败恢复只重放视觉，不再地点判定。
- [x] 人类与AI真实入口回放、状态到期/释放/神灵回归，定向/整套验证后提交。

### Task 4: 彩票投注

**Files:** ludo.ts及纯数据运行状态；原投注板/筹码/骰子UI；ludo/activity-controller/UI测试。
**Interfaces:** placeWager(cellId)、confirmWagers()；阶段/剩余筹码/投注/骰子/结果为序列化interaction。
- [ ] 动态确认低券、未投筹码和原骰子抽样/赔付时序；锁定手算测试样例。
- [ ] 数量/区域/三骰/输赢/AI RED→GREEN；命令重复/恢复边界RED→GREEN。
- [ ] 原素材真实投注、摇骰和结果；暂停/2倍速/资源失败生产回放；验证提交。

### Task 5: 游乐场

**Files:** carnival.ts和固定步长逻辑；Pixi接物场景/输入生命周期；carnival/时钟/控制器测试。
**Interfaces:** setCarnivalInput(input)、固定30Hz推进；20秒、落物/角色/生成/计分/AI/待结算interaction完整可恢复。
- [ ] 原碰撞及同时刻timer/frame顺序探针；导出12角色boy、落物和背景原素材。
- [ ] 固定时间表/分数/边界/AI、30/60/120刷新一致RED→GREEN。
- [ ] 原键鼠操作和20秒场次；冻结/恢复/退出键鼠监听、半场/已结算404 RED→GREEN及生产回放。
- [ ] 定向/整套规则与构建，提交并记checkpoint。

### Task 6: 联合审查与整批验收

**Files:** tests/e2e/modern-activities.spec.ts；docs/modernization/acceptance-3c.md、resume-3c.md。
- [ ] NPC→地产、法院/医院→后续回合、小游戏→日期/月结等组合及3A/3B相关回归。
- [ ] 整套单测/类型/构建、全部新增自然入口回放与必要夹具；独立全批审查、重要问题RED修复及相关复测。
- [ ] 源差异/证据/提交/回退点和干净工作树核对，呈交用户验收。
