# 完整3A 对局接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 在真实现代入口中完成全部17种可达卡、商店、41事件/38特殊格、世界状态与必要原素材，交付可验收3A；不是纯模块演示。

**Architecture:** GameState组合已验证WorldSnapshot，控制器串行推进有限交互状态；Vue显示真实数据，Pixi显示原资产/选择/反馈。所有规则函数复用，不在UI重算价格、租金或卡效果。

**Tech Stack:** 现有Vue/TypeScript/Pixi/Vitest/Playwright；不增加依赖。

**Spec:** docs/superpowers/specs/2026-09-16-modern-3a-integration-design.md；phase-3a-coverage.md；源卡/神/素材证据；所有已完成子模块报告。

## Global Constraints

- 完整3A范围不删：16常规卡+信用卡，38可达特殊格（41运气结果），银行信用入口、5世界卡必要状态与原图/反馈。其他金融/六类NPC遭遇等后续边界明确，不称完整游戏。
- 原入口/SWF不改，不依赖旧core、不加载现代SWF/Ruffle、不增加生产调试入口、隐藏全局、任意发牌或固定骰子开局开关。控骰卡是真实玩法。
- 顺序严格：到达→每步银行→每步路障→余步或最终地雷/NPC→天使恶魔→土地/事件/商店→回合收尾→整轮日tick。不得在确认时重复应用任何一步。
- 用卡透支不立即禁止同回合恢复资金；真实回合收尾才检查当前玩家<=0并停在待破产边界。
- 控骰是下一次任意玩家掷骰消费的单个全局待值；停留是下一次正常人类移动消费的全局待标记。取消/非法选择不清旧值；成功新卡覆盖旧值。源码与内部记录者ID不得混淆。
- 暂停/变速/重开/加载重试、句柄0与generation取消保障保留；初始星期UI一次注入，随机/状态重试不重建。
- 全部新规则先RED；已有同版本验证复用。最终需实际生产浏览器与人工看图，不以fixture或测试数量冒充自然回放。

### Task 1: 完整规则状态与串行交互控制器

**Ownership/files:** Modify game/types.ts, setup.ts, controller.ts; create game/interaction-types.ts and small controller helper files only if meaningful responsibility separation is needed. Tests game-controller.spec.ts plus new interaction-controller.spec.ts, turns/setup tests if changed setup RNG requires explicit expectations. May add GamePanel's one interaction phase label for type compatibility, no otherUI/MapScene work.

**Interfaces:** GameState extends WorldSnapshot and retains existingturn/propertyfields, adds interaction:GameInteraction|null and skipLandingMarker:boolean. createGame(humans,seed,initialWeekday=1) initializesallcard/world fields once; pureheadless defaultMonday documented, actualUI MUSTpasslocalgetDay once. Sourceinitialticket200,hand5,creditfieldsfromworldrules,reserve100000,pricesfromcreatePropertyPrices,12NPCs fromcreateWorldState (advanceRNG).

GamePhase adds 'interaction'. GameInteraction finiteunion kinds card-confirm/dice-choice/target-choice/credit-choice/shop/bank/notice; properties holdcardID/index,choiceerror,ShopState,notice/visualmetadata asneeded. Explicitresume enum await-roll/after-bank/after-marker/after-god/end-turn/shop/bank, withneededpayloadstored (no closures asstate).

Controller publiccommands: beginCard(index), confirmCard(), chooseCard(DirectCardChoice), cancelInteraction(), acknowledgeInteraction(), buyCard(slot), sellCard(index), leaveShop(), requestCredit(), leaveBank(), allbooleanvalidityresults; existingroll/pause/speed/restart/dispose kept. Humanonlyactiongates; privateAIresultadvance separate. OptionalonInteractionEvent callback emitsactualnewoutcome once forUIlog/visuals, notfromeveryonStateidentitychange. Expose exacttypes inreport forTask2.

- [x] RED tests beforechanges: ordinarywaitingcardcancel; all17dispatchcases; successful/failedconsumptionincludingcreditretain/dismissnoneconsume; target/die/amount choices; bankmidmove then resumeexactremainingpath; card/shop/luck/ticketconfirmationonce.
- [x] InitializeWorldSnapshot singletruth. Adaptoldfixtureexpectations onlywhere newsourceNPC RNGdraws trulychange; keepordinaryspawnpositions/closure andpriorpause/route assertions. Do notremove oldtests tomask newinteractions.
- [x] Implementfiniteflow perdesign. Human/AIland results serial. BeforeeachnewturnprepareWorldTurn; atwrapadvanceWorldDayonce. Godfreelevelbeforequote andtoPropertyEconomy forgod rent/upgrade; sourceNPCdeferrednoticecontinuesnormalterrain. MineendTurnskipproperty, barrierresumeordinarylanding.
- [x] Controlleddie/globalstay: on successfulcard5normalizeforcedDice tolastsetteronly; nextactualrollconsumeallwithfixedDie(noRNGdraw). On successful27normalize stayPlayerIds; nextHUMANroll consumesafterdice,landsorigin skipLandingMarker=true,AIleavesflag. Explicitregressioncard5/27thenmissileselfhospital→nextAI/human respectively. Invalidchoiceskeeppriorpendingeffect.
- [x] ApplyDirect/WorldResult viaexplicitcoreprojection, keepUI/oldpropertyevents frombeingcloned/relogged. Perresultphasepreventsdoubleclick,oldindex,wrongphase/AIcommand. Sameframeconfirmedresultthenrepeatedcommandfalse.
- [x] Shoponlyhuman createsstockonce+6RNG; buy/sellnoticeackreturns same shop. Leavingretainsallsettledvalues. AIpasseswithoutshopRNG. BankSundayhumanclosednotice; eligibleAIcreditonlyperworldhelper, no inventedborrowing. Sourceotherbankbusinessstaged3B.
- [x] TestpauseatAIworlddecision, bank, cards/shop/results; restart/dispose invalidatesallpending work. Funds canrecoverafteroverdrawcardbeforetrueendturn; insolvencyhalt atactingplayerendturn only. Ticketfull24nodraw, B01onecharge, Godbeforepropertyonce, delayedexpirationrestrictedthenrelease,3/5/7days.
- [x] Focusedcontroller/setup/turns tests+typecheck; no fullsuite yet. Commitownedpaths, private task-1-report withexactAPI/RED/GREEN/stateflow. Main scopedreview beforeTask2. Distpreviewmayremainaccepted2CuntilUIready; no3Acompletionclaim.

### Task 2: 原素材界面、地图目标与真实3A验收

**Prerequisites:** Task1approved and world-assetsTask1approved. Independent Vue panels, command wiring and component tests may start while reaction-assetsTask2 is running, using its declared interface; defer reaction loader/MapScene wiring and production acceptance until reaction-assetsTask2 is approved. Read actualAPIreports before wiring each dependency.

**Ownership/files:** Modify ModernApp.vue, GamePanel.vue, MapScene.ts; create InteractionPanel.vue/HandPanel.vue and focused viewhelpers asneeded; useexisting reaction/asset parsers. Tests actualVue components and tests/e2e/modern-*.spec.ts, including new modern-interactions.spec.ts; mayadd tests-only browserfixture entry excludedfromproduction. Docs acceptance-3a.md/README/coverage and completedplan.

- [x] RED realcomponent/controller-to-viewtests forhand24paging,cardconfirm/cancel/target/die/amount,realstock/balances,credit/statedays,noticeackandpausedguards. No mockedruleengines.
- [x] Useoriginal17cardimagesand41luckimages, actualruntimeinventory/tickets/credit/prices/ownership/levels. Keepallpanels insidefullscreenstage; 8cardspage/clearnames distinguishes25/26. Requiredrentnocancel; unpaidfundsnotconfusedwithgamemoney0transfers.
- [x] MapScene privateassets for12initialNPCmarkers,4barrierfacing/mine/nativeeffects,neutralunownedlevel>0houses. Sharedentitydepth withplayers. Onclickonlytargeting invokegetpoint-derivedgrid; dragthreshold preventsaccidentalcarduse; camera/fullmap/follow/pause maintained. Puremodule validatesfinaltarget.
- [x] Loadonlythisgame's4characters' reactions+godoverlays; exactfps/framecounts/playonceholdlast/loopflags. Connectsemanticoutcomes tooriginalhappy/sad/hurt/neutral/ready/FX andtemporaryvisualtransitions withoutsettlingrulesagain. Restrictedplayers hiddenasoriginal, returnvisiblewhenreleased. Don'tsubstitutefirstparentframe forrocket/NPCnestedclips.
- [x] Preload/abort/cleanup privateimages/textures/listeners. UIimagesnotredundantPixi textures. Asset404retrykeepswholependinggame(NPCpositions,RNG,inventory,weekday) andsinglecanvas. Returningselectiondisposesoldengine; sceneinspectiononlyfromselection.
- [x] Keyboard↑roll onlyawaiting,←confirm/ack,→cancel onlyallowed; ignoreinputs/selects/textareas/contenteditable. Alltargetinteractioncontrolsdisabledpaused, andcorestillrejectscommands.
- [x] Establishnewdeterministic productionseed+clockfixture atbrowserboundary only; newNPC/eventRNG meansoldseed964 pathmaychange. Maintain2B/2Cregressionbehavior throughlegalnewconfirmations andliteralcoretests; don'tremove route/pause/economicchecks.
- [x] Browserproductionflowactualselection→legitimateinitialcards→target/controlledroll→AI→specialevent→shopbuy/sell→bankcredit/use, withvisiblefunds/hand/grade/worldstate. All17cardtrigger/cancel/target/settlementcases mayalso useexplicitseparate browserfixtures mountedwithrealcomponents/controller; nothiddenproductglobals andnotclaimednaturalgameplay.
- [x] B01newUIshowsdonationandcash-1000; groundminepassvsland,barrierstopthenland,missileinjury/jail,Godattachment/rent,expiry/reentry,controlflagcrossplayer and repeatedinputs haveadequateactual evidence. Distinguishrule/controller/component/fixture/productionproof perrequirement.
- [x] Run appropriatefullunitonceafterallintegration, typecheck/modernbuild, productionmodernE2E; noSWF/Ruffle/wasm/failedresource/pageerrors. Originalentryunchangedthereforeoldvalidoriginalevidencereusedunlessaffected. View1440×1000andactualfullscreen1920×1080screenshots; stablepathsunder.analysis-cache/acceptance-3a.
- [ ] Commitownedfiles andwriteexactreport/counts/screenshots/knownstageboundaries. Main scopedthenfull3A review andfocusedfixes; coverageaudit againstall3Arequirements beforedeliverawaitinguseracceptance. No merge/push/deploy.
