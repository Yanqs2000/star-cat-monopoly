# Task 3：可操作开局、回合与真实场景验证报告

## 结果与结构

Task 3实现和技术验证完成，等待控制方广泛复核及用户2B验收。

组件结构：`ModernApp.vue` 负责选人、一个待定开局及模式生命周期；`GamePanel.vue` 只显示对局状态与操作；`controller.ts` 串行调度规则命令；`MapScene.ts` 管理私有纹理、四名人物、插值和镜头；原2A检查抽为 `features/map/SceneInspector.vue`，只从选人页进入。

## 实际接口与行为

- `createGameController(initialState, options)`：注入scheduler、逐格/落地/AI时长、状态与过渡回调；公开`roll`、`setPaused`、`setSpeed`、`restart`、`dispose`。
- 规则状态只在控制器定时边界提交。`PlayerTransition`给渲染器来向、起终点和原逐格时长；抵达路口后提交的玩家状态才使用出向。
- `MapSceneHandle`保留2A的focus/facing/playing/markers/overview/resize/destroy，并新增players、transition、pause、speed、follow。人物层按row再column排序，不在帧循环重建Pixi对象。
- 选人页只载入12张首帧缩略图；开局只获取最终四名角色的manifest和帧。纹理错误重试继续使用同一`PendingGame`。
- 标准速度是每格16次30fps更新（16000/30ms），快速为2倍（8次更新）；规则最终状态与随机状态不随速度变化。
- 全图或手动拖拽会关闭跟随；状态更新不会复位镜头；“跟随当前玩家”显式恢复。
- 站立角色冻结在当前方向行走首帧，因为本批没有导出独立待机动作。

## TDD证据

控制器初始RED：

```text
$ npm test -- --run tests/modern/game-controller.spec.ts
FAIL tests/modern/game-controller.spec.ts
Error: Cannot find module '../../src/modern/features/game/controller'
```

浏览器初始RED：

```text
$ npm run test:e2e:modern -- tests/e2e/modern-turns.spec.ts --reporter=line
FAIL 选择1至4名人类、第五名滚出最早选择，并由AI补满四人
Expected heading “选择参赛角色”; element not found
```

后续发现与回归：默认时长规格先收到533ms时已落地；路口过渡先收到出向2而预期来向1；空徽章、角色7缩略图溢出、掷骰hover对比均先由浏览器断言重现。最小修复分别为原16帧时长、过渡使用到达前direction、条件渲染徽章、固定缩略图容器并`object-fit:contain`、保持黄色主按钮hover。

最终控制器聚焦结果：

```text
Test Files 1 passed (1)
Tests 7 passed (7)
```

覆盖种子0字面fixture（最终rngState 3421909937）、重复掷骰、人类→3AI→人类、速度确定性、暂停余时、重开/销毁、默认时长、路口抵达前后方向。

## 浏览器与截图证据

Browser插件未安装，按任务明确要求使用项目Playwright和本机Google Chrome。目标流程是：选人→开局→人类掷骰→逐格移动→AI/四人轮转→暂停/镜头/全屏→重试/返回选人。

开发服务器聚焦2A+2B：

```text
$ npm run test:e2e:modern -- tests/e2e/modern-scene.spec.ts tests/e2e/modern-turns.spec.ts --reporter=line
7 passed
```

生产预览`http://127.0.0.1:4184/modern.html`最终检查：页面标题/主标题/状态正确，canvas存在并交互；1440×1000选人和游戏、1920×1080全屏截图已实际查看，无裁切控制或框架错误层。只请求角色6、7、11、12四份完整manifest，没有SWF/Ruffle、失败响应或pageerror。favicon使用data URL后无404。console只有Chrome SwiftShader在截图ReadPixels时的性能警告，不是应用错误。

截图：

- `/tmp/starcat-2b-selection-1440x1000.png`
- `/tmp/starcat-2b-gameplay-1440x1000.png`
- `/tmp/starcat-2b-gameplay-fullscreen-1920x1080.png`

控制方独立四人回放选6/7/11/12，冻结状态和canvas后恢复，依次完成四个人类回合并到第2轮；只加载四份manifest，无SWF/Ruffle/pageerror。证据：

- `/tmp/starcat-2b-four-humans-selection.png`
- `/tmp/starcat-2b-four-humans-round2.png`
- `/tmp/starcat-2b-four-humans-result.json`

## 最终命令

```text
$ npm test
Test Files 13 passed (13)
Tests 96 passed (96)

$ npm run build:modern
736 modules transformed; built successfully

$ npm run build
17 modules transformed; original build successful

$ PLAYWRIGHT_BASE_URL=http://127.0.0.1:4184 npm run test:e2e:modern -- --reporter=line
7 passed (20.6s)
```

最终生产E2E保留并适配2A的方向/地点、动画暂停像素、纹理重试、1920×1080全屏/Escape检查；2B覆盖第五选择、AI数量、主掷骰、移动/轮次记录、可见玩家阵容及坐标重试、↑、暂停时步数与canvas像素冻结。

## 范围与关注项

本批没有财务、买地、租金、特殊事件、日期、破产或存档。四名角色在地图不同区域时，相机视口只会显示当前区域；玩家面板保留四人的实际坐标，使用全图或依次跟随检查。当前行走素材不是原版完整待机时间轴，静止首帧限制已在验收文档明确。
