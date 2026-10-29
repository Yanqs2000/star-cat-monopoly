# 非人物18/19/21动画交付（20后移）

用户授权“做18–21”后，源文件检查发现20的“帐篷”实际使用小猫接待员。用户明确选择“20后移到人物批次，本轮先完成18、19、21”。因此本批只有18、19、21；npc-1、mini-npc-1及人物素材保持原样。

工作分支`feat/non-character-18-21`，基线main82608b5。新素材状态为pending-user-art-review，等待用户视觉验收；没有合并main或推送远端。

## 18：三骰滚动

原导出ludo-dice底层是透明图，所有骰面在运行时由tz1–tz6叠层和真实GameState驱动。保留40个30Hz业务采样，生成80个60Hz显示采样；位置连续插值，旋转/缩放分解后插值，避免直接插值矩阵导致转动中塌缩。每个原源采样精确保留，新增叠层只在原出现时点生效，不提前显示落地影子。

复用已经验收的六种静态骰面及影子，不重新生图，不改变随机流、下注、点数和结算时点。原AVM1在1/10帧重复写tz2、17/18/19帧分别写tz3/tz4/tz6，这些原行为也保留，证据为review目录的dice-source-actions.json。不能把三个视觉骰子自行重排或修成不同于源逻辑的结果。

NativeActivity的主片、叠层和骰子位移父片均按自己的fps取显示采样；暂停冻结子帧，恢复只继续当前业务帧内的显示，不让显示时钟推进业务。

## 19：两种提示框

show2的45帧、show-npc4的50帧各自只有一张不同图，属于原本静态保持。本批使用一张GPT内置生图蓝色面板母版，结合两种原内容框高度，打包两张4倍无损WebP，保留45/30秒和50/30秒。动态文字继续使用原位置、尺寸、矩阵和浏览器字体。未为凑60fps制造无意义晃动。

## 21：警用、救护飞碟

保留原飞碟造型：蓝色警用飞碟、白色绿色救护飞碟，没有改成带车轮的车辆。固定母版经过源轮廓范围配准，连续驱动进出、倾斜、灯光、原刹停光效和舱门。

- car1：113/30秒，226个60Hz显示采样。
- car2：111/30秒，222个60Hz显示采样。
- 警车P标牌已定向修正到前脸中央；救护舱门按源几何向右展开。
- 转向时按母版alpha轮廓配准，避免按透明矩形外框配准造成整车明显缩小。
- 运行图密度2，对应现有渲染器DPR上限2；保留完整原生生成母版。
- 各帧只裁去透明留白，补偿偏移；Pixi在中间采样更新纹理和偏移，原世界锚点及送医/拘留门槛不变。

上述是固定2D母版的连续变形与分层，并非重建完整三维车辆；倾斜姿态的视觉效果以对照页和实际游戏供用户验收。

## 文件与复现

- 制作母版、提示词、原始位图/嵌套时间轴、对照页：public/hd-review/non-character-18-21/。
- 运行文件：public/modern/hd-static/continuous-18-21/。
- 显示替换清单：src/modern/data/continuous-non-character.json，独立于已验收01–17。
- scripts/ProbeContinuousArtwork.java：只读提取原SWF依赖、位图及嵌套矩阵；本批源数据已归档，无需重新提取即可重建。
- scripts/build-continuous-artwork.py：复用仓库内母版，在本机Chrome确定性渲染并无损打包，不调用生图API。
- scripts/verify-continuous-artwork.py：源哈希、范围、原采样、alpha/可见RGB逐像素重建、文字登记、运行文件集合与20排除检查。
- scripts/verify-continuous-renderer.mjs：警车转向尺寸、救护舱门方向及448个车辆显示采样的可见裁边检查。

使用符合项目要求的Node24及安装Pillow/NumPy的Python：

```sh
python3 scripts/build-continuous-artwork.py
python3 scripts/verify-continuous-artwork.py
CONTINUOUS_REVIEW_URL=http://127.0.0.1:64867/hd-review/non-character-18-21/render.html node scripts/verify-continuous-renderer.mjs
npm test
npm run build:modern
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4202 npx playwright test --config playwright.modern.config.ts tests/e2e/modern-continuous-artwork.spec.ts
```

## 验证范围

运行页为4202/modern.html，对照页为64867/hd-review/non-character-18-21/。Browser插件不可用，使用项目Playwright配置中的本机Chrome及实际生产构建；游戏回放使用受控合法存档，经正常读取、掷骰、下注、选择目标进入场景，未伪造运行时事件。

最终数字以review目录verification.json、renderer-verification.json、browser-verification.json和production-browser-results.txt为准。覆盖实际三骰、原版兼容、两种通知、送医及法院转运；子帧、暂停、恢复、倍速及一次结算有运行证据。新静态显示采样、无损重建和原资源保护检查不代替用户最终美术验收；浏览器测量不能代表用户显卡的整局60fps保证。
