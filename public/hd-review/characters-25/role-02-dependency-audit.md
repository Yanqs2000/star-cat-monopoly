> 本文为实现前基线取证快照，表中的“否”记录当时的绕行入口；本轮已修复这些入口。当前实现与验证见 `docs/modernization/aniu-25-delivery.md`，原文件与SHA证据保留。

# 阿牛（ID 2）全入口素材依赖只读审计

快照 UTC：2026-10-31T06:15:01.975708+00:00。工作区：`/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/non-character-18-21`；分支 `feat/characters-25`，HEAD `20d9c55ca149731143585a530a6ddb17ec04dc26`。

阶段为只读分析；退出标准是从真实 modern 调用链列齐 ID2 素材、验证源文件与共享关系、指出接入缺口。没有修改产品文件、Git 或进行生图；这是制作前后可复核的依赖快照，不是运行验收。父任务仍在修改，结论请以 JSON 的 codeSnapshot 哈希为时点。

## 结论

阿牛对应 **1144 张原始调用素材**：四向 walk 96、四向六种 reaction 1000、共享 god 徽记 6、活动附属 41、月结排名人物 1。源文件与当前 HD 解析目标均存在；角色2目录实际1102张 PNG 与两个 manifest 的枚举完全一致，没有未列入的额外 PNG。

当前新骨架已经由 characters-25-registry 仅对 HD/active ID2 启用；本快照记录71张新 rig 纹理。它不会自动覆盖选人/加载缩略图、face/head、月结人物、fly、carnival 和 god。旧分辨率提高或旧 JPEXS 2x 文件存在，不代表这些入口已经使用本轮新阿牛形象。

profileAssetUrl 的旁路共七处调用族：GamePanel 旧face；MonthlySettlement、EndgamePanel、PlayerWallet、GameReferencePanel、InteractionPanel 目标头像以及 saves/ui-assets 的旧monthly人物。后六处共用同一 monthly/champions/2.png，修图和修映射需要同时检查。

六枚 god 的原 PNG 和通用 2x WebP，分别跨12人逐字节相同，可按神灵ID归共享。NPC22/23 已验收提供同源神灵的身体/小地图形象，但没有已登记的同构图神灵附身徽记；3/5/10/11 的原徽记还有文字、圆框和头像构图，不能直接拿整身 NPC 替换。

## 原始来源

- `public/original/star2.swf`：1006099 bytes；SHA-256 `e6210696f011727e4df393f6568c4099a545d70b26d0886f042204bcf02c106a`。
- `public/original/play.swf`：9715809 bytes；SHA-256 `790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba`。

walk/reactions 从 star2.swf 导出。face、head、fly、carnival 及 monthly 的原始人物来自 play.swf。manifest、每张源图、HD解析目标的绝对路径、真实路径、原尺寸、SHA、源symbol/frame/offset均在 `role-02-dependency-sources.json`；完整帧列表不在本文重复。

| 类别 | 原路径模式（相对 public/modern） | 数量 | 原像素尺寸 / 源symbol |
|---|---|---:|---|
| walk | assets/characters/2/walk/{facing}/{1..24}.png | 96 | DR69×98/s126；DL64×98/s300；UL70×87/s474；UR61×99/s646 |
| reactions | assets/characters/2/reactions/{name}/{facing}/{frame}.png | 1000 | 四向各 neutral1、ready1、happy57、sad63、hurt60、cheer68；逐clip真实尺寸见JSON |
| face | assets/activities/face-2/1.png | 1 | 53×43；s2042 的阿牛帧 |
| head | assets/activities/head-2/1.png | 1 | 212×172；导出名head2，s1661 |
| fly | assets/activities/fly-2-{1..4}/1.png | 4 | 135×214、154×216、140×212、167×214；s982，内层选择阿牛四heading |
| carnival三姿态 | assets/activities/carnival-boy-2/{1..3}.png | 3 | 115×113；s3454 |
| carnival左行 | assets/activities/carnival-walk-2-left/{1..16}.png | 16 | 97×113；s3454 子时间轴 |
| carnival右行 | assets/activities/carnival-walk-2-right/{1..16}.png | 16 | 97×113；s3454 子时间轴 |
| 排名/月结人物 | assets/monthly/champions/2.png | 1 | 852×812，原symbol2517 frame2，JPEXS 4x导出 |
| god | assets/characters/2/reactions/gods/{2,3,4,5,10,11}.png | 6 | 49×57、45×57、46×48、45×57、45×57、45×57 |

注意：monthly 文件自身虽然852×812，provenance明确是“Unmodified original ranking character frames, exported at4x; shared by both profiles at compact display size”。它没有成为本轮生成母版。原银行symbol2527 frame7实例man执行man.gotoAndStop(characterId)；ExportMonthlyAssets.java:21–27固定导出symbol2517各角色帧。

carnival-boy三态原图都会预加载，但 CarnivalStage.vue:33 实际站立只画frame1；pose2/3实际改画左右walk子时间轴，不画boy原图2/3。仍应完成3态源覆盖，并以真实左右走/站立验证，不仅计数。

## 所有入口是否真正经过 profileAssetUrl

| 入口 | 真实调用点 | 当前映射 |
|---|---|---|
| selection thumbnail | `src/modern/ModernApp.vue:128` | 是：profileAssetUrl direct |
| loading portrait | `src/modern/features/game/GameLoading.vue:8` | 是：profileAssetUrl direct |
| map walk | `src/modern/features/map/MapScene.ts:161` | 是：profileAssetUrl in loadTexture; rig25 chosen line300 |
| map reactions | `src/modern/features/map/MapScene.ts:444` | 是：profileAssetUrl via loadTexture/preload |
| god overlay | `src/modern/features/map/MapScene.ts:454` | 是：profileAssetUrl through loadTexture at458 |
| turn portrait | `src/modern/features/game/TurnControls.vue:29` | 是：profileAssetUrl direct |
| player sidebar | `src/modern/features/game/GamePanel.vue:95` | **否：**Direct BASE_URL + old asset URL |
| monthly champion/ranking | `src/modern/features/game/MonthlySettlement.vue:14` | **否：**Direct URL + preparedImages keyed by original path |
| result/defeat/bankruptcy actor/ranking | `src/modern/features/game/EndgamePanel.vue:13` | **否：**assetUrl explicitly called profiled=false |
| wallet | `src/modern/features/game/PlayerWallet.vue:6` | **否：**Only assets/ui is profiled |
| asset ranking/stock/all holdings | `src/modern/features/game/GameReferencePanel.vue:22` | **否：**Only ui/ is profiled |
| card target player portrait | `src/modern/features/game/InteractionPanel.vue:181` | **否：**preparedImage directly receives old URL |
| save/load UI preloader | `src/modern/features/saves/ui-assets.ts:31` | **否：**pushes old URL without profileAssetUrl |
| court target portrait | `src/modern/features/game/InteractionPanel.vue:145` | 是：displayActivities mapped via ModernApp295, then animation preload |
| mini map player head | `src/modern/features/game/InteractionPanel.vue:111` | 是：displayActivities mapped via ModernApp295, then animation preload |
| portal four headings | `src/modern/ModernApp.vue:372` | 是：displayActivities mapped line295; setActivity/loadTexture |
| carnival stand/left/right | `src/modern/features/game/CarnivalStage.vue:33` | 是：displayActivities mapped ModernApp295; preparedAnimationFrames |

间接映射链：ModernApp.vue:294–295 先 mapAssetProfile 整份活动manifest，再 approvedActivityAssets 替换已批准整段clip；animation-preload.ts:31 与 MapScene.ts:161 再将实际URL解析。故法庭face、小地图head、portal fly和carnival虽然组件内无直接profileAssetUrl调用，实际已经过它。

**注册陷阱**：profiles.ts:14 的 staticOverrides 只从 static-hd-assets/approved-non-character 中 enabled assets 构建；characters25.runtimeImages 在下一行仅加入 staticResolved，供像素尺寸/密度校验。因此只追加 characters25.runtimeImages，既不会把旧face/head/champion的source指向新图，也不会替换活动clip。需要真实source→url覆盖登记，或在approvedActivityAssets的clip层替换，并让全部旁路入口用同一解析。

**默认HD fallback**：没有显式override时，assets/*.png 被替为 assets-hd/*.webp。此路径是本工作树指向主checkout的symlink；机器清单记录 realPath，全部对应HD文件已实读并哈希。通用HD manifest说明face/fly/carnival为JPEXS 2x原活动时间轴、内嵌位图仍保留原生细节；不能把文件存在视为本轮高清重绘完成。本快照的assets-hd/monthly默认目标也存在，但仍是旧人物来源；monthly接入profile后还需显式新形象override，不能把进入2x fallback当成新阿牛覆盖。

## 六枚 god：共享证明与NPC22/23复用边界

原导出由 ExportReactionAssets.java:223–245 读取star2 root depth3名为npcz的15帧sprite，取godId−1帧，再保留原root placement；四向共用一个覆盖源。下面每组12张原图SHA唯一值数量均为1，通用HD的对应组也均为1。共享纹理仍应保留每个角色manifest的offset注册；JSON保留72项原注册以供检查。

| god ID | 名称/原构图 | 原PNG SHA-256（12人一致） | 同源已验收图及可用边界 |
|---|---|---|---|
| 2 | 财神：财字+猫 | `1b2fc03b028f59dfd4964a57f3fca7188c1fa77c096f828cd7439d0e32f7c651` | npc22/npc-2/1.webp 与 npc23/mini-npc-2.webp：整身/小地图形象；可提供头部/形象来源，**没有直接同构图覆盖** |
| 3 | 穷神：穷字+圆框头像 | `69a675d8630b208a3dd853952a2c71e4e9a6870abc38de6a084cd99ff159df4a` | npc22/npc-3/1.webp 与 npc23/mini-npc-3.webp：整身/小地图形象；可提供头部/形象来源，**没有直接同构图覆盖** |
| 4 | 福神：福字+猫 | `0bf0a82785a5a0f52f9ef060536cb9a46a502b6b6544ef0d74c83e92331921fb` | npc22/npc-4/1.webp 与 npc23/mini-npc-4.webp：整身/小地图形象；可提供头部/形象来源，**没有直接同构图覆盖** |
| 5 | 衰神：衰字+圆框头像 | `7faad450e6b2aa7e2937169266cb929b028408827e1a9929d9ddd8f59d87dedc` | npc22/npc-5/1.webp 与 npc23/mini-npc-5.webp：整身/小地图形象；可提供头部/形象来源，**没有直接同构图覆盖** |
| 10 | 天使：天字+圆框头像 | `3b413a620ec971fe30b41bbf8817369575f8b51a6f17e121e2808207d38ff721` | npc22/npc-10/1.webp 与 npc23/mini-npc-10.webp：整身/小地图形象；可提供头部/形象来源，**没有直接同构图覆盖** |
| 11 | 恶魔：魔字+圆框头像 | `f2fbe6950c221d7ce5c36cf02597eea84e27c015c082db6fc6b4976a847f8d50` | npc22/npc-11/1.webp 与 npc23/mini-npc-11.webp：整身/小地图形象；可提供头部/形象来源，**没有直接同构图覆盖** |

已验收来源的证据：public/hd-review/characters-22-24/acceptance.json status=accepted、acceptedCommit=9a679a5、revision=npc-motion-r2。src/modern/data/npc-22.json的worldClips进入approvedWorldAssets；npc-23.json的activityClips进入approvedActivityAssets。两者没有godOverlays注册，且现有静态override没有指向六枚god源。

已实际查看三列对照图 `role02-gods-npc-comparison.png`：原god徽记 / 已验收NPC23图标 / 已验收NPC22首帧。财神、福神原徽记都有独立“财/福”字；穷神/衰神/天使/恶魔是文字圆框头像。现有整身NPC可裁头像并保留来源身份，但完整替换仍需徽记装配、文字清晰度、原尺寸/offset与阿牛头顶位置验证；不能宣称已有六张可直接复用的同源高清徽记。

## 遗漏来源/额外人物插画检查

1. 已枚举两个角色manifest的所有图片，且反向扫描assets/characters/2目录：1102张PNG无孤儿、无缺失。
2. 已从activities/manifest反查face-2、head-2、fly-2-*、carnival-boy-2、carnival-walk-2-{left,right}，并额外找到不在该活动manifest的monthly/provenance。monthly是本次最容易漏掉的独立人物插画源。
3. 已查看41张luck、17张cards、14组共享活动背景/结果原图的接触表 `role02-shared-illustration-scan.png`。未见额外可识别的黄色牛阿牛肖像；luck里的漫画人类与NPC ID2财神是不同身份，不应因数字2扩展到阿牛。共享结果背景没有嵌入阿牛，阿牛单独由monthly人物叠入。
4. 本次覆盖modern实际可达入口及原asset manifests；没有重新穷举play.swf每一未导出symbol。未被modern调用的Flash历史位图不能由本审计证明不存在。

## 当前缺口与父任务完成标准

- 阿牛骨架walk/reactions已注册，仍需真实与卷毛同场掷骰、四向移动和六种反馈确认；本审计没有运行游戏。
- 选人/加载仍指向旧walk首帧，只启用地图rig不足以覆盖这里；应明确映射到新同身份缩略图。
- 需要face/head/monthly的显式覆盖，并修七处旁路调用族；同步保存读取预加载键，避免新旧URL查表不一致。
- fly四heading与carnival三态/左右16帧子时间轴需要生成物→实际clip登记及像素密度、offset核对；母版存在不代表已经接入。
- 六枚god可归共享，但旧2x通用徽记不是22/23新图；如要求全部新高清，仍缺同构图徽记装配及阿牛头顶显示检查。
- 检查原版profile仍能加载原图、HD切换/读取存档不缺图；用真实浏览器完成目标入口，再报告“全部完成并接入”。

这些是必要接入/验证范围，不是修改指令。本子任务严格只写/tmp审计产物。

## 已存在的阿牛母版快照

| 文件 | 原生像素 | SHA-256 |
|---|---|---|
| `public/hd-review/characters-25/masters/role-02-carnival-master-r1.png` | 1774×887 | `7d168649ba0f3c6912bf350b9828669a0300f630a74e67751b1731e6ac94f4b5` |
| `public/hd-review/characters-25/masters/role-02-expressions-r1.png` | 1448×1086 | `cdddf4b77011416ac50bb7071f39a22b0acf19c8c0a5fbf5457dc00d7b1605ac` |
| `public/hd-review/characters-25/masters/role-02-flight-master-r1.png` | 1774×887 | `9ad25c16c2a535883d2bd0a2207e143c1e047dc1ead3d6d0c499da05efa941b6` |
| `public/hd-review/characters-25/masters/role-02-neutral-r1.png` | 1774×887 | `ba971fddb7fc743171d2a79706fafff7b76e36bbec07ee2be10e3a49d6449c7c` |

## 产物

- `role-02-dependency-sources.json`：1144张源图/解析目标逐图元数据，44组归类、17入口调用族、72原god与72通用HD哈希对照、NPC22/23候选、代码快照。
- `role02-gods-npc-comparison.png`：六枚共享徽记及NPC高清来源对照。
- `role02-original-derived-contact.png`：monthly/face/head/fly/carnival原图。
- `role02-shared-illustration-scan.png`：共享插画补漏视觉检查。
