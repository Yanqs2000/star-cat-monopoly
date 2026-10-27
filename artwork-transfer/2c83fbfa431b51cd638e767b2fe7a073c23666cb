# 3A 事件规则子模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 完成全部41运气事件和真实奖券格的纯规则，为完整3A卡牌/事件整合提供接口；不是把3A缩成此子模块。

**Architecture:** 离线原表导出带哈希的数据，纯不可变钱包结算，既有uint32随机源。控制器与UI留给统一整合任务，禁止提前宣称3A可玩或完成。

**Tech Stack:** 现有TypeScript/Node/Vitest，不增加依赖。

**Spec:** docs/superpowers/specs/2026-09-15-modern-events-design.md；docs/modernization/phase-3a-events-evidence.md；原路线图3A。

## Global Constraints

- 原版入口/SWF/原始证据不改，不依赖旧src/core，不增加运行依赖。保留已验收2C提交204ded9。
- 事件1..41完整，B-01事件28唯一有意金额差异+1000→-1000，有原字节码受控运行证据与回归。
- 类型1直接加现金，负金额等额增加两份失物招领余额；类型2直接加奖券；不动存款，不截断负现金或负奖券。结果带现金+存款<=0标记。
- 使用既有randomInt；只在抽取事件时消耗一次规则随机值，不在应用指定事件/显示/重试时抽取。
- 模块不管理UI确认和回合，不声称已经集成。全3A还须所有卡牌、商店、真实落地流程与浏览器验收。

### Task 1: 全事件目录、奖券格及纯结算

**Ownership/files:** Create scripts/build-modern-events.mjs, src/modern/data/events.json, src/modern/features/game/events.ts, tests/modern/events.spec.ts. No game types/controller/setup/property/UI changes. Private report only in this plan's SDD directory; never force-add it.

**Interfaces:**
- `EventWallet {cash:number;deposit:number;tickets:number}`; `LostAndFoundFunds = [number,number]`.
- `LuckEvent {id:number;kind:'cash'|'tickets';description:string;sourceAmount:number;amount:number;correction?:'B-01'}`.
- `SpecialLanding {id:number;position:GridPoint;kind:'shop'|'card'|'luck'|'tickets';ticketAmount?:number}`.
- `getLuckEvent(id:number):LuckEvent` rejects invalid IDs and returns a value safe from caller mutation of canonical catalog.
- `drawLuckEvent(rngState:number):{event:LuckEvent;rngState:number}` maps randomInt(state,41).value+1.
- `findSpecialLanding(position:GridPoint):SpecialLanding|undefined` includes only actual reachable grid cells of source types20/24/25/26 using modern rules road closure; verifies record coordinates against grid.
- `applyLuckEvent(wallet:EventWallet,eventId:number,funds:LostAndFoundFunds):{wallet:EventWallet;lostAndFoundFunds:LostAndFoundFunds;event:LuckEvent;insolvent:boolean}`.
- `applyTicketLanding(wallet:EventWallet,position:GridPoint):{wallet:EventWallet;amount:number}` rejects non-ticket cells.
- Generated JSON contains sourceSha256, events (41), landings; source event0 excluded. Generator reads original-tables.json and existing rules.json, verifies original SWF hash against existing manifest, supports --output for reproducibility without rewriting inputs. Preserve original source values, effective override only28.

- [x] Read exact source/end_pg25/end_pg26 and B-01 evidence. Write failing tests before implementation. For B-01 explicitly assert sourceAmount1000 versus effective-1000 and100000→99000 with lostFunds[1000,1000].
- [x] Cover all41 IDs against independent original rows, only28 allowed delta, event1 cash-500,11 cash+20000,21tickets+100,37tickets-100 with low tickets retainednegative; cash100 pays500→-400 (deposit2000 unchanged), loss funds both+500, input immutability, insolvency<=0, deterministic seed transitions and invalidinput.
- [x] Cover literal reachable ticket cells10/30/50, real special-grid matching, unreachable placeholders excluded; generator reproducibility and source hash. Read actual rules shape before using reachable list; don't infer coordinate orientation.
- [x] Implement minimally; no framework or new legacy compatibility layer. Record RED/GREEN exact commands/results. Run focused events tests and typecheck. Other files unchanged, don't repeat full suite yet; integration will run full once.
- [x] Commit only ownedfiles using /opt/homebrew/bin/git (systemgitcurrentlyXcodelicenseblocked). Write report interfaces/verification/commit for scoped review. Root continues full3A regardless this subplan completion.
