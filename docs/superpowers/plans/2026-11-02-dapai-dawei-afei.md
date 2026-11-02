# 大牌、大尾、阿飞完整素材 Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` inline, one complete character at a time. This continues the user-selected and repeatedly accepted character-25 workflow.

**Goal:** 合并已验收3/4/7，然后完成5/8/9所有人物素材并接入和验收。
**Architecture:** 独立身份完整包、固定母版与闭合分件、位移接地及原活动时长；复用现有Pixi播放器与静态/活动路由，只按解剖需要扩展。
**Tech Stack:** Node24、Vue/TypeScript/Pixi、Python/Pillow/OpenCV、Vitest、Playwright本机Chrome、内置image_gen。
**Spec:** 用户本轮明确目标；`docs/modernization/characters-25-trio-delivery.md`已验收方法；`public/hd-review/characters-25/source-index.json`原作结构与时序。

用户目标：先把已验收ID3/4/7合并主分支，再完成最后三位可选人物ID5大牌、ID8大尾、ID9阿飞全部素材。继续沿用已连续验收的人物制作方法：固定身份母版、同源完整分件、连续关节动作；逐位完成全部入口和实机验证，最后由用户确认形象与自然动作。本次明确授权覆盖旧计划“其他人物暂停”的历史状态。用户未要求推送远程。

当前阶段：实现。先行合并已完成，main=`42fb2bc0c4ee6ce8e479eb245085f48b27f5bb45`；主分支843项单测和类型检查通过，32个用户本地文件未变。75个研究文件保留。制作分支`feat/dapai-dawei-afei-artwork`，沿用隔离工作副本，不删除工作区。

1. 原作审计：为5/8/9补全walk/reactions/gods/activities/monthly逐帧清单、原SWF与PNG哈希、四向与活动接触表；额外检查是否存在专属活动/trait调用，不能仅凭共用九个活动ID断言完整。
2. 大牌完整闭环：保留红鬃、圆耳、金色狮子座额饰、原面孔、短身体和红球尾；分别制作表情、闭合躯干/肩/腕/脚供体、地图四向七态、头像、四向飞行、游乐场与月结。自然移动两脚接地，尾巴独立；按原版核对飞行装备/闭眼约定。
3. 大尾完整闭环：先从原作核对实际足数、钳/尾与遮挡关系，按蝎型结构配置独立关节与多足相位，不能套普通双足整图摆动。完成同样全部入口再推进阿飞。
4. 阿飞完整闭环：原作半人马结构，人体上半身/双臂、马身四腿及尾部分开；四脚真实支撑与起停/转弯接触处理。核对专属道具和调用后补齐全部素材。
5. 每位都需独立完整包、可无旧派生包重建、四向七态/自然移动/暂停/慢放/原作/派生素材验收页。只启用完成者，保留original和已验收1/2/3/4/6/7/10/11/12。
6. 工程与动画验证：回归测试先红后绿，完整来源/关节接合/边界/循环实际PNG、重复重建哈希、全量单测/构建、生产浏览器HD与original/六格转弯/反应/附身/四向飞行/游乐场输入暂停计分欢呼/月结结算，以及真实API新局且不写存档。原规则/RNG/存档和根移动速度不变。
7. 独立代码审查、继承验收资源哈希保护、最终人物视觉和自然动作确认。完整三位均制作、接入、验证且获得最终确认后才完成目标，不以单个人物代替最后三位全部素材。

新增位图只使用内置image_gen，保存透明通道、提示词、输入/输出SHA与来源。现有母版先目检再决定可复用范围；缺失隐藏表面预先补齐，避免重复袖口、脚掌矩形缺口或四向头饰漂移。验收记录与工程包的候选标签分开记录，不将测试通过等同用户美术批准。

## Tasks and file boundaries

- [x] 合并：accepted commit42fb2bc，main843测试/类型通过。保留32本地文件和75研究文件。
- [x] 原作清单RED→GREEN：修改`scripts/audit-character-materials.py`和`test_character_material_inventory.py`；生成`role-05/08/09-material-sources.json`及`source-references/role-05/08/09-activities.png`，分别1185/1076/1112记录。`trait-*`由controller的NPC encounter分支选择npcId，并由已验收npc-23包替换，非同号玩家专属动作。
- [x] 大牌：新增`role-05-authoring.json`、`role-05-carnival-authoring.json`、`masters/role-05-*`及`src/modern/data/dapai-{map-rig,carnival,complete}.json`。测试`scripts/test_dapai_artwork.py`、`tests/modern/dapai-{grounding,material-routing}.spec.ts`；流水线`node scripts/build-next-character-artwork.mjs 5`。只在完整包存在且路由测试通过时加入registry。闭合脚掌供体先于动作导出，避免遮罩缺口。
- [x] 大尾：对应role08/dawei。先实审钳、螯和腿数，再在`characters-25-pose.ts`/`contacts.ts`按实际足数增加配置或控制器；世界支撑、起停/转向、钳/尾相位测试必须先失败再实现。不得改既有角色默认行为。
- [x] 阿飞：对应role09/afei。四马腿与双臂独立；四足接点须按马身前后腿组成配置，不能误用双人身份分组。`tests/modern/afei-grounding.spec.ts`回归单脚世界接触、换向及启停；其余同完整人物流程。
- [x] 生产验证：各自`create-*-fixtures.ts`生成合法原规则快照，`modern-*-artwork.spec.ts`跑全部真实界面入口。原RNG、速度、存档模型不改，真实API只读槽位与新局不写保存。
- [ ] 验收页`public/hd-review/characters-25/last-three/`：对应现有审阅TS入口新增5/8/9，未完成者不显示为可验收。最终全量测试、素材边界与实际首尾PNG、无旧完整包导出、完整重建哈希、保护资产验证、独立审查及用户最终确认。

## 大牌原作检查

头饰/耳/鬃毛四向已目检；中立为小张口，喜悦闭眼、悲伤含泪、受伤为整头/额饰熏黑。飞行原作黄色护目镜，侧后方沿原图保留绑带，四向云尾一致。游乐场正面/左右侧面睁眼，月结睁眼张嘴庆祝。只从完整部件制作连续变换，不生成独立时间帧。

### Task 1: Native inventories

Files: audit-character-materials.py, test_character_material_inventory.py, role-05/08/09-material-sources.json and original activity contact sheets.
Consumes: existing original manifests/SWFs/PNGs. Produces: role material source JSON and source references consumed by all later role packers.
- [x] RED missing ID5 inventory; add names/anatomy/CLI IDs and audit5/8/9.
- [ ] GREEN completion: `/opt/homebrew/bin/python3 -m unittest scripts/test_character_material_inventory.py`. Expected: 1 test OK; 1185/1076/1112 source records, no original files changed.

### Task 2: Dapai complete identity

Files: role-05 masters and map/carnival authoring; dapai data packets; shared pipeline selected-ID extension; dapai grounding/routing/artwork/production checks.
Consumes: Task1 role05 native inventory, existing neutral mother and new same-identity donors. Produces: complete HD runtime pack and review role5, independently exportable without prior complete pack.
- [ ] RED: grounding cloneID5 has no support contacts; role5 registry/complete pack absent.
- [ ] Implement fixed identity, complete donor surfaces, bounded tail, two-foot support, map four facings/seven states and all nine activity routes; generation only from viewed same-identity references.
- [ ] GREEN: relevant Vitest + Python checks, full project tests/build, original/HD production flows, exact source raster cycle, no-previous-pack exporter and repeat-file SHA. Expected: no errors, no larger wrap step, preserved accepted assets.
- [ ] Record complete engineering candidate before starting Task3. Human final confirmation remains a final batch gate.

### Task 3: Dawei complete identity

Consumes: Task1 role08 inventory and viewed original anatomy; preserves Task2 data/artwork. Produces role08/dawei complete pack and equivalent tests/review.
- [ ] RED native anatomy-specific support/tail/claw continuity and missing runtime routing.
- [ ] Implement only required scorpion configuration; exact leg count and placement from original views, closed occluded surfaces, all material families.
- [ ] GREEN same complete material/production/loop/rebuild/protection contract as Task2.

### Task 4: Afei complete identity

Consumes: Task1 role09 inventory and original four-legged centaur geometry; preserves completed roles. Produces role09/afei complete pack and equivalent tests/review.
- [ ] RED four horse-foot support with two upper-body arms, phase pairs based on anatomy rather than paired children, plus absent complete routing.
- [ ] Implement centaur layers and geometry, complete source reference/donor surfaces, all material families.
- [ ] GREEN same full verification contract; no limb clipping, head drift, body tearing, foot skating or loop jump.

### Task 5: Final integration and human acceptance

Consumes all three complete packets and per-character evidence. Produces accepted last-three review/acceptance record after explicit user response.
- [ ] Full regression, exact prior-HD asset hashes, original routing, actual three-character new game with real API/no save writes, desktop review controls and responsive review layout.
- [ ] One fresh-context whole-branch code review; TDD any important findings, preserve user-approved appearance.
- [ ] User final art/natural-motion acceptance under their AGENTS.md, then complete goal. Do not self-approve appearance or silently merge the new final trio before that gate.

## 大牌工程闭环完成记录

845项TS、40项Python、8项独立导出及16项生产场景通过；278文件重建一致，2212继承资产/包不变，真实API新局无写存档。素材形象仍待最终用户验收。细节见`docs/modernization/dapai-25-delivery.md`。

大尾源图已先行只读核对：两只主要落地脚、双钳、分节尾、棕帽金带和黑墨镜；scorpion身份标签不代表可以增加原作没有的腿。下一任务按实际两足支撑、刚性帽/身体和独立分节尾处理。

## 最后三位工程候选记录

大牌769e27f、大尾23e5f17、阿飞beb6bcf分别完成。最终852项TS、78项Python、10项独立导出通过；三位各16项实机通过，真实API三位共同开局200且无存档写入。9组验收页(390/768/1440)完整显示每位19张派生图，暂停像素冻结、慢放与进度控制可用，页面无错误。当前待独立整批代码审查及用户视觉/自然动作最终确认。
