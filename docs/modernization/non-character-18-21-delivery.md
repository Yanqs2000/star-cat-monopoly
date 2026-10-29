# 非人物18/19/21动画交付（20后移）

用户授权“做18–21”后，源文件检查发现20的“帐篷”实际使用小猫接待员。用户明确选择“20后移到人物批次，本轮先完成18、19、21”。因此本批只有18、19、21；npc-1、mini-npc-1及人物素材保持原样。

工作分支`feat/non-character-18-21`，基线main82608b5。新素材状态为pending-user-art-review，等待用户视觉验收；没有合并main或推送远端。

## 18：三骰滚动

原导出ludo-dice底层是透明图，所有骰面在运行时由tz1–tz6叠层和真实GameState驱动。保留40个30Hz业务采样，生成80个60Hz显示采样；位置连续插值，旋转/缩放分解后插值，避免直接插值矩阵导致转动中塌缩。每个原源采样精确保留，新增叠层只在原出现时点生效，不提前显示落地影子。

复用已经验收的六种静态骰面及影子，不重新生图，不改变随机流、下注、点数和结算时点。原AVM1在1/10帧重复写tz2、17/18/19帧分别写tz3/tz4/tz6，这些原行为也保留，证据为review目录的dice-source-actions.json。不能把三个视觉骰子自行重排或修成不同于源逻辑的结果。

NativeActivity的主片、叠层和骰子位移父片均按自己的fps取显示采样；暂停冻结子帧，恢复只继续当前业务帧内的显示，不让显示时钟推进业务。

## 19：两种提示框

show2的45帧、show-npc4的50帧各自只有一张不同图，属于原本静态保持。本批使用一张GPT内置生图原生RGB不透明蓝色面板母版，结合两种原内容框高度，打包两张4倍无损WebP，保留45/30秒和50/30秒。仅在渲染时按原圆角外轮廓裁切，蓝色内区不补色、不修改母版alpha。动态文字继续使用原位置、尺寸、矩阵和浏览器字体。未为凑60fps制造无意义晃动。

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
python3 scripts/serve-continuous-review.py --port 64867  # 独立终端保持运行
python3 scripts/build-continuous-artwork.py
python3 scripts/verify-continuous-artwork.py
CONTINUOUS_REVIEW_URL=http://127.0.0.1:64867/hd-review/non-character-18-21/render.html node scripts/verify-continuous-renderer.mjs
npm test
npm run build:modern
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4202 npx playwright test --config playwright.modern.config.ts tests/e2e/modern-continuous-artwork.spec.ts
```

## 验证范围

运行页为4202/modern.html，对照页为64867/hd-review/non-character-18-21/。Browser插件不可用，使用项目Playwright配置中的本机Chrome及实际生产构建；游戏回放使用受控合法存档，经正常读取、掷骰、下注、选择目标进入场景，未伪造运行时事件。

本批最终检查：108个文件共776项单元测试通过，6项新生产回放及2项旧特效兼容回放通过，类型检查、生产构建和存档结构检查通过。450张运行图共41,554,848字节，理论解码RGBA203,028,352字节（约193.6MiB，不含GPU复制及游戏其他素材）。

4秒同步视频为1440×1000、60fps、240帧，见comparison.mp4；可交互对照支持暂停、逐时刻拖动、0.25/0.5/1/2倍速及浅色、深色、道路背景。实测对照页240个绘制间隔中位为16.7ms、P95为16.7ms、最大16.8ms，未出现超过50ms的间隔。这是受控对照页测量。

最终数字以review目录verification.json、renderer-verification.json、browser-verification.json和production-browser-results.txt为准。覆盖实际三骰、原版兼容、两种通知、送医及法院转运；子帧、暂停、恢复、倍速及一次结算有运行证据。新静态显示采样、无损重建和原资源保护检查不代替用户最终美术验收；浏览器测量不能代表用户显卡的整局60fps保证。

## 独立审查与修复

一次独立只读审查指出P2：首版母版蓝色标题区半透明，地图会穿透背景。像素回归先复现两种提示框标题区alpha162–248，原图同区全255；重新通过GPT内置生图获得原生RGB全不透明母版，保留外部圆角裁切，再打包并验证标题区全255。测试为scripts/test_continuous_artwork.py，且永久校验器重复检查该条件。没有使用填色修补半透明内区。

审查没有其他已确认问题；20与原AVM1骰子命名写入异常均按明确范围保留。用户视觉验收和显卡整局性能仍单独保留，不能由这些工程结果代替。

对照页使用生产别名减少重复原图下载、最多六个并发解码，以及HTTP/1.1本地服务；首个绘制时间戳早于初始化时刻的边界有独立失败—通过回归（scripts/verify-continuous-review.mjs）。它们只影响对照页，不改变生产游戏。最终对照页20幅截图、390px布局、加载与控制台检查通过。

## 三骰对照页裁切修复

用户发现三个骰子只显示局部：对照页误把移除骰面叠层后的153×134透明底层尺寸当成完整运动范围。现按原版40帧、高清80采样中所有叠层矩阵及六种骰面/影子边界的共同范围建立固定画布，并留8逻辑像素安全边距，位置和尺寸不随帧变化。没有改动生产游戏的骰子素材、点数或时序。

浏览器回归在画布外额外绘制后检测裁切：修复前160个对照视图都存在裁切，修复后80个时刻×原版/高清两栏共160视图的画布外alpha全0。实际游戏两种画质分别采样243、246次叠层边界，均完整包含在游戏画布内，两项真实下注—开奖—暂停—结算回放通过。对照视频和海报重新生成。
