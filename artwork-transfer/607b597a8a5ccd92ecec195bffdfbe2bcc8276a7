# 2C 买地收租 Implementation Plan

实施状态（2026-09-15）：三个任务的本地实现及技术验证已完成，首次全阶段审查未发现 Critical/Important，提出的两项 Minor 已做局部修复并记录于 `docs/modernization/acceptance-2c.md`；待主任务复审和用户验收，不进入 3A。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 原住宅地的购买、升级、同街道租金与资产显示接入已验收回合场景。

**Architecture:** 独立不可变财产模块计算交易，现有控制器管理落地/确认/结果/换人阶段。Pixi使用离线提取的原版地块牌和房屋静态等级，不在渲染循环结算。

**Tech Stack:** 现有Vue/TypeScript/Pixi/Vitest/Playwright；离线JPEXS26.2.1、Java、Python/Pillow。

**Spec:** docs/modernization/roadmap.md 的2C及 docs/modernization/phase-2c-evidence.md。

## Global Constraints

- 仅本地2C；用户验收通过前不开始3A。保留原版入口/SWF、已验收回退点和独立工作区，不合并/推送/部署。
- 不依赖旧src/core、不在现代浏览器加载SWF/Ruffle，不增加运行依赖。
- 买地/升级只用现金；普通租金先现金后存款，地主收存款；同地主同街道累计，等级0..5系数0.4/0.8/1.5/3/6/10。
- 升级成本100*(等级+1)，最高5；不实现神灵/卡牌/特殊地、完整破产、金融、日期、存档。
- AI默认确认普通购买/升级，再执行相同现金校验；不得新增AI经济阈值。
- 每次落地只结算一次；暂停/变速/重开不重复收费。资金耗尽后明确停止在待破产边界。
- 保留2B选人/移动/全屏/暂停/错误重试能力；UI显示实际产权和资金，不能用隐藏测试状态冒充实际结果。
- 所有新规则先RED再GREEN。Browser skill不可用，使用项目Playwright+现有Chrome。已有相同代码的有效验证不重复跑。

### Task 1: 纯财产交易与租金计算

**Ownership/files:** Create src/modern/features/game/property.ts and tests/modern/property.spec.ts. No changes to existing GameState/controller/UI in this task; existing2B continues to compile and pass.

**Interfaces:**
- `PropertyState {ownerId:number|null; level:0|1|2|3|4|5}`; `PropertyLedger = Record<number,PropertyState>`.
- `EconomySnapshot {players:PlayerState[]; properties:PropertyLedger}` using existingPlayerState.
- `PropertyOffer {kind:'purchase'|'upgrade'|'rent'|'max-level'; parcelId:number; amount:number; ownerId:number|null}`.
- `PropertyEvent {kind:'purchased'|'upgraded'|'rent-paid'|'declined'|'insufficient-cash'|'max-level'; playerId:number; parcelId:number; amount:number; recipientId?:number; level?:number}`.
- `createPropertyLedger():PropertyLedger` initializes all56 mapped residential parcels, ownernull/level0.
- `findParcelAt(point:GridPoint):Parcel|undefined` only residential road positions, not building pairs/special sites.
- `getPropertyOffer(snapshot:EconomySnapshot,playerId:number,parcelId:number):PropertyOffer` computes current cost/action; invalidplayer/parcel/ledger state rejects.
- `calculateStreetRent(properties:PropertyLedger,ownerId:number,streetId:number):number` sums only matchingownedparcels. Source coefficients can be expressed as integer tenths `[4,8,15,30,60,100]` dividedby10; no arbitrary rounding.
- `applyPropertyOffer(snapshot:EconomySnapshot,playerId:number,parcelId:number,choice:'accept'|'decline'):{players:PlayerState[];properties:PropertyLedger;event:PropertyEvent;insolvent:boolean}`. Recompute offer internally, not caller-suppliedprice. Purchasepreservesexistinggrade; upgrade+1; declineonlybuy/upgrade; rentcan'tdecline. Rent transfer may makenegativedeposit; flag cash+deposit<=0. No mutation of inputs.
- `getPropertySummary(properties:PropertyLedger,playerId:number):{landCount:number;buildingCount:number}`; buildings countgrades>0, no inventednetworth.

- [x] Write focused failing specs with literal mapfixtures1/3same street,9differentstreet; derive prices from evidence before fixing literals.

```ts
const properties=createPropertyLedger()
properties[1]={ownerId:1,level:0};properties[3]={ownerId:1,level:1}
expect(calculateStreetRent(properties,1,1)).toBe(1800)
```

- [x] CaptureRED before implementation. Cover1500buy (100000→98500cash,depositunchanged), decline, cash1499/deposit100000reject, upgrade0→1cost100 and4→5cost500, grade5nocharge, differentowner/street exclusion, cash100+deposit2000 pays1800→cash0/deposit300 and landlorddeposit+1800, exhaustedfundsnegativebalance+conservation, inputimmutability, ownedparceloffersupgradeinstead ofpurchase, sourcepositionlookup. Testbusinessresults, not constants alone. Genericapply executes currentoffer; duplicate UI commands are phase-gated inTask3, not by addingtransactionhistory tothismodule.
- [x] Implement the pure module using src/modern/data/map.json as parcel catalog; no general economy framework or speculative fields.
- [x] Run focused GREEN, then unit suite/typecheck once. Commit owned files and report exact interfaces/RED/GREEN at this plan's SDD task report.

### Task 2: 原版地块牌与房屋等级素材

**Ownership/files:** Create scripts/export-property-assets.py, scripts/ExportPropertyAssets.java, public/modern/assets/properties/manifest.json and PNGs, src/modern/features/map/property-assets.ts, tests/modern/property-assets.spec.ts. Do not modify Task1 or UI.

**Interfaces:** `PropertyAssetManifest {version:1;sourceSha256:string;sellSigns:Array<{facing:1|2|3|4;url:string;offsetX:number;offsetY:number}>;houses:Array<{ownerId:1|2|3|4;facing:1|2|3|4;level:0|1|2|3|4|5;url:string;offsetX:number;offsetY:number}>}`; runtime `parsePropertyAssets(unknown):PropertyAssetManifest` validates full4sign/96house unique coverage, source hash/stringpaths and finiteoffsets. Runtime uses PNG/JSON only.

- [x] Write failing real-file/parser specs for 4signs+96owner/direction/grade variants, existingplay.swf hash, RGBA PNGs and duplicate/missingvariants. CaptureRED.
- [x] Inspect actualsymbol839 brand and3401 house, including namedchildland (inventory lists3147). Source selectedhouseframe is `(facing-1)*10+level+1`, ownerlandframe1..4. Use JPEXS API on an in-memory/offlinecopy to freeze land at the correctownerframe before rendering eachhouse variant; do not let childplayhead cyclewithgrade. Inspect actualtimeline layers/transforms instead of guessing ownershipcolors. Java API may be inspected viajavap; originalSWFneverrewritten.
- [x] Export originalnativeRGBA, with offsetsfromsymbolboundsmin/20 at attachMovie origin (no star-character roottranslation). Keep exporter/tool/hash metadata. Export signs4directions and housesallgrades/owners. Verifyownercolor ongrade0 andgeometry/alphaforallframes. No AI-image edits.
- [x] Use existingverifiedjar `/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.analysis-tools/ffdec-26.2.1/ffdec.jar`, Java `/opt/homebrew/opt/openjdk/bin/java`, Python/Pillow `/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`. Keep scratchfiles underignored.analysis-cache, notpublic.
- [x] Run GREEN and a contact-sheet visualcheck showing4owners and6grades withdirectioncoverage; report exactsourceframes/bounds. Commitownedfiles. Don't claim constructioneffect/idle/fullartimplemented.

### Task 3: 交易阶段、AI与可操作地产界面

**Ownership/files:** Modify src/modern/features/game/{types,setup,controller}.ts, src/modern/{ModernApp.vue,features/game/GamePanel.vue,features/map/MapScene.ts}; may create PropertyPanel.vue for focused dialogs. Tests: tests/modern/{game-controller,property-ui}.spec.ts and tests/e2e/modern-property.spec.ts; adapt existingmodern-turns tests for legitimatehumanpropertydecisions without droppingpause/route assertions. Docs: acceptance-2c.md,README,completedplan.

**Interfaces and behavior:**
- Extend GameState with properties:PropertyLedger, propertyOffer:PropertyOffer|null, lastPropertyEvent:PropertyEvent|null. Extend phases with property-decision/property-result/insolvent; existinglow-levelmovement APIs remain pure. Initialledger is freshlycreated pergame.
- Onfinalarrival, controller calls findParcelAt/getPropertyOffer before schedulingnextturn. Nonpropertycells followexistinglanded→nextturn. Forbuy/upgrade/rent, presentoffer; humanexplicitaccept/declinewhereallowed; AIacceptautomaticallyafterexistingdelay. Maxgrade producesnocharge notice andcontinues. Controller exposes `decideProperty(choice):boolean` and `acknowledgeProperty():boolean`, rejectswrongphase/paused/disposed/doubleinputs. UI passes no prices.
- applyPropertyOffer result commitsfunds+property+event atomically. Human resultnoticewaitsforacknowledgement, AI acknowledgesautomatically; thencontinuepreviouslanded→nextturn. Ifcash+deposit<=0 afterrent, acknowledgementgoesinsolventandstopstimers withclear2Cboundarymessage/return-to-selection, no fakebankruptcycompletion.
- Clearoldpropertyevent onnewroll, keeptransactionlog forvisibleverification. Pausingatdialog/AIdecision andreturningselectioncancelsalloldpendingwork. RestorefailedtexturesretainsentirependingGameState as2B.
- PropertyPanel insidefullscreenstage: location/owner/level/cost, cashanddeposit, Buy/Upgrade/Decline orrequiredRentpayment; resultshowsactualamounts/changedbalances. Renthasnocanceloption. No silentcashfallbackforpurchases. ArrowLeftconfirm/ArrowRightdeclineonlyallowedchoice, ↑rollonlyawaiting-roll; respectformfocus.
- GamePanel showscash/deposit andland/buildingcounts, propertylistwithlevels; distinguishcurrentvspriortransaction. No misleadingnetassetestimate.
- MapScene loadspropertymanifest+PNGs privately, placesunownedbrandorownedhouseatParcel.buildingCell plusnativeoffset. Sharedentitydepth sortspropertyspritesandactors bysource row/columnorder; showownerandgrade clearly. Updateonstatechange, notnewtexturesperframe; noGLrules. Staticgradechangeonly, constructionFXnotin2C.

- [x] Write RED controller tests withliteralvalidfixtures: landingbuywaitsbeforeturnadvance; purchase/decline/insufficient; rentcash/depositbothsides; upgrade/max; AIpurchaseandupgrade; repeatedclickonlyonecharge; pause/restartolddecisioncannotmutatenewgame; exhaustedfundsstop. Existingtimer tests mayuse nonpropertylandingfixtures to retaintheiroriginalpurpose.
- [x] Write actualVuecomponent tests ifneeded fordecision/resultaffordances, usingrealcomponentandcorestates. No mockedpropertypanel orproductiondebug globals. BrowserflowmustactuallybuyonehumanparcelandobserveAItransactioninround; showcurrentfunds/ownership/buildingchange. Separateunitfixtureproof fromactualbrowserproof inreport.
- [x] Implement minimalcontroller/renderer/UI and preserveexisting2Bscene-inspection access onlyfromselection. CaptureGREEN afterRED.
- [x] VerifyinrealChrome1440×1000 and1920×1080fullscreen: select→roll→buy/decline→result→AI→human, money/landcounts/PNGchanges, pause/errorretry. Usefixedcrypto seed atPlaywrightboundary ifneededforreproducibility; nofixed-die playUI orhiddenstatecomparison. Verifyresource404retrypropertyassetsandnoSWF/Ruffle requests.
- [ ] Runfocusedtests, fullunitonce, modernbuild/typecheck, originalbuildifaffected, productionmodernE2Eagainst4184. Recordcommands/exactcounts/screenshots and sourcecomparisonlimits. Commitownedchanges, complete scoped/broadreviews withfocusedfixes, preserveworktree foruser2Cacceptance; no3A. (Implementation and verification complete; two Minor fixes focused-verified; final rereview and user acceptance pending with main task.)
