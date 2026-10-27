# 3A 原卡面与运气图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 离线导出17张可达卡面和41张运气插图，供完整3A真实界面使用；不代替3A其余规则/状态/素材。

**Architecture:** 与已验收原素材管线一致，从源SWF只读导出PNG/manifest，现代界面只读取PNG/JSON。保留源帧/尺寸/偏移，不将旧弹窗整体布局烘焙成现代UI。

**Tech Stack:** 现有JPEXS26.2.1、Java、Python/Pillow、TypeScript/Vitest。

**Spec:** docs/modernization/phase-3a-art-evidence.md“卡面与运气图”；docs/modernization/architecture.md；完整3A覆盖表。

## Global Constraints

- 原SWF/原版入口不改，无运行依赖增长，无AI生成替代图，无现代SWF/Ruffle加载。
- 只导出可达卡ID[1,5,6,7,9,11,14,15,18,19,20,21,22,25,26,27,33]，不是开放全部37定义。
- 原卡面symbol1721，frame=id+1，bounds[-500,797,-640,700]twips，offset(-25,-32)，原生65×67PNG（由实际导出检查确认取整）。事件symbol1412，frame=id1..41，bounds[0,8000,0,6000]twips，原生400×300PNG，offset(0,0)。不得烘焙父弹窗pic平移(-200,-153)。
- 导出过程校验原SWFhash、JPEXS版本、实际symbol/timeline与尺寸。所有新PNG有真实decoded像素检查及联系图目视核对。未使用帧42..60不混入。
- 其他NPC/动作/中立房屋是后续3A素材任务，不因本任务未导出而从全阶段范围删除。

### Task 1: 卡面/事件原图与运行时清单

**Ownership/files:** Create scripts/ExportInteractionAssets.java, scripts/export-interaction-assets.py, public/modern/assets/interactions/manifest.json and58PNGs, src/modern/features/game/interaction-assets.ts, tests/modern/interaction-assets.spec.ts. Do not edit scene/UI/propertyexports or art evidence being written by another agent.

**Interfaces:** `InteractionAsset {id:number;sourceFrame:number;url:string;width:number;height:number;offsetX:number;offsetY:number}`; `InteractionAssetsManifest {version:1;sourceSha256:string;cards:InteractionAsset[];luck:InteractionAsset[]}`; `parseInteractionAssets(unknown):InteractionAssetsManifest`. Paths canonical `assets/interactions/cards/<id>.png` or `assets/interactions/luck/<id>.png`, completeunique17/41, frameid+1/id respectively, finiteoffsets/dimensions andcorrectsourcehashshape; returnvalidated data.

- [ ] Read actualJPEXS API fromexistingpropertyexporter and sourceartfacts; writefailingrealmanifest/parser testsbeforeimplementation (missingmanifest RED isappropriate).
- [ ] Export58PNGs viaverifiedJAR /Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.analysis-tools/ffdec-26.2.1/ffdec.jar, /opt/homebrew/opt/openjdk/bin/java, bundledPython /Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3. Scratchunder.analysis-cache. Do not changeglobaltools/license.
- [ ] Verify sourceframe/dimensions, fullcoverage, safe/canonicalURLrejectduplicates/mismatches, actualRGBA/nonemptydecodedpixels, originalhashunchanged. Contactsheetshowall17cards and41events labeledids; inspectimages notjustfileexistence.
- [ ] FocusedtestGREEN+typecheck once. No fullsuiteorre-exportoldproperty/walk. Recordcommands/counts/sourcegeometry/contactsheets/private report.
- [ ] Commitonlyownedfiles via/opt/homebrew/bin/git; reportignoredinplanSDDfolder. Mainreviews andlaterintegrates UI; full3Agoalactive.
