# 新地图人物行走与车道适配只读复核

结论：补查完成后，已人工审阅高清/原版各160个道路格的实际MapScene静态落脚截图，并结合自然玩法与关键路段受控动画；未发现可复现的、新高清地图引入的“人物脚点走出车道、弯道切进草地、桥面悬空或到达格明显错位”问题。静态落脚已覆盖160/160格；动态仍属下列样本，不等于全部角色、全部连边或整张地图视觉验收通过。

## 环境与方法

- 阶段：测试/只读复核；退出条件：真实开局和掷骰、移动中及落地截图、原版同路径对照、明确未覆盖范围。
- URL：http://127.0.0.1:5201/modern.html；Vite 8.2.2 `--mode modern`；系统 Google Chrome，Playwright headless，软件 WebGL。
- Browser plugin not available，因此遵循 frontend-testing-debugging 技能使用项目现有 Playwright 和系统 Chrome；未安装依赖。
- 自然玩法窗口 1440×1000；受控场景 1200×900，实际 createMapScene 与原角色动画资源。
- 未改生产代码、素材、manifest 或游戏状态。自然玩法仅在 Playwright 路由返回的 MapScene 模块中加入只读状态探针，读取 movement、actor、camera；未改位置、骰子、controller 或时间推进。随机种子固定 123456789，日期固定 2026-09-28 便于原版/高清同局比较。
- 5198 最初未使用 modern mode，角色索引返回 HTML，属于本次测试环境配置问题；另起 5201 后真实路径正常。主审已确认并更正原服务器，不列为产品问题。

## 自然玩法证据

使用页面控件选择高清/原版素材 → 按顺序选择角色1/2/3/4 → 开始对局 → 每名人类玩家各点击一次掷骰，期间通过可见购买/确认按钮继续。两档共8次真实掷骰、各15步动画，19个不同道路格。不是直接注入位置或固定骰点。

| 实际掷骰 | 路线（column,row） | 实际落点 actor scene 坐标 |
|---|---|---|
| 角色1，骰4 | (33,7)→(32,6)→(31,7)→(30,8)→(29,9) | (1624,360) |
| 角色2，骰3 | (10,10)→(9,11)→(8,12)→(7,13) | (392,520) |
| 角色3，骰5 | (7,35)→(8,36)→(9,35)→(10,34)→(11,33)→(12,32) | (672,1280) |
| 角色4，骰3 | (30,32)→(31,31)→(32,30)→(33,29) | (1848,1160) |

- 原版/高清4个落点的完整 GameState 逐字段一致，记录在 natural-results.json；该结果只证明状态一致，视觉结论另外依据截图审阅。
- 两档合计220个移动中采样，actor 位置与 movement 指定的 from→to 线性插值最大误差小于4×10^-13 scene单位（浮点舍入量级）。gridToScene为column×56、row×40；active脚点环位于actor局部(28,20)。这证明渲染器按游戏路径移动，不单独证明美术车道对齐。
- 已实际查看自然移动中和4个落点的高清截图，并对照原版同落点。普通直路、北部及南西折角处脚点留在铺装路面；落点环及人物脚底没有出现可识别的新版独有越界。

关键自然截图：
- hd-natural-roll1-moving.png / hd-natural-roll1-arrival.png / original-natural-roll1-arrival.png
- hd-natural-roll2-arrival.png
- hd-natural-roll3-arrival.png
- hd-natural-roll4-arrival.png

## 受控动画补充（不是自然玩法）

另挂载实际 createMapScene，使用角色1的真实 WalkPreview、setPlayers、transitionPlayer，从合法道路格逐格播放700ms动画。没有游戏controller和购买/落地结算。这些截图只能补充车道/脚点几何检查，不能当作自然走到这些区域的证明。

| 路线 | 覆盖格（column,row）及规则格ID |
|---|---|
| 南桥到重生门 | (25,37)/196 → (24,38)/189 → (23,39)/179 → (22,40)/175 → (21,41)/163 |
| 最西弯道 | (2,26)/182 → (1,27)/197 → (0,28)/208 → (1,29)/204 → (2,30)/184 |
| 最东弯道 | (38,12)/202 → (39,13)/187 → (40,14)/216 → (39,15)/183 → (38,16)/203 |
| 北部桥与回归门 | (17,3)/188 → (18,2)/165 → (19,1)/161 |
| 西北折角 | (14,6)/177 → (13,7)/171 → (12,8)/205 → (11,9)/132 → (10,10)/131 |
| 西南折角 | (6,34)/129 → (7,35)/128 → (8,36)/210 → (9,35)/136 → (10,34)/9 |

两档各6条路线/22步，28个道路格；合并自然玩法共42/160道路格。人工查看桥的移动中、桥面到达、门前到达、东西极端弯道移动中和到达以及两条西侧折角，并查看对应原版关键截图。桥面和道路转角的新版轮廓与旧版在脚点周围保持连续，未见人物踩入背景、树或崖壁。高清路面图标重绘有外形/局部中心变化；当前样本不足以按像素证明每个装饰圆盘完全同心，但没有造成可见走出车道。

关键补充截图（均有original-同名对照）：
- hd-controlled-south-bridge-step2-moving.png
- hd-controlled-south-bridge-step2-arrival.png
- hd-controlled-south-bridge-step4-arrival.png
- hd-controlled-west-edge-turn-step2-moving.png / step2-arrival.png
- hd-controlled-east-edge-turn-step2-moving.png / step2-arrival.png
- hd-controlled-north-gate-step2-arrival.png
- hd-controlled-north-west-turn-step2-arrival.png
- hd-controlled-south-west-turn-step2-moving.png

## 补查：160/160道路格静态落脚与完整医院桥动画

本轮新增 full-road-sweep.mjs，使用实际createMapScene渲染器和角色1真实素材，逐一调用setPlayers放置到rules.json列出的全部160个道路格（不是自然玩法）。每格截图400×300，画面最终缩放1×，脚点环置于中心附近；方向取一条实际存在的相邻道路方向。高清档每次相机移动后，都等待当时visibleRegions全部挂载、再等两帧后截图。160张高清截图的可见native region数为6–29，ready全部为true，排除了仍只显示base而误认为native已就绪的情况。

- 高清160张 + 原版同坐标160张；分为高清8张和原版8张接触表，每表20格，panel标注index、规则格ID、(column,row)、方向。
- 已用图像查看工具逐张查看全部16张接触表，逐格比较中心人物脚底、活动环与铺装路面/桥面。没有发现脚点落入草地、崖壁、天空，或新版独有的道路端点断开。部分路面装饰图标有重绘和局部中心差异，未导致所查脚点越出车道；没有把逻辑位置相同作为视觉结论的替代。
- 接触表：full-road-sweep/hd-contact-01.jpg 到 hd-contact-08.jpg；对应 original-contact-01.jpg 到 original-contact-08.jpg。每个原始PNG仍保留，命名 profile-index-idXXX.png。完整索引与ready/actor/错误记录见 full-road-sweep/results.json。
- 所有格静态检查均为角色1单一合法方向，不能代表四朝向×12角色全组合。

另外补了北部医院桥完整受控动画：从(12,8)/205一路到(19,1)/161，即
(12,8)/205 → (13,7)/171 → (14,6)/177 → (15,5)/195 → (16,4)/178 → (17,3)/188 → (18,2)/165 → (19,1)/161。

高清/原版各7段真实transitionPlayer动画，每段1200ms，并逐段保存移动中及到达截图。两档各7个移动中记录均确认movement仍在进行；高清移动中elapsed约467–550ms，不是停在终点后冒充移动截图。人工查看两档第3、第5段移动中及第7段到达的原图尺寸截图，桥头、桥身、医院门前的脚点均留在桥面。该路线是显式构造的MapScene补充，不是自然掷骰到达的证明。

重点图像：
- full-road-sweep/hd-hospital-bridge-step3-moving.png / original-hospital-bridge-step3-moving.png
- full-road-sweep/hd-hospital-bridge-step5-moving.png / original-hospital-bridge-step5-moving.png
- full-road-sweep/hd-hospital-bridge-step7-arrival.png / original-hospital-bridge-step7-arrival.png

本轮两档均未捕获pageerror、console error或HTTP>=400；分别记录在full-road-sweep/results.json。

当前覆盖口径：自然玩法仍为19个不同道路格；此前自然+受控动态样本并集42格；本轮补全静态落脚为160/160格；受控动态新增完整医院桥7段。不得写成“160格自然游玩”或“全部道路连边都已动画覆盖”。

## 检查状态

| 检查 | 结果 |
|---|---|
| 页面/标题身份 | 星猫大富翁现代对局，正确目标页面 |
| 非空、无框架overlay | 自然开局及实际对局已渲染 |
| 真实交互 | 8次页面掷骰，落点及状态可追踪 |
| 页面异常/应用console error | 未捕获到 |
| 浏览器warning | 高清自然玩法有2条软件WebGL ReadPixels GPU stall性能告警，源于截图读取；不属于游戏资源/脚本异常 |
| 控制台与状态记录 | natural-results.json、controlled-results.json、coverage-summary.json |
| 生产文件修改 | 无 |

## 覆盖局限

- 静态落脚已完成160/160道路格；没有完成全部道路连边/双向的动态逐段截图，且未作全路线自然游玩。
- 自然玩法只覆盖四名角色各一回合；南桥、北部完整医院桥与极端边缘为角色1的受控动画补充。没有覆盖全部12角色体型、全部反向行走、所有NPC遮挡、神灵覆盖层、传送/受伤等特殊反应的脚点。
- 未录制整段视频，移动证据为多帧实时状态采样及代表截图；不同profile截图不是同一动画相位的像素差分。
- 未做手机尺寸、真GPU、跨浏览器或长时间运行；不能用headless软件WebGL断言用户Mac性能。
- 原版对照是现代前端的original素材档，不是Ruffle原SWF运行对照。
- 最终地图视觉验收仍由用户确认。

## 复跑

`/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/star-cat-map-review-20261023/walking/natural.mjs`

`/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/star-cat-map-review-20261023/walking/controlled.mjs`

三个浏览器脚本均将证据写入本目录，要求5201 modern模式dev server可用。

补查：`/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/star-cat-map-review-20261023/walking/full-road-sweep.mjs`

接触表：`python3 /tmp/star-cat-map-review-20261023/walking/make-contact-sheets.py`
