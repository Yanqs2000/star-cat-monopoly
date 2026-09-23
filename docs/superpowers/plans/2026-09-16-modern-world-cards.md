# 3A 世界卡牌与状态 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 五张世界卡、六神、限制天数与信用申请成为真实纯规则，为完整3A统一控制器/UI提供契约。

**Architecture:** WorldSnapshot扩展DirectCardSnapshot，独立world占位/状态与注入RNG。复用源网格元数据和现有事件/卡经济模块，物业增加附身修正；无需DOM或计时器。

**Tech Stack:** 现有Node/TypeScript/Vitest/Vue（仅新增物业事件的文字兼容）。

**Spec:** docs/superpowers/specs/2026-09-16-modern-world-cards-design.md；phase-3a-gods-evidence.md；phase-3a-cards-evidence.md。

## Global Constraints

- 不改原SWF/旧入口，无旧core/运行依赖。3A全目标还需素材/控制器/UI/实机，不能提前完成目标。
- 路障每步触发；地雷/神灵只最终落点触发。医院3日/监狱5日，出口坐标已支持160格闭包。
- 招神按固定顺序先全局欧氏最近再含边界矩形352×280，无自然遭遇奖励，7日；送神无神也耗卡。
- 地产神力、随机轮盘上界、手牌上限与随机步数严格依源证据，不发明加价/折扣/AI出牌。
- 原初始全部12个NPC占位有序产生，六神以外遭遇返回明确deferred事件且保留标记；后续3C实现不被假装完成。
- 所有财产变化不可变且一次提交；纯函数不能读取时间/Math.random/DOM。

### Task 1: 世界规则、五卡与附身物业

**Ownership/files:** Create scripts/build-modern-world.mjs, src/modern/data/world-rules.json, src/modern/features/game/world-cards.ts, tests/modern/world-cards.spec.ts. Modify property.ts/property.spec.ts for god modifiers only after direct-card taske1e419e (approved); may add `upgrade-failed` text mapping to PropertyPanel.vue and ModernApp.vue where needed for type compatibility, no layout/control-flow edits. No setup/controller/turns/MapScene changes.

**Interfaces:**
- `WorldPlayerStatus {state:0|2|3|9;days:number;godId:number|null;godDays:number}` (0正常、2拘留、3住院、9保留淘汰标志不实现淘汰).
- `WorldState {markers:Record<number,number>;statuses:Record<number,WorldPlayerStatus>;weekday:number;elapsedDays:number}` markers keysourcecellID,valueoriginalNPC/trapID.
- `WorldSnapshot extends DirectCardSnapshot {rngState:number;world:WorldState;tickets:Record<number,number>;lostAndFoundFunds:LostAndFoundFunds}`. Existingfieldsnotduplicated.
- `WorldEvent {kind:string;playerId:number;cardId?:number;npcId?:number;amount?:number;affectedCellIds:number[];affectedPlayerIds:number[];cardIds:number[]}` usefiniteexplicitkindunion inimplementation for listed outcomes, not arbitrarysideeffects.
- `WorldResult {snapshot:WorldSnapshot;event:WorldEvent|null;consumed:boolean;stopMovement:boolean;endTurn:boolean;invalidReason:string|null}`.
- `createWorldState(players,rngState,weekday):{world:WorldState;rngState:number}`; `applyWorldCard(snapshot,playerId,inventoryIndex,choice:DirectCardChoice):WorldResult` exactly6,7,9,21,22.
- `resolveWorldCell(snapshot,playerId,position,mode:'step'|'landing'):WorldResult` implementsbarrier/mine/natural6gods/deferredotherNPC; banksnotsettledhere.
- `applyLandingGod(snapshot,playerId,position):WorldResult` onlyangel/devilfreegradebeforequote, no secondnaturalencounter.
- `advanceWorldDay(world):WorldState` weekday+1mod7,elapsedDays+1 andpositive days/godDays-1 once; `prepareWorldTurn(snapshot,playerId):WorldResult & {skipTurn:boolean}` releases0-dayrestrictions atsameposition, skipsremainingrestriction; expiresgodonlynormalstate0 byspawnback+clear.
- `applyBankCredit(snapshot,playerId):WorldResult` currentplayercontroller determineshuman/AIcriteria above; eventgranted/declined/closed. SourceAIlevelsfromworldrules seat[8], notcharacter. Fullbankbusinessnotclaimed.
- `toPropertyEconomy(snapshot):EconomySnapshot` derives optional `godIds:Record<number,number|null>` fromworldstatuses; propertygetOffer/applyuseactorIDmap. PlainoldEconomySnapshot remainscompatible.
- Generator sourcehash+initialNPCdefs/IDs+godIDs+AIlevels+initialcredit/tickets+hospital/jailtuples, --output reproducible. ConsumeexistinggetCardBoardRecords/getCardRecord/getCardCell; don'tduplicateboardgeneratororfiltertoonlynormalroads.

**Exact algorithms / contract:**
- putbalk candidates ascendingrecordID: type<23, numericfacing>0, markerabsent, excludesplayers' currentrecordIDs. Single randomInt(candidateCount). InitialNPCorder allsourceenable1; release uses same. Preserveuniqueness gods betweenmap/attachment; lackfreecell isexpliciterror, notsilentlyduplicate.
- Card6/7 targettype1..29, no marker/player; iftype<24 requiresnumericfacing>0, otherwisevalid. Successplacemarker/consume; failureunchanged. Sourcebarrierfacingvisualfromrecordonlylater.
- Card9 centerexists/type!=34; fivecoords center+(±1,±1)allgridexists, sceneryid0allowed. Loweronly type16/EVENordinal side's pairedparcel withlevel>0, onceeach. Publicdamageonlyordinal2+types[13,14,15,18,19,22,31,32]. Hitplayerscenter/diagonals excludingstates2/3/9 ->hospitaldir2pos19,1 days3; ifcasterhit endTurnhospital takespriority, elseanypublicdamage casterjaildir4pos21,41 days5/endTurn. Emptyvalidshotstillconsume. Publicbuildingsnotpermanentlyremoved.
- Card21 visiblegods[2,3,4,5,10,11], squaredpixeldistance with56/40scales, strict<tiesfirst. Selectnearestthen absdx<=352/absdy<=280; failretaincard. Clearselectedmarker beforeoldgodrespawn; attachselected7daysconsume, noreward. Card22respawncurrentifany,clearid/days,alwaysconsume.
- Stepbarrierremove+stopMovementtrue/endTurnfalse; landingmine remove,sendhospital3,endTurntrue. Passingmine/goddoesnothing. Sixgodslandingreplaceattachedoldbyrespawn, attachnew7, then:2 randomdigitsfourrandomInt10+oneInt3cashadd;3 ifcash>0 fourInt10 amount, cashmax0, lostfundsboth+FULLamount, otherwise noRNG;4 draw2ifhand<=22,1if23,none24;5 randomremove2if>2(twoRNG), elseclearwithoutRNG;10/11noimmediategain. Clearlandmarkonce; continueordinarylanding. OtherNPC returnsdeferredwithnomutation.
- Godlanding10+1cap5 or11-1floor0 oncurrentresidentialowneragnostic. Propertyrent actorGod2=0/3=2x; upgradesGod4paynormal+2cap5/God5paynormalnochange(`upgrade-failed`event), othersstandard. Unownedpurchaseunchanged. Directcardsnotmodifiedbygod.
- prepareWorldTurn state2/3positive days skip WITHOUTexpiringattachedgod yet;0days release then normal expiry; expirationrespawnonceandclear; AI/Human same. Bankhumanweekday0closed; AI sourceapplicationnoSundaycheck,level>1/firstcard!=1/space; noadditionalhumanrulesonAI. Creditgrantprepends1/available100000, existingused preserved; humansused/availablemustboth0+score>=50+space.

- [x] WriteRED beforeimplementation. Coverall5card success/failure/consume andsourceedgecases includingmarkeroccupancy, passingmine, missilebuilding-sidevsroad-side, emptyshot/selfhospitalpriority/publicjail, summonpost-filterrectangle/ties/noimmediatereward, dismisswithoutgodconsumes.
- [x] Testnatural6gods RNGstep counts/upperdigits/poorfullcreditvsclampedcash/hand23/24/expiryAIandhuman; everypropertygodmodifier andangel/devilbeforequote. TestsourceNPCorder/exclusions/uniqueinstances andimmutability.
- [x] Testdaily3/5/7 decrements/0stop andsamecoordinateexit; crediteligibility/SundayhumanvsAI/firstslot/24cap/0amounthandleddirectmodule. Nohelpersmockingcoreoutcomes.
- [x] Implementminimalmodule; focusworld+property+directsuites andtypecheck, reportsourceedgecases/RED/GREEN. No fullsuiteyet. Commitonlyownedpaths via/opt/homebrew/bin/git; private reportignored; mainreview/integrationcontinues.
