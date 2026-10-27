# Static map object / semantic review, 2026-10-23

Phase: read-only visual review. Outcome: compare current complete final base to original map for missing or extra key object structures, malformed objects, incoherent perspective, and misplaced landscape. No repository file was changed.

Inputs:
- Original `public/modern/assets/map.png`, logical 2700 x 2552.
- Final installed `public/modern/hd-map/full-map-v1/base.webp`, physical 5400 x 5104, logical density 2.
- Batch 27 draw regions used only for locating native source; old quilt/screenshot material was not used to claim current defects.
- Evidence JPEGs: original on left, final base on right. Transparent background composited neutral gray for focused crops; the original overview was RGB-converted white / final black. Background difference is not a finding.

## Result

No confirmed high / medium severity building, tree, bridge, or landscape semantic defect was found in this review. Shape polish, texture, leaf density, grass detail and cliff faceting differ but remain coherent and match the permitted style-change scope. This is a visual static-asset result; it does not establish runtime rendering, all native partition seams, dynamic-over-map behavior, or user acceptance.

One uncertain road-marker issue was separately handed to the marker reviewer, not counted as an object defect:
- East amusement red disk: logical bbox approximately [2290, 940, 2390, 1015]. Final base contains flower-like / white-yellow shapes behind pink `20`, noticeably busier than the new west amusement plain white `20`. The original east disk itself has complicated white-yellow patches, so map.png alone does not prove the new shapes are extra. Confidence high that final legibility is weaker; confidence low about original intended symbol semantics. Evidence `24-east-red20-detail.png`, `21-east-amusement.jpg`, `22-west-amusement.jpg`. Native source r4c9 is batch-26/r4c9.webp, logical rect [2112.1149, 932, 239.9138, 239.9138]. The base native source retains a historical dice-correction status label. Batch 20 supplied separate local overlays correcting the four dice icons; the historical base-layer label must not be interpreted as an outstanding current defect.

Northwest smooth grass now has extra low rounded bushes (roughly x=570..1050, y=430..550). They are plausible landscaping, do not obstruct travel, and are treated as allowed detail/style changes rather than a defect. Existing three tree silhouettes there remain, despite more textured canopies. Evidence `14-NW-bushes.jpg`.

## Coverage

Full map reviewed in 16 tiles: `compare-r0c0.jpg` through `compare-r3c3.jpg`, 675 x 638 logical pixels each. This covers the complete [0,0,2700,2552] extent including clouds, sky gaps, rim vegetation and cliffs.

Detailed structural comparisons (file names describe each crop):
1. Top hospital: heart, cross, three main colored volumes, entrance, small round tree preserved (`01-star-hospital.jpg`).
2. Northwest yellow camera-shaped building: lens, side fins, paired entrance columns, two platform round trees preserved (`02-yellow-camera.jpg`).
3. Northwest blue dome: roof spinner, pipe frame, main body and platform preserved (`03-blue-dome.jpg`).
4. North L-shaped yellow building: body, magenta apertures, L badge and **five conical trees** present (`04-yellow-L.jpg`, `16-yellow-L-five-trees.jpg`).
5. Northeast blue castle: rear bar, central dome, twin side cylinders, entrance ramp, two conical trees and adjacent broad tree preserved (`05-blue-castle.jpg`).
6. West orange/green building: orange tower with two rods, green sloped front, small yellow side piece and four round trees preserved (`06-west-orange.jpg`).
7. Central city group: principal colored tower volumes, decorative balls, ramp, conical trees and `TOMORROW CITY` label preserved (`07-center-city.jpg`).
8. East orange/green building: red fin, orange front volume, green rear/sloped body, yellow side piece, staircase and three round trees preserved (`08-east-orange.jpg`).
9. South orange cube: ribbon and badge/cross pieces, main cube, two conical trees preserved (`09-south-cube.jpg`).
10. Southeast H/green stack building: three green layers/buttons, H mark, two front pedestals, rear roof and left conical tree preserved (`10-H-building.jpg`).
11. Southwest bent-roof building: yellow/red curved roof, orange roof, pink body, columns, stair and five conical trees preserved (`11-southwest-roof.jpg`).
12. Southeast green camera building: lens, roof controls, side ladder, three round trees preserved (`12-green-camera.jpg`).
13. Bottom jail: dome, hanging lock, three chain/stone forms, plinth and both neighboring trees preserved (`13-jail.jpg`, `23-bottom-oasis.jpg`).
14. Four utensil / futuristic small plazas: all four remain with their main dish, upright implements and perimeter decoration (`17-N-park.jpg` through `20-E-park.jpg`).
15. Two amusement grounds: each retains one blue closed track, two small blue cars, yellow wheel with green supports, front two-tower castle, four surrounding low leaf clumps, perimeter road and property strip; no impossible new track/support connection observed (`21-east-amusement.jpg`, `22-west-amusement.jpg`).
16. Eight gray 3-layer monuments: all eight retained at original relative positions (`25-eight-monuments.jpg`).
17. Two bridges: span endpoints and continuous deck preserved; both originally have no side guardrail and new design follows that (`26-north-bridge.jpg`, `27-south-bridge.jpg`).
18. Tree and shrub groups: top island rim, northwest plateau, northeast/east standalone trees, west margin, road medians, south trees, prison trees and cliff greenery visually matched by position and canopy silhouette. No confirmed missing main tree (`15-top-ring.jpg`, `28-west-trees.jpg`, `29-east-trees.jpg`, all 16 grid comparisons).
19. Four fenced empty plots: original footprint, opening direction, paired wooden fence sides, adjacent properties and leaf-clump rows retained (grid r1c1, r1c2, r2c1, r2c2).
20. Cliff / oasis / cloud groups: 4x4 grid plus `23-bottom-oasis.jpg`. Polygonal rock detail changes do not add an incoherent landform or malformed join visible at reviewed scale. Sky gaps agree with original overall island layout.

Verification: direct visual inspection of current final base at overview, every 1x logical grid cell, targeted 2x structure crops, and r4c9 native density 4.3515625. No code or runtime tests were needed for this read-only asset comparison. Script and all generated evidence are confined to `/tmp/star-cat-map-review-20261023/objects`.

## Follow-up: red disk semantics and historical metadata correction

`map.json` stores grid IDs. The east red disk is ID 203 at column 38 / row 16; the west counterpart is ID 204 at column 1 / row 29. `card-board.json` records both as type 28, ordinal 1, with facing 1 vs 2. `rules.json` names both 游 乐 场. The original decompiled frame-5 `asset_pg` data likewise lists type 28 entries at [38,16] and [1,29]. Thus these two disks have the same gameplay meaning, despite their different art clarity. There is no type-26 reward-of-20 record here; the printed 20 alone does not establish the tile type.

`scripts/export-modern-assets.py` identifies the complete original map as bitmap character ID 20 from play.swf, exported as `20_map.png` at 2700 x 2552. This means enlarging the raster cannot reveal independent vector letters. A fresh export was attempted to /tmp using the existing JPEXS 26.2.1 installation, with results recorded below. No independently separated higher-resolution type-28 road symbol has been established.

Both original type-28 disks contain near-identical white/yellow complex patches; the original west disk does not provide a clearer plain-20 reference. These observations do not establish whether the original raster intended a flower/icon plus 20, or distorted/glared lettering alone. Accordingly this remains a low-priority legibility observation, not a confirmed semantic or extra-object defect.

Fresh JPEXS export succeeded: DefineBitsJPEG3 character ID 20, exported name map. Export pixel dimensions (2700, 2552); RGBA pixel comparison with current original map has no difference, and PNG SHA-256 also matches (`e95bc2626fa2b1b89cdb8d52e84fbb69153aa97aebaeb2cedf5b5f3a34556653`). Therefore the complicated east-disk patches demonstrably exist in the embedded SWF map raster. This establishes original raster contents, not their intended symbolic meaning. Pair evidence: `30-original-type28-pair.png`.
