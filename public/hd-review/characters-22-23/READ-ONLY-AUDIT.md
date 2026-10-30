# Items22/23 source audit, 2026-10-29

Phase: read-only source/consumer analysis. Exit: complete11-NPC identity/frame matrix, reusable original references, exact source placements, consumer callchain, smallest coherent low-memory presentation strategy. No repository files modified. Original SWF SHA256 verified790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba. Git status remained clean.

All repo paths below resolve from /Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/non-character-18-21/.

|NPC|Identity cue|Root→child|Outer/inner frames|Unique source bitmaps|Current exported unique composites|Mini symbol|
|---|---|---|---|---|---|---|
|2|财神 golden lucky cat, gold plaque|310→309|40/54|4 parts|5|303|
|3|穷神 long ears, pale head, blue clothes|372→371|1/12|4 full poses|4|364|
|4|福神 golden cat red belly bib|226→225|40/55|2 fixed parts|1|221|
|5|衰神 white mummy and purple bat|335→334|1/22|11 full poses|11|313|
|9|恶犬 yellow puppy|293→292|1/104|5 full poses|5|283|
|10|天使 blond child and wings|361→360|40/18|4 full poses|4|353|
|11|恶魔 red hair, bat wings|350→349|40/18|6 full poses|6|338|
|12|交警 orange fox, blue cap/uniform|263→262|1/81|6 full poses, front/side|6|251|
|13|流氓 green frog, black/green outfit|280→279|1/33|7 full poses|7|266|
|14|小偷 white rabbit, blue bag|248→247|1/24|5 full poses|5|238|
|15|乞丐 brown monkey, banana hat|235→234|1/26|3 full poses|3|229|

Every NPC has original shadow shape217 at depth1. Source body is depth2. Root2/4/10/11 have40-frame body vertical float and separate shadow shrink: source root frame1 body Y=-77/-70/-105/-108 respectively; frame20 is5px higher; frame40 returns. Shadow at(28,20), scales1.1199951×0.80000305 at1/40,1×0.7140045 at20. No action tag stops those four outer timelines. Current scripts/ExportWorldAssets.java:nestedTimeline freezes source root atframe1 and repeats for inner length; current PNGs omit this outer float. Therefore npc4's current55 identical PNGs do NOT prove original static behavior.

NPC2 has original separated parts: bitmap300 body;299 raised hand/ball moves Y2.4px↔0;301/307 alternative hand at specific frames. Source child225 forNPC4 places bitmap219 body and nested224→bitmap218 head; both placements stay fixed throughout55frames. For others the source imports full-character bitmaps; wings/ears/turns are authored silhouette changes. Do not replace those by one whole image bob/scale.

## Original reference artifacts

- original-npc-and-trait-contact.png:11world rows then6trait rows,5 samples per row.
- npc-{2,3,4,5,9,10,11,12,13,14,15}-all-source-poses.png:11transparent sheets; all current unique composites upper rows, all original native source bitmaps lower rows; edge labels.
- npc-pose-index.json: exact zero-based current-composite index for every source inner frame and first source frame of each pose.
- frame-bitmap-index.json: exact native bitmap IDs for every inner frame plus RLE ranges.
- source-timeline.json:37sprites, exact source matrices/alpha/depth/time/bounds with existing ProbeContinuousArtwork schema.
- source-bitmaps/:64original native bitmap images, no AI content.
- source-layers.txt and shape-bitmap-map.txt:human-readable JPEXS evidence.

All artifacts live under /tmp/starcat-22-23-source-audit/ only. Existing ProbeContinuousArtwork.java was reused in a scratch copy with source root IDs changed; original SWF opened read-only, never saved.

## Item23

All mini-npc symbols are one-frame original icons; they do not need invented animation. mini-npc-1 stays deferred with item20. Barrier/mine miniature icons belong to existing scope and are not part of eleven NPC identities.

All six trait clips have60frames at30fps, source1319. Its pic child1313 is a selector movie clip, not a60frame animation: selected frame9→shape1302→bitmap1301,12→1304→1303,13→1306→1305,14→1308→1307,15→1310→1309,23→1312→1311. Each selected picture is400×300. Shared frame1316→bitmap1314. Full trait canvas462×433, offset(-231,-212). Source placements: pic(-200,-153), border(0,4.5), title text(-157.3,-185), body text(-199.95,162.85). Geometry/text remains constant all60frames. All current trait PNGs have1unique image per clip. Actions atsource10/30/60control interactions/timing, not geometry. Thus retain intentional holds; do not add azoom/float that changes meaning.

Source illustrations depict humans, not the map's animal NPCs. Identity refresh should match encounter:9dog chasing/fighting the player,12fox traffic police stopping/fine,13frog extorting/gifting tickets,14rabbit thief/wallet-loss scene,15monkey begging/gifting money,23lost-property attendant. Source23 has its own long-haired counter attendant; deferrednpc1/cat ticket attendant must not be reused as an inferred identity for23. Human/player choices need user/style consistency, but avoid expanding into playable-character production.

## Runtime consumers

- scripts/export-world-assets.py:CLIPS defines source IDs, bounds, frames,30fps; scripts/ExportWorldAssets.java:nestedTimeline controls child export.
- src/modern/features/map/world-assets.ts:parseWorldAssets validates original21clips and exact frame counts. Keep original profile source manifest intact.
- src/modern/features/assets/approved-artwork.ts:approvedWorldAssets called after source validation; profile original returns input unchanged. This is the clean HD override seam; currently combines approved/effects world clips, while continuous JSON only participates in activity overrides.
- src/modern/features/map/MapScene.ts:setWorld selects npc-${id}; worldAnimations owns shared textures and elapsedMs; ticker calls worldFrameAt and updates texture/offset. World marker draw order is grid row*100+column. Same scene handles attached god sprites, so verify those uses too.
- src/modern/features/game/InteractionPanel.vue:portalPrepared loads mini icons; portalOverlays positions them at(170+column*14,90+row*10),scale.25; notice portrait also uses mini-npc frames.
- src/modern/features/game/controller.ts:showNotice starts trait-${npcId},60source frames;9chains car2,14chains show-npc4.2× mode jumps29→55; skip→55. Preserve source clock and transactions.
- src/modern/features/game/NativeActivity.vue:loads ActivityClip, displays current frame and registered text, supports overlays/placement links and60fps presentation interpolation via activityPresentationFrame. Shared60frame trait texture aliases are valid but fetch dedupe/cache behavior must be checked before multiplying records.
- src/modern/features/game/game-visuals.ts:hiddenWorldCells hides the encounteredNPC during its trait; dog staging keeps original location through trait/car2 early frames.
- Original scene source:docs/modernization/evidence/source/play.swf/scripts/frame_4/DoAction.as functionsbalk_pg9/12/13/14/15 andend_pg23 set trait.pic.gotoAndStop respective selector frame.

## Recommended smallest coherent strategy

HD-only multi-layer descriptor at existing approvedWorldAssets seam; one/two/few shared textures per identity plus explicit pose schedule. Each NPC view needs separate shadow and body container; body may contain fixed parts. Reuse elapsedMs fromMapScene. For2/4/10/11 evaluate outer40frame placement/shadow track independently from inner pose schedule; interpolate source translation/scales to60fps without baking combined cycles. For4 a single fixed-body composition suffices; source2can retain its actual separated hand/body parts. For10/11/5 preserve wings and bat via small silhouette keyposes or separated wing layers. For12require front and side master poses,3/9/13/14/15require their few real expression/turn keys. Do not claim one portrait rocking reproduces authored pose animation. Keep intentional long holds (dog10–52and62–104, frog13–33, beggar1–18, officer front1–40/side41–81) unless explicitly chosen style enhancement is disclosed.

Minimap should reuse each approved identity's fixed canonical pose with original mini canvas/offset registration, no need for additional generated mini artwork. Six trait panels should each useonefixed new scene texture and repeated references over60frames, preserving text fields, source duration andskip. Reuse accepted item19 frame styling if desired without overwriting its assets. Scope excludesnpc1/fog/witch/lottery and existing18/19/21.

Material uncertainty: source outer loop boundaries may preserve or restart nested child playheads depending on AVM1 display-list behavior; this has not been tested in original liveRuffle thisaudit. Do not infer exactLCM phase behavior solely fromstatic tags. The dump contains all source layers needed to implement or probe it. No tests run:read-only source extraction plusRGBA/hash inspection, not productionE2E or new art acceptance.

## Focused verification for implementation

Existing tests/modern/world-assets.spec.ts, continuous-artwork.spec.ts, activity-assets.spec.ts, activity-presentation.spec.ts, activity-controller.spec.ts, activity-review-regressions.spec.ts, native-activity-motion.spec.ts; browser tests/e2e/modern-continuous-artwork.spec.ts, modern-activity-layout.spec.ts, modern-activity-recovery.spec.ts. Reuse scripts/verify-continuous-renderer.mjs pixel/clipping checks and source-timeline assertions, but addNPC-specific cases. Verify natural marker rendering/all11 identities,60fps interpolation,pause/speed, god attachment,seams/foot anchors, mini-grid alignment andreadable identity at.25scale, sixtrait branches/skips/restore andunchanged rule/RNG states. Assertnpc1original references stayexactlyunchanged; existing01–21data hashes must stayprotected. Art acceptance stillrequires userreview, not source/tests alone.
