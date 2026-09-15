# 3A 卡目录与商店规则 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 原卡资料、16池、开局背包、卡片格和奖券商店的独立纯规则；完整3A仍须卡效果与真实界面。

**Architecture:** 原表离线导出JSON；不可变卡ID背包与显式商店库存；使用已有randomInt。之后统一接入控制器，不直接修改Vue或GameState。

**Tech Stack:** 现有Node/TypeScript/Vitest，不增加依赖。

**Spec:** docs/superpowers/specs/2026-09-15-modern-card-economy-design.md；docs/modernization/phase-3a-events-evidence.md。

## Global Constraints

- 原SWF/旧入口/原表不改；无旧core依赖；不要把37个定义全当普通池。
- 普通池严格为[5,6,7,9,11,14,15,18,19,20,21,22,25,26,27,33]，初始背包[9,6,7,27,5]，容量24。
- 固定商店槽[5,6,7,5,9,6]加6次普通池独立抽样；买卖以奖券支付/返还原卡价；售空槽不可再次购买，失败不改变状态。
- 有效已有余额允许负奖券，不能擅自归零；价格从目录读，不接受UI报价。
- 卡效果、卡获得新入口、AI策略、控制器与UI不在此子任务，完整3A范围不缩减。

### Task 1: 卡目录、背包与商店纯模块

**Ownership/files:** Create scripts/build-modern-cards.mjs, src/modern/data/cards.json, src/modern/features/game/card-economy.ts, tests/modern/card-economy.spec.ts. No other production files; private report ignored.

**Interfaces:**
- `CardDefinition {id:number;name:string;price:number;useType:number;handlerFrame:number;description:string}`.
- `getCardDefinition(id:number):CardDefinition`; `getOrdinaryCardIds():number[]`; `createCardInventory():number[]` fresh values, definitions read-safe from caller mutation.
- `drawCard(inventory:readonly number[],rngState:number):{inventory:number[];rngState:number;cardId:number;kind:'received'|'full'}`; full24 returns lastcard and unchangedrng; not full consumesone randomInt(...,16).
- `ShopState {stock:(number|null)[]}` exactly12slots.
- `createCardShop(rngState:number):{shop:ShopState;rngState:number}` consumes6randomdraws; don't deduplicate cards.
- `buyShopCard(inventory:readonly number[],tickets:number,shop:ShopState,slot:number):{inventory:number[];tickets:number;shop:ShopState;kind:'bought'|'sold-out'|'insufficient-tickets'|'inventory-full';cardId:number|null;amount:number}`. Failedamount0; successamountcardprice. Return newvalues no inputmutation. For both constraints original checks tickets first, then capacity.
- `sellInventoryCard(inventory:readonly number[],tickets:number,index:number):{inventory:number[];tickets:number;cardId:number;amount:number}` preservesorder; rejectsinvalidindex; supports duplicatecardIDs as separate slots.
- GeneratedJSON holds sourceSha256, definitions37, ordinaryPool16, initialInventory. Generator verifies sourcehash and derives fromactualsourcefields/countencodedpcarddate; supports --output to temp; do not rewriteoriginaltables or duplicate rules module.

- [ ] Read exact original table/pcarddate/outcard/shopz evidence; writeRED beforeimplementation. Ordinarypoolliteral assertion independentfromgenerator, initialfive exactorder,37definitionsmetadata notopeningcards.
- [ ] Test deterministicfixedRNG fixture, fullhand24 noRNGadvance/nooverwrite,24capacity,invalidIDs/indexes; source prices(literal控骰30/地雷25/飞弹100), sameprice resale, inputimmutability.
- [ ] Test12slotshape andfixedfirst6, generatedrandomduplicatesallowed, buy deducttickets andnullslot, repeatedsoldslotunchanged, cashirrelevant(no cashargument), insufficientincludingnegative tickets, fullinventory, independentcopies, no priceparameter, sellfirst/middle/duplicateindex order.
- [ ] Implementminimalmodule; run focusedGREEN and typecheck. Record exactRED/GREEN. Don't run fullproject yet; integration owns eventualsuite.
- [ ] Commitownedfiles using /opt/homebrew/bin/git; private report in this plan's SDD directory; main performsreview andcontinues full3A.
