# 2B 开局与回合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 12角色选择、AI补位、四出生区、掷骰、原路网逐格移动和回合轮转，在现代场景中可实际操作。

**Architecture:** 纯TypeScript规则状态负责随机、步数、位置、朝向与当前回合；Pixi只显示状态和插值。Vue负责选人和操作界面，不在渲染循环内执行规则。原版四向动作离线提取，浏览器按本局所选角色加载PNG。

**Tech Stack:** 现有 Vue 3、TypeScript、Pixi 8.20.1、Vitest、Playwright；离线 JPEXS 26.2.1、Java、Python/Pillow。

**Spec:** docs/modernization/roadmap.md 的2B及 docs/modernization/phase-2b-evidence.md。

## Global Constraints

- 仅本地2B，完成后等待用户验收，不进入2C；不合并、不推送、不部署。
- 现代入口不请求SWF/Ruffle，不依赖旧src/core规则。
- 保留原版SWF和原版入口，保留2A场景检查功能。
- 四名玩家；人类选择1至4名不重复角色，空位随机AI补齐；四出生区随机不放回，每区随机选两种出生姿态之一。
- 普通路口排除来路后随机转向，人类与AI相同；最后一步也更新路口朝向。
- 骰子1至6；快速/慢速只改变展示时间，不能影响最终状态或规则随机序列。
- 本批特殊地块只提示后续范围，不结算买地/银行/卡牌/传送/奖券/破产/日期，不冒充完整游戏。
- 复用已有依赖。当前 Browser skill 不可用，真实UI检查用项目Playwright和现有Chrome。
- 不使用额度重置。当前用户指定22:47恢复，额度不足则保存进度后按既有规则续跑。

### Task 1: 12角色四方向原版动作资源

**Files:**
- Modify: scripts/OriginalSpriteBounds.java, scripts/export-modern-assets.py
- Modify: src/modern/features/characters/assets.ts, tests/modern/assets.spec.ts
- Create: public/modern/assets/characters/{2..12}/manifest.json and walking PNGs
- Create: public/modern/assets/characters/index.json
- Test: tests/modern/character-assets.spec.ts

**Interfaces:**
- Existing `AssetManifest` schema is unchanged: version 1, map metadata and four clips, each `WalkClip` with original timed frames and offsetX/Y. Actual inspected source: star6 has20 frames/direction, star7 has16, all others24; preserve these counts and30fps periods. Parser accepts nonempty ordered frames and rejects empty/misordered frames; tests cover20/16-frame wrap behavior.
- Existing assets/manifest.json remains star1/2A compatible.
- Index JSON: `{version:1,characters:[{id:1,name:"卷毛",manifestUrl:"assets/manifest.json"},...,{id:12,name:"妮妮",manifestUrl:"assets/characters/12/manifest.json"}]}`. IDs match starN.swf, names from phase-2b-evidence source (吉吉&米米, 帅戈, 怪卡).
- Character manifests retain map metadata and source hashes, with character PNG URLs unique to their id. UI fetches only the four selected manifests. Parser validation is generalized in this task without changing the schema; star1 stays24 frames and old2A timings remain.

- [x] Write a data integration test that loads the index, parses every manifest using production `parseAssetManifest`, reads every referenced PNG, checks source PNG header dimensions positive, unique id coverage and all original file hashes. Tests must catch missing/repeated character paths rather than test constant text only. Record RED before generating resources.

```ts
const index = JSON.parse(readFileSync('public/modern/assets/characters/index.json','utf8'))
for (const item of index.characters) {
  const manifest = parseAssetManifest(JSON.parse(readFileSync(`public/modern/${item.manifestUrl}`,'utf8')))
  for (const clip of manifest.clips) for (const frame of clip.frames) {
    const png = readFileSync(`public/modern/${frame.url}`)
    expect(png.subarray(1,4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBeGreaterThan(0)
  }
}
```

- [x] Generalize offline metadata extraction to inspect each SWF's actual root frames 5,35,65,95 (zero-based) rather than assuming star1 sprite IDs. Verify translations/scales and frame durations against actual data; if any differ, report evidence before forcing them into star1 layout. Preserve the existing star1 IDs/output.
- [x] Export all remaining characters with original transparency and per-character registration offsets. Validate RGBA bounds and alpha using Pillow. Run with `FFDEC_JAR=/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.analysis-tools/ffdec-26.2.1/ffdec.jar` and `FFDEC_JAVA=/opt/homebrew/opt/openjdk/bin/java`, Python `/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`.
- [x] Run focused test then full unit suite once; inspect representative contact sheet of all12 and four directions to catch gross missing/wrong sprite output. Store screenshots in /tmp. Record commands, RED/GREEN and source evidence in task report.
- [x] Commit only owned files with `feat: export all original character walking clips`.

### Task 2: 独立开局与移动规则

**Files:**
- Create: scripts/build-modern-rules.mjs, src/modern/data/rules.json
- Create: src/modern/features/game/types.ts, random.ts, setup.ts, turns.ts
- Test: tests/modern/turns.spec.ts (additional focused .spec.ts tests may live in the same directory)

**Interfaces:**
- `Direction = 1 | 2 | 3 | 4`; position uses existing `GridPoint`.
- `GameState`: players (id,characterId,name,controller,hometown,position,direction,cash,deposit), activePlayerIndex, round, phase ('awaiting-roll'|'moving'|'landed'), remainingSteps, lastRoll, rngState, turnPath.
- `createGame(humanCharacterIds: number[], seed: number): GameState` validates1..4 unique ids1..12, randomly fills AI then assigns hometowns then birth variants in original order.
- `roll(state: GameState, fixedDie?: number): GameState` consumes one rule random draw for ordinary die; optional fixedDie is a replay/test command validated1..6, not exposed in ordinary play UI. Reject commands outside awaiting-roll.
- `step(state: GameState): GameState` moves one grid diagonal in current direction, applies arrival junction direction rule, deducts exactly one step, phase becomes landed at zero. Reject nonmoving commands. Immutable transition; source state not modified.
- `nextTurn(state: GameState): GameState` only accepts landed, increments active index modulo4 and round after fourth. No monetary or calendar side effects.
- `rules.json`: source hash, junction entries keyed by id with ordered direction arrays, road cell entries with coordinate/id/kind/name, spawn regions and initial funds derived from evidence tables. Preserve original direction order. No copying whole financial/card dataset into browser.
- `random.ts`: deterministic stateful PRNG over uint32, seeded once; functions return value and nextState. Seed0 must be valid. Render code never draws from this RNG. Reproducibility is a modern contract, not a claim of reproducing Flash PRNG internals.
- Preserve random draws at every junction, including a corner with only one allowed exit (`random(1)` in original), and at last unassigned hometown selection. Initial cash/deposit are each100000. Controller has verified original loop condition bytecode enters body even with undefined `znmu`; four nonbankrupt players advance in order, no undefined-variable logic copied.

- [x] Before implementation inspect source evidence for initial funds and round transition; record B-02 resolution/provisional boundary in evidence doc via controller. Branch implementation must not reproduce an undefined-variable hang.
- [x] Write failing tests with independent literal paths. Example manual fixture from born region1 direction1 at(34,8): arrives(35,9) id221; allowed [1,2,3] excluding3 gives[1,2]; selecting first reaches(36,10) on next step. Also region3 variant direction3 at(6,34): one step reaches(5,33) id225; exclude1 leaves[3,4]. Test final-step direction update, six steps not five/seven, illegal double-roll, step after landed, invalid fixedDie and duplicate/empty selections, four turn wrap, state immutability, equal command streams with equal seed.

```ts
const s = createGame([1,2,3,4], 1)
const controlled = {...s, players:s.players.map((p,i)=>i ? p : {...p, position:{column:34,row:8},direction:1 as const})}
const landed = step(roll(controlled,1))
expect(landed.players[0]!.position).toEqual({column:35,row:9})
expect([1,2]).toContain(landed.players[0]!.direction)
expect(landed.remainingSteps).toBe(0)
expect(landed.phase).toBe('landed')
```

- [x] Implement minimal generator and pure transitions; errors leave original state untouched. Keep game types DOM/Pixi-free. If supporting deterministic branching test needs a small exported RNG function, test literal seeded outputs plus behavior; no browser debug globals.
- [x] Run focused tests. Exercise every reachable road heading starting from all8 spawn variants to detect missing topology/dead paths, using ordered allowed transitions, not random soak testing. Fixtures must assert no walking into scenery cells.
- [x] Run unit suite once and commit owned files `feat: implement deterministic setup and movement turns`.

### Task 3: 可操作开局、回合与真实场景验证

**Files:**
- Modify: src/modern/ModernApp.vue, src/modern/features/map/MapScene.ts
- Create: src/modern/features/game/GamePanel.vue, controller.ts
- Modify if needed: src/modern/features/characters/WalkPreview.ts (small lifecycle/pose methods only)
- Test: tests/modern/game-controller.spec.ts, tests/e2e/modern-turns.spec.ts; retain existing 2A E2E coverage.
- Docs: docs/modernization/acceptance-2b.md, README.md, completed plan checkboxes.

**Interfaces:**
- Consume Task2 state/functions and Task1 manifest index.
- Keep `createMapScene` existing 2A contract valid; extend handle to render a set of player poses and movement interpolation, camera follow/focus independent of authoritative position. Additional resource loading supports abort and destroys private textures; no shared global asset cache.
- Draw order follows player position (source depth order prioritizes row then column); only moving player walks, others hold a pose. Scene inspection is separate and may loop continuously. Do not recreate Pixi/texture objects every animation frame.
- Preserve walking animation across same-facing pose updates; do not call a reset-to-frame1 method on every render tick. Per-character frame counts remain20/16/24, not universally24.
- `controller.ts` owns sequential timer scheduling: one roll/step/next-turn at a time; injectable scheduler and step duration permit headless fast/slow tests. Disposing/restarting aborts pending actions. Browser uses ordinary seeded game setup and random dice; tests can drive the pure controller with fixed commands without adding test globals to production.
- Initial screen offers12 original character previews/names and clear selected order, 1..4 human players; AI supplement explanation; Start. Fifth selection rolls oldest out as original. Loading errors permit retry. Restart goes through visible return-to-selection action and cancels timers.
- Start creates one pending game/seed. A failed texture load and retry keep that same lineup and state; only explicit new game recreates setup. Start controller timers only after the scene finishes loading. Selection previews use the exporter convention relative to each manifest (`walk/down-right/1.png`), avoiding fetching all12 full manifests; load only the four chosen characters' manifests when starting the game.
- In game, current player/controller, last die, remaining steps, round and readable position/turn history; human roll button (Up arrow also supported when no input control focused), AI auto-roll and automatic next turn after landing presentation. Speed control. No human roll duringAI/motion. Pause freezes both pending progression and animation; camera all-map/fullscreen controls remain available. Active player is visually identified, all four characters visible in their actual positions when in view; no wrong-character placeholders.
- Preserve2A scene inspection behind explicit scene-inspection mode/tab so old direction/location controls cannot move game state. Fullscreen game controls stay accessible inside fullscreen container. Clear notice: 2B movement trial, no purchase or special effects yet.
- Game overview/manual camera drag must remain usable while turns run; don't reset overview zoom on every state update. Provide explicit focus/follow-current-player action to return to the active player.

- [x] Write failing controller tests: two commands cannot double-consume; sequence human→3AI→human; switching speed during movement produces same final game/rng state; cancel/restart leaves no old callbacks mutating new game. Use fake timers at scheduler boundary, assert actual resulting game states.
- [x] Write failing browser tests for selected humans and AI counts, primary roll action, movement/turn trace, restart and missing selected character asset retry. Existing 2A tests can navigate scene-inspection mode explicitly; do not weaken their pause/fullscreen/retry assertions.
- [x] Implement minimal components/controller/renderer extensions. Use transition events to interpolate one grid step, then commit arrival before scheduling next. Sprite animation delta has no authority over rules.
- [x] Run focused controller and browser tests against actual dev server. Inspect desktop1440x1000 and fullscreen1920x1080 screenshots; include12-character selection and a visible movement/AI state. Verify console/network has no app errors or SWF/Ruffle requests. Fix reproduced UI bugs with a failing regression test before patch.
- [x] Run `npm test`, `npm run build:modern`, `npm run build` and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4184 npm run test:e2e:modern -- --reporter=line` after serving current dist-modern. Capture final evidence without repeatedly rerunning unchanged checks.
- [x] Commit owned files and write acceptance evidence; implementation commit b605a7a,96 unit tests and7 production E2E passed.
- [x] Complete broad2B review and scoped fixes: final code614601b, no open review findings. Handoff records saved; automatic continuation pauses for user acceptance.
- [x] User2B acceptance: “没什么问题，进入下一阶段”。2C独立计划为2026-09-13-modern-property.md，继续保留本地分支。
