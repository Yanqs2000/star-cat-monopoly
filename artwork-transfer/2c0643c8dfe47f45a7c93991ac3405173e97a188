# 3A 世界与角色反馈原素材 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 五种世界卡与六神/事件反馈使用正确原素材、原锚点和30fps时间轴；不把已有walk或卡面当全部视觉覆盖。

**Architecture:** 延续离线JPEXS/PNG/manifest管线，现代只加载JSON/PNG。世界素材与角色反馈独立清单；现有2B行走和2C房屋不重导。嵌套动画需显式控制父/子播放头，不能只取单张父帧。

**Tech Stack:** 现有JPEXS26.2.1、Java、Python/Pillow、TypeScript/Vitest/Pixi已有类型。

**Spec:** phase-3a-art-evidence.md完整映射；world-cards设计；既有素材架构。3A其他六类NPC只保留原占位/外观，其遭遇属于3C并明确提示，不宣称规则完成。

## Global Constraints

- 原SWF只读、hash前后不变；不增加运行依赖，不用自绘/AI图替代，不在现代浏览器加载SWF。
- 原生分辨率RGBA、源bounds与rootplacement合成正确；各source长度保持原样，30fps。一次动画末帧停止，循环只用于原循环。
- 真实文件测试、decoded RGBA检查、关键联系图实际查看；记录帧数/尺寸/源几何。长导出先落盘报告并通知process/session句柄，恢复时先确认进程/产物，不能因等待超时重开导出。
- 两任务均不修改UI/MapScene；后续统一接入。全3A目标仍须规则与浏览器，不能以素材任务代替。

### Task 1: 世界动画、六神及中立房屋

**Ownership/files:** Create scripts/ExportWorldAssets.java, scripts/export-world-assets.py, public/modern/assets/world/manifest.json+PNGs, src/modern/features/map/world-assets.ts, tests/modern/world-assets.spec.ts. No existingproperty/interaction/character exporter edits.

**Interfaces:** `WorldFrame {url:string;width:number;height:number;offsetX:number;offsetY:number}`; `WorldClip {id:string;fps:30;loop:boolean;frames:WorldFrame[];sourceSymbol:number}`; `WorldAssetsManifest {version:1;sourceSha256:string;clips:WorldClip[];neutralHouses:Array<WorldFrame & {facing:1|2|3|4;level:1|2|3|4|5;sourceFrame:number}>}`; `parseWorldAssets(unknown)` validatescanonicalpaths/coverage/geometry/fps/uniqueclipids. RequiredclipIDs npc-{1,2,3,4,5,9,10,11,12,13,14,15}, barrier-{1,2,3,4}, mine, rocket, explosion, card-gain, ticket-gain. Paths assets/world/<clipid>/<frame1based>.png and assets/world/neutral-houses/<facing>/<level>.png.

- [ ] RED realmanifest/parser tests; verifymissingmodule/filefailsbeforeimplementation. Sourcehash, expectedclipset21, neutral20completeunique, finitebounds andpathmismatches rejected.
- [ ] NPC roots: freeze rootframe1assembly andadvancebodychildfullcycle (sixgodsexactbody54/12/55/22/18/18perdoc). AdditionalinitialNPC1/9/12/13/14/15 neededvisibleoccupancy: probeactualrootbodytimeline/placement andpreservenativefirstcycle, don'tinventshapes. Theirgameplaystill3C.
- [ ] Barrier3689:4facingroots eachfrozen, inner10framecycle. Mine3696:80rootframes. Cardgain1163:50rootframes;ticketgain1185:30rootframes, preservemovingchildmatrix. Explosion1027:root1frozen+1026child60frames. Rocket1080:rootassembly+1079body80frames,1048tail11cycle; respecttailfreezeat11forbody40..69 andresumeatbody70. Neverclaim1rootframeisfullanimation. SourceASscripts forcontrols infullparentexport;verifyactualAPIbeforebuildinginmemoryclips.
- [ ] Neutralhouse3401 selected(facing-1)*10+level+1 withland3147frozenemptyframe7,20variantslevels1..5,90×124 offset(-18,-68.65). Keepexistingplayer-coloredPNGsuntouched.
- [ ] DecodeallframescheckRGBA/dimensions/nonemptywhereappropriate, sourcehash; generateandviewlabeledcontactsheetforNPC/fullcycle endpoints,4barriers,mine/rocket/explosion endpoints,20neutralhouses. Checktiming/sourceIDsmetadata, nochildplayheaddrift.
- [ ] Focusedworld-assets tests+typecheck, commitonlyownedfiles via/opt/homebrew/bin/git explicitpaths; ignoredreporttask-1-report.md includescounts/process/repro/source/contactsheets. MainreviewbeforeTask2.

### Task 2: 12角色的3A反馈动作

**Ownership/files:** Create scripts/ExportReactionAssets.java, scripts/export-reaction-assets.py, public/modern/assets/characters/<id>/reactions/manifest.json+PNGs, src/modern/features/characters/reactions.ts, tests/modern/reactions.spec.ts. Existingwalkfiles andbasecharacter manifestsunchanged. Ownonlyreactions subdirectories.

**Interfaces:** `ReactionName='neutral'|'ready'|'happy'|'sad'|'hurt'`; `ReactionClip {name:ReactionName;facing:Facing;fps:30;loop:false;frames:WorldFrame[];sourceRootFrame:number;sourceSymbol:number}`; `ReactionManifest {version:1;characterId:number;sourceSha256:string;clips:ReactionClip[];godOverlays:Array<WorldFrame & {godId:2|3|4|5|10|11}>}`; parservalidates20clips/6overlays percharacter. `ReactionPlayer` (oradaptablepureframecursor) supportsplayonce/holdlast/reset, fps/speed/pause; no rule settlement callbacks.

- [ ] Read exactfull12mapping; RED actualfiles/parser/framecursor tests. Offsets1,7,3,5,10 respectively; rootframe=(facing-1)*30+offset. 1/7staticshape1frame, othersactualchildlength includingstar6DRhappy68/star8hurt33 etc. Do notforceuniformlength.
- [ ] Exportrootdepth1body withactualrootmatrix pluschildbounds tosharedactororigin (specialstar12ULhurtplacementmustnotflatten); preserveallframes30fpsonceendinglast. Forattachedgodsoverlays useeachcharacterrootnamednpcz/commondepth3 actualsourceframegodId androotplacement, notinventedicons; probeandrecordexactlayers beforeexport.
- [ ] All12characters×4directions×5clips and6godoverlays; immutableprivatePNGassets. Avoidreexportingwalk. Contactsheetfirst/middle/last forvariedlengths/facings andall12characters, viewactualanchoring;recordsourcehashperstar.
- [ ] Focusedreactiontests/typecheck; verifyonceholdsfinal,paused/speedcursorwithoutchangingrules. Stageonlyreactions paths, commit/reportexactcounts. MainlaterwirestoMapSceneandactualevents, no claimalreadyplayedinthegame.
