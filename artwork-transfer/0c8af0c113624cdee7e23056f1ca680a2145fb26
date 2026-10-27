# 3A 直接卡牌结算 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 12种直接卡牌纯结算及动态地价兼容；完整3A还须五种世界卡、银行取得入口、全部控制器/界面与实机。

**Architecture:** 源网格元数据离线生成；不可变卡牌快照复用PlayerState/PropertyLedger；物业支持可选价格表。此任务不修改GameState/setup/controller/Vue。

**Tech Stack:** 现有Node/TypeScript/Vitest。

**Spec:** docs/superpowers/specs/2026-09-16-modern-direct-cards-design.md，phase-3a-cards-evidence.md及原usecard处理帧。

## Global Constraints

- 原SWF/入口/源表不改，不引入旧core或运行依赖，B-01以外不静默改规则。
- 所有12卡成功/失败/消耗必须可测试；不能用通用扣钱代替效果。世界五卡由后续模块处理，不声称本模块覆盖全部17卡。
- 玩家现金允许有限负数，存款/奖券语义保留；价格来自当前价格表；资产数量由产权/等级派生，不持久化原冗余计数。
- 原price_id在当前规则中固定1（B-03已知保留），购地卡不增加“总资金足够”判断。
- 原ordinal是builddate[id][3]，不是id本身。信用使用不消耗；目标失败不消耗。

### Task 1: 直接卡效果、网格元数据与价格兼容

**Ownership/files:** Create scripts/build-modern-card-board.mjs, src/modern/data/card-board.json, src/modern/features/game/direct-cards.ts, tests/modern/direct-cards.spec.ts. Modify property.ts and tests/modern/property.spec.ts only for dynamicprices/negativecashcompatibility. No shared game types/setup/controller/UI edits.

**Interfaces:**
- property.ts exports `PropertyPrices=Record<number,number>` and `createPropertyPrices():PropertyPrices` frommapbaseprices. EconomySnapshot optional `prices?:PropertyPrices`; getPropertyOffer/applyPropertyOffer useit; calculateStreetRent adds optional fourth pricesparameter, old3argument behaviorretained.
- `DirectCardSnapshot {players:PlayerState[];properties:PropertyLedger;prices:PropertyPrices;inventories:Record<number,number[]>;credit:Record<number,{used:number;available:number;score:number}>;forcedDice:Record<number,number|null>;stayPlayerIds:number[];unownedOwnerDeposit:number}`. This is independent transactioninput; laterGameState composesfields withoutduplicatingplayers/funds.
- `DirectCardChoice = {kind:'confirm'} | {kind:'dice';value:number} | {kind:'credit';amount:number} | {kind:'cell';position:GridPoint}`.
- `applyDirectCard(snapshot,playerId,inventoryIndex,choice):{snapshot:DirectCardSnapshot;cardId:number;consumed:boolean;status:'applied'|'invalid-target';reason:string|null;amount:number;affectedParcelIds:number[];affectedPlayerIds:number[];insolventPlayerIds:number[]}`. Unsupportedothercards/invalidinventoryindex throw; invalidvalid-card target/choice returnsunchangedvalues withreason andconsumedfalse. No callerprice.
- `getCardCell(position):{id:number;type:number;ordinal:number;parcelId:number|null}|undefined` reads generatedsourceboardrecords andmapgrid. `pickCardCell(scenePoint:ScenePoint)` implements exactgetpoint quadrantadjustment for source type0cells (originalusecardframe1), returnscell+position orundefined. Coordinatesinworldunits56×40, noDOM/camera.
- card-board.json contains sourcehash, source metadata perrecord (type,ordinal,streetId,facing), sourcegrid orimportmodernmapgridat runtime, parcelpairmapping, hospital/jail tuple metadata (no movementlogic), initialOwnerZeroDeposit100000. Generator verifiesoriginalhash, sourcecounts/coordinate correspondence; --output temp supported. Do not filtertargetboard to146roads: mouse targets and futurehospitalpaths requirefullsourcegrid.

**Exact effects:**
- 1: finiteamount0..available; cash+=amount, used+=amount, available-=amount; neverremovecreditcard (including0). Choicekindcredit.
- 5: integer1..6 to forcedDice[playerId], consume; noRNGinthisfunction. 27: setstayflagonce (repeatusecanwasteanothercard asoriginal), consume.
- 11: currentresidentialparcel, owner!=player (includesnull); pay=currentprice+(level+1)^2*100; fullcreditoldownerdeposit or unownedOwnerDeposit; payercashif>=pay else deposit-=pay-cash,cash=0; ownershipchanges,gradepreserved; nofundssufficiencycheck; consume.
- 14: currentresidentialstreet; fromCURRENTparcelprice compute floor(price*1.2/10)*10 then setallstreetparcelprices; consume. Noownerrequirement.
- 15/20: celltargetroadORpairedresidentialbuilding,grade>0, anyowner; reduceby1 orset0 respectively; consume. Do notmutatefictionalplayer0buildingcounts; existingderivedsummariesreflectactualledger.
- 18/19: currentresidentialstreet, allparcelsregardlessowner: +1cap5 / -1floor0. Unowned0→1withownernull. consume. Angelvisualcreationdoesnotaddasecondlevel.
- 25/26: targetcellordinalodd, otherplayerexactposition, actorcash<targetcash. Setactorcashtotargetcash / targetcashtoactorcash respectively; notaveragingortransferring, depositsunchanged; consume.
- 33: sameotherplayer/ordinaltarget, nowealthcomparison; amount=Math.trunc(targetcash/10), transferfromtargettoactor, even0ornegative sourceamount; consume.

- [x] WritefocusedRED beforeimplementation, literalfixturesforALL12effects+invalidtargets, selectedduplicatecardsremoval, credit0/repeatedremainingcreditnonconsumption,controlleddieinvalid,stayreuse, pricesafterinflationreflectedinpurchase/rent, negativecashcompatibility. Originalframe4/nativeB01sourcealreadyverified, don'trepeat.
- [x] Sourcecheck ambiguousbranches withexactusecard files; specificallyangel0→1, unownedpayment100000account, negativecashtax, oddordinalnotid. Recordany unresolvedsourceconflictbeforeguessing.
- [x] Implement minimalpurefunctions and generator. Testsuse realoriginalfixtures andindependentamounts, no mockcardengine. Verifyallinputsnotmutated,prices/ledger/economychangescoherent, insuffcreditandinvalidtargetnocharge, exhaustingfundsflag.
- [x] Focuseddirect/propertytests andtypecheck. No fullsuiteyet (integrationlater). Commitownedfiles via/opt/homebrew/bin/git, reportignoredinthisplanSDDfolder withRED/GREEN/contractdetails. Rootscopedreview andfull3Acontinues.
