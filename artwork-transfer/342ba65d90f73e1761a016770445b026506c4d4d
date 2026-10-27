# 3A 出院出狱道路闭包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 地雷/飞弹所需医院和监狱出口能真实移动并到达沿途卡片/运气/奖券格，不改已有普通出生路线。

**Architecture:** 扩展离线道路闭包的起始姿态，不修改运行时移动算法；重生成特殊落点目录。医院/监狱计时和UI由世界/控制器任务接入。

**Tech Stack:** 既有Node/TypeScript/Vitest。

**Spec:** phase-3a-cards-evidence.md的2026-09-16出口补正；原frame3 hospitaldate/jaildate，frame4 setfree_pg与送医位置赋值。

## Global Constraints

- 原8出生姿态仍闭合为308方向状态/146格，不篡改旧路径以适应新测试。
- 原hospitaldate=[2,19,1]、jaildate=[4,21,41]按方向/列/行解析；从原表读取，不手写新出口。释放时不再搬位置，下一步分别18,2和22,40。
- 加这2姿态后合并322方向状态/160格；新增14格包括2出口+12特殊格。完整特殊格38=4商店+6卡片+6运气+22奖券。新增ID[161,163,165,175,188,179,178,189,195,196,177,180,171,170]。
- 不修改GameState/setup/controller/property/card-effects/UI。原SWF与旧入口不改，无新依赖。

### Task 1: 扩展可达数据与移动回归

**Ownership/files:** Modify scripts/build-modern-rules.mjs, src/modern/data/rules.json, src/modern/data/events.json, tests/modern/turns.spec.ts, tests/modern/events.spec.ts. May modify scripts/build-modern-events.mjs only ifa146limitmustbeupdated. Don'teditcards/economy/property/UI or otheragentsdocs.

**Interfaces:** rules.json adds `reentryOrigins:{hospital:{direction:number;position:{column:number;row:number}};jail:{direction:number;position:{column:number;row:number}}}`; existingfields preserved. `roadCells` union160 sortedasbefore. Original normalclosuretestkeeps308/146, new10originclosuretest322/160. Existingstep automaticallyconsumesexpandedlist; only change runtimecodeifverifiednecessity andreportbeforebroadening.

- [ ] RED test actualstepfromhospital19,1/dir2→18,2(card165), jail21,41/dir4→22,40(luck175); completechainsuntiljoiningnormalroutes, no scenery/out-of-range. Newmetadata38specialexpected failingbeforegeneration.
- [ ] Extendgenerator sourceorigins, validatesourcevector/mapcells andbothnormal/expandedclosures. Rebuildrules thenevents. Keep initialFunds/spawnselection/junctions unchanged so2Bseed/normalmovementregressions remainmeaningful.
- [ ] Updateold“unreachable”eventassertions for newlyreachableIDs ratherthanretainingfalse exclusions. Keep actualplaceholder153/0,0/out-of-map rejection. Verifyall22ticketcells derivedprices10/30/50.
- [ ] Focusedturns/events suitesandtypecheck; recordRED/GREEN/counters plusregeneratorcommands. Don'trepeatfullsuiteuntilintegration.
- [ ] Commitownedfiles via/opt/homebrew/bin/git; private report inthisplanSDDfolder, noforceadd. Mainreview andfull3Acontinue.
