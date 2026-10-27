# Batch 29 local visual review

Phase: read-only verification of the supplied bridge registration and red-disk candidate. Reviewed on 2026-10-24. No code, runtime asset, or existing repository file was changed. No full-map re-run or image generation was performed.

## Findings

No confirmed actionable visual defect was found in the four supplied images.

- `native-bridge-registered.png`: the south bridge is one continuous, plausible road surface from the upper mainland to the jail plaza. The deck, four reward disks, parallel curbs, neighboring cliff, foliage, water and prison remain coherent. No loose white fragments, detached curb pieces, torn objects, displaced scenery, or visibly melted/stretch-distorted major form was observed.
- `native-bridge-upper-joint.png`: the upper-left curb has a shallow direction/width transition as it joins the mainland road. This is a visible but plausible entrance transition; it does not create a disconnected deck, impossible road width, or jagged seam. Both borders and the gray road texture continue across the joint without an obvious patch boundary. This is not being held to exact original-pixel alignment.
- `native-bridge-lower-joint.png`: the bridge meets the rear/right edge of the jail plinth continuously. White curbing terminates/occludes coherently at the plinth and adjacent tree. The lower-left bridge border is partly covered by the jail dome as expected from depth order. No white shard, gap through the bridge, floating curb, broken plinth corner, or unnatural road kink was observed.
- `red-disc-comparison.png` (left old west / middle candidate west / right source east): the old west disk has a large plain `20`, while both the candidate west and source east share the same smaller pink `20`, white/yellow decorative motif, gloss, red ring and shadow. The candidate therefore repairs the confirmed same-type drawing inconsistency without deciding that either disk must use a plain `20`. Its curved outer ring stays continuous and blends into the road; no obvious square patch edge, white fringe, clipped ornament, doubled ring or broken numeral was observed at supplied resolution.

## Earlier red-disk observation, now resolved by the shown candidate

The original east and west disks have near-identical complex white/yellow contents; both are type 28 (游乐场). Earlier final-map art had a plain `20` at west and decorated `20` at east. That was a confirmed same-type visual-consistency issue, independent of speculation about the intended original motif. The middle candidate in the supplied comparison now matches the east motif and styling, so this specific inconsistency is not a remaining defect in the candidate.

## Evidence and limits

All four images inspected directly at their supplied resolution:

`D/.analysis-cache/map-continuation-20261023-batch29/`

1. `native-bridge-registered.png`
2. `native-bridge-upper-joint.png`
3. `native-bridge-lower-joint.png`
4. `red-disc-comparison.png`

`D=/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/non-character-assets`.

This conclusion is about the supplied current composites/candidate. I did not independently confirm their hashes against every installed region, re-run the full map/runtime, or establish final user visual acceptance. Tiny resampling/texture differences visible only under further enlargement are not treated as defects unless they produce a visible seam or malformed object at the supplied view.

## Follow-up: final west red-disk and grass runtime views

Reviewed `native-west-red-unified.png` and `native-west-grass-corrected.png` after the supplied four local comparison images.

**P2, high confidence: a horizontal compositing discontinuity remains below/left of the west cyan 10 disk.** In the 1000 x 800 west-red runtime screenshot, y approximately 655 is a straight horizontal boundary spanning grass, the white curb, the asphalt and the cyan disk's lower-left outer ring. The ring develops a small clipped/stepped notch at that height. This is an actual visual splice, not a disk highlight or a plausible object occlusion, because the same boundary crosses several unrelated surfaces. This observation does not identify which edit or layer introduced it.

Given screenshot center (267,1501) and zoom 5: the long boundary is approximately logical y=1552, x=167..304; the clearest disk-ring defect is approximately logical bbox [294,1551,305,1558]. Evidence: `b29-cyan10-lower-seam.png` in this report directory (a 2x crop of screenshot pixels [350,590,1000,740]). The unmodified runtime screenshot remains in the batch29 cache.

The unified red 20 disk itself has coherent decoration and a smooth ring. The grass runtime view confirms the strong bright/dark checker was reduced; residual faint diagonal/diamond repetition remains, without a newly obvious hard mask or a malformed tree/platform edge in that grass view.
