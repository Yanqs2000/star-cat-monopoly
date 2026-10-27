# Task 1 Report: 12 角色四方向原版动作资源

## Status

DONE

Implemented from baseline `a974da4`. The exporter now discovers each `starN.swf` walking sprite from root frames 5, 35, 65, and 95, preserves the source frame count and 30 fps timing, exports original RGBA PNGs, and writes one compatible manifest per character plus the 12-character index. Original SWFs and the runtime entry were not changed.

## Source evidence and contract correction

`OriginalSpriteBounds.java` read the actual depth-1 placement at each required root frame for every SWF. Every placement had scale `[1,1]`, no rotation, and a character-specific translation. The discovered source sprite IDs and frame counts were:

| ID | Name | Source sprite IDs (down-right, down-left, up-left, up-right) | Frames per direction | Period at 30 fps |
|---:|---|---|---:|---:|
| 1 | 卷毛 | 130, 308, 488, 664 | 24 | 800 ms |
| 2 | 阿牛 | 126, 300, 474, 646 | 24 | 800 ms |
| 3 | 吉吉&米米 | 124, 296, 468, 638 | 24 | 800 ms |
| 4 | 佳佳 | 128, 304, 480, 656 | 24 | 800 ms |
| 5 | 大牌 | 130, 336, 542, 748 | 24 | 800 ms |
| 6 | 薇薇 | 107, 279, 451, 623 | 20 | 666.667 ms |
| 7 | 帅戈 | 124, 296, 468, 640 | 16 | 533.333 ms |
| 8 | 大尾 | 122, 290, 459, 627 | 24 | 800 ms |
| 9 | 阿飞 | 124, 302, 480, 658 | 24 | 800 ms |
| 10 | 阿杰 | 126, 300, 474, 648 | 24 | 800 ms |
| 11 | 怪卡 | 124, 296, 468, 640 | 24 | 800 ms |
| 12 | 妮妮 | 126, 302, 478, 652 | 24 | 800 ms |

The initial brief assumed 24 frames for every `WalkClip`, but star6 and star7 differ in the original files. I stopped before padding them and reported the evidence. The task owner directed the implementation to preserve 20 and 16 real source frames with their real periods. `parseAssetManifest` therefore accepts a nonempty, sequential frame list while retaining the four-direction, URL, positive-duration, and finite-offset checks. Star1 remains 24 frames and 800 ms.

All per-character bounds and translations are retained in the generated manifests as `sourceBoundsTwips` and `sourcePlacementTwips`; frame offsets are calculated from those two values. The index uses the original names, including `吉吉&米米`, `帅戈`, and `怪卡`.

## Changes

- Generalized `scripts/OriginalSpriteBounds.java` to discover sprite IDs and emit root frame, source frame count, SWF frame rate, bounds, translation, scale, and rotation state.
- Generalized `scripts/export-modern-assets.py` to validate all 13 original file hashes, export all 12 character SWFs, validate every PNG with Pillow, and generate 11 new character manifests plus `characters/index.json`.
- Added 1,008 new character PNGs under `public/modern/assets/characters/{2..12}`. Together with the unchanged 96 star1 PNGs, the index references 1,104 unique walking frames.
- Relaxed the production parser from exactly 24 frames to a nonempty sequential list so the two shorter original clips remain faithful.
- Added data integration coverage for index IDs/names, unique manifest and frame paths, production parsing, every original file hash, PNG signatures, positive dimensions, and RGBA color type.
- Added parser and timing behavior coverage for 20- and 16-frame clips plus missing direction, empty clip, and source-frame ordering failures.

`public/modern/assets/manifest.json` and `public/modern/assets/map.png` have no Git diff after regeneration, so the existing star1/2A URLs and data remain byte-compatible.

## TDD evidence

First RED, before any resources were generated:

```text
$ npx vitest run tests/modern/character-assets.spec.ts
Test Files  1 failed (1)
Tests       1 failed (1)
ENOENT: no such file or directory, open '.../public/modern/assets/characters/index.json'
```

Contract-correction RED, before relaxing the parser:

```text
$ npx vitest run tests/modern/assets.spec.ts tests/modern/character-assets.spec.ts
Test Files  2 failed (2)
Tests       4 failed | 1 passed (5)
20- and 16-frame cases failed with: down-right 动作帧数量错误
Integration case still failed because characters/index.json did not exist.
```

Export command and result:

```text
$ FFDEC_JAR=/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.analysis-tools/ffdec-26.2.1/ffdec.jar \
  FFDEC_JAVA=/opt/homebrew/opt/openjdk/bin/java \
  /Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/export-modern-assets.py
Exported original RGBA map and all character walking clips (1:24, 2:24, 3:24, 4:24, 5:24, 6:20, 7:16, 8:24, 9:24, 10:24, 11:24, 12:24 frames per direction)
```

Focused GREEN:

```text
$ npx vitest run tests/modern/character-assets.spec.ts tests/modern/assets.spec.ts tests/modern/animation.spec.ts
Test Files  3 passed (3)
Tests       8 passed (8)
```

Full unit suite, run once after the focused checks:

```text
$ npm test
Test Files  11 passed (11)
Tests       69 passed (69)
Duration    11.35s
```

TypeScript validation:

```text
$ npm run typecheck
vue-tsc --noEmit
exit 0
```

## Visual and binary checks

The exporter opened all 1,104 referenced frames with Pillow and required the SWF-derived dimensions, RGBA mode, and both transparent and opaque alpha extrema. The integration test independently read every referenced PNG, checked its PNG header, positive width and height, RGBA color type, and globally unique URL.

I generated `/tmp/star-cat-characters-contact-sheet.png` at 720×1740. It displays source frame 1 for all 12 characters in all four directions over a checkerboard, labeled with each clip's actual frame count. Visual inspection found:

- all 48 cells populated;
- all 12 identities distinct and correctly ordered;
- the four directions plausibly oriented for every character;
- no opaque rectangular backgrounds, clipping, or gross sprite mismatch.

## Concerns

- The shorter star6/star7 periods are now represented faithfully. Task 3 must display the actual clip length rather than assuming 24 frames; the task owner has recorded this contract correction.
- The contact sheet samples frame 1 of each direction. All remaining frames received automated bounds and alpha checks, but were not individually inspected at large scale.
- FFDec/JPEXS and Java remain offline exporter dependencies only; runtime behavior remains PNG/JSON with no SWF or Ruffle dependency in the modern path.
