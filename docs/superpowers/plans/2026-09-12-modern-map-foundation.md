# 现代版原素材场景 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. 本计划在当前会话逐任务执行，不要求另开任务或自动派发子代理。

**Goal:** 交付不依赖SWF/Ruffle的现代二维场景，证明原地图、地块坐标与四向人物动画可用。

**Architecture:** 以离线导出的原始地图与动画资源驱动PixiJS场景，Vue只提供容器和检查控制。此批不创建游戏规则引擎；地图数据适配与坐标计算独立于渲染，下一批可接入纯TypeScript规则核心。

**Tech Stack:** TypeScript、PixiJS 8、Vue 3、Vite、Vitest；现有JPEXS 26.2.1与Python工具仅用于离线提取。

**Spec:** [架构设计](../../modernization/architecture.md)、[第一阶段发现](../../modernization/phase-1-findings.md)、[路线图2A批](../../modernization/roadmap.md)。

## Global Constraints

- 最重要的目标是用新的架构实现原版功能，现代入口不得加载SWF、Ruffle或此前自绘规则引擎。
- 第一版只面向电脑浏览器，保留4∶3游戏区域、鼠标/键盘和全屏。
- 本批只使用原素材，不扩大高清重绘。
- 原版音乐音效沿用；本批不改音频文件，接入时机属于2B/3D。
- 存读档由后端提供，只做手动，不兼容旧存档；本批不提前创建存档服务。
- 原始文件哈希必须保持不变。
- 第一阶段通过后才执行本计划；2A用户验收后才开始2B。

## 文件与接口

| 路径 | 责任 |
|---|---|
| `scripts/export-modern-assets.py` | 固定输入与JPEXS版本，导出地图、四向行走帧、校验与资源元数据；不运行ActionScript |
| `scripts/build-modern-map.mjs` | 从已核对的原始表生成场景数据；保留source id |
| `src/modern/data/map.json` | 生成的原始网格与56住宅地映射 |
| `public/modern/assets/` | 本批实际需要的PNG与JSON；不含SWF/WASM |
| `src/modern/features/map/types.ts` | 地图数据结构 |
| `src/modern/features/map/coordinates.ts` | 网格/场景坐标转换 |
| `src/modern/features/map/MapScene.ts` | 地图底图、位置标记、镜头与销毁 |
| `src/modern/features/characters/WalkPreview.ts` | 四向原帧动画样本与锚点 |
| `src/modern/ModernApp.vue`、`src/modern/main.ts`、`modern.html` | 现代入口、4∶3容器与检查控制 |
| `vite.config.ts`、`package.json` | 新增modern模式与明确构建命令，保留原入口 |
| `tests/modern/map-data.spec.ts`、`tests/modern/coordinates.spec.ts` | 数据与坐标的行为检查 |
| `tests/e2e/modern-scene.spec.ts` | 真浏览器场景、资源依赖、显示与生命周期检查 |

建议接口，执行者不得在各文件自行发明不同命名：

```ts
export interface GridPoint { column: number; row: number }
export interface ScenePoint { x: number; y: number }
export interface Parcel {
  id: number
  roadCell: GridPoint
  buildingCell: GridPoint
  streetId: number
  streetName: string
  basePrice: number
  facing: 1 | 2 | 3 | 4
}
export interface MapData {
  rows: number
  columns: number
  grid: number[][]
  parcels: Parcel[]
  sourceSha256: string
}
export type Facing = 'down-right' | 'down-left' | 'up-left' | 'up-right'
export interface FrameAsset {
  url: string
  durationMs: number
  offsetX: number
  offsetY: number
}
export interface WalkClip { facing: Facing; frames: FrameAsset[] }
export interface MapSceneHandle {
  focus(point: GridPoint): void
  showMarkers(visible: boolean): void
  resize(width: number, height: number): void
  destroy(): void
}
```

## Task 1：导入地图数据与坐标

**Files:** 创建地图生成脚本、types、coordinates、map.json以及两个Vitest文件。

**Interfaces:** 消费 `docs/modernization/evidence/original-tables.json`；产出 `MapData`、`gridToScene(GridPoint): ScenePoint`、`sceneToGrid(ScenePoint): GridPoint`。

- [x] 从原表读取 `mapdate1.value` 与 `builddate1.value`，生成前检查源SWF哈希；只使用JSON解析，不eval反编译脚本。
- [x] 写行为测试并先运行确认失败。至少包括：

```ts
expect(map.rows).toBe(43)
expect(map.columns).toBe(41)
expect(map.parcels).toHaveLength(56)
expect(new Set(map.parcels.map(p => p.streetId)).size).toBe(16)
expect(map.parcels.find(p => p.id === 1)).toMatchObject({
  roadCell: { column: 6, row: 32 },
  buildingCell: { column: 5, row: 31 },
  streetId: 1,
  basePrice: 1500,
  facing: 3,
})
expect(gridToScene({ column: 6, row: 32 })).toEqual({ x: 336, y: 1280 })
expect(sceneToGrid({ x: 336, y: 1280 })).toEqual({ column: 6, row: 32 })
```

- [x] 实现最小坐标转换，并将地图与像素保持分离：

```ts
export function gridToScene(p: GridPoint): ScenePoint {
  return { x: p.column * 56, y: p.row * 40 }
}
export function sceneToGrid(p: ScenePoint): GridPoint {
  return { column: p.x / 56, row: p.y / 40 }
}
```

- [x] 住宅由 `type===16 && streetPosition%2===1` 的记录生成，配对 `id+1` 建筑格；验证56对的坐标都与原网格记录一致，失败时输出具体ID，不跳过。
- [x] `npm test -- tests/modern/map-data.spec.ts tests/modern/coordinates.spec.ts` 通过后记录数据摘要并提交本任务。不要为原表中的建筑区域占位坐标(0,0)自动推断位置。

## Task 2：原素材提取与动画锚点

**Files:** 创建 `scripts/export-modern-assets.py`、`public/modern/assets/manifest.json` 和所需PNG；创建 `tests/modern/assets.spec.ts`。

**Interfaces:** 消费原版位图20和卷毛行走精灵130/308/488/664；产出地图纹理与 `WalkClip[]`。`offsetX/offsetY` 必须来自原精灵包围盒及放置变换，不能用每张图片中心代替。

- [x] 使用已校验的JPEXS 26.2.1导出地图及96张行走PNG，完整命令参考第一阶段证据说明。源SWF只读。
- [x] 增加可执行资源检查：PNG可解码、含透明通道、每方向24帧、帧顺序1…24、metadata可追溯到原ID，原文件哈希一致；先用缺失或乱序帧fixture确认检查会失败。
- [x] 从SWF的DefineSprite放置矩阵/形状边界导出帧偏移。RGBA解码与锚点示例验证必须覆盖脚底/影子，而不只验证宽高。
- [x] 用下列时间约定生成manifest，避免固定每次浏览器刷新切一帧：

```ts
const sourceFrameDurationMs = 1000 / 30
const frameIndex = Math.floor(elapsedMs / sourceFrameDurationMs) % clip.frames.length
```

- [x] 检查地图导出图的透明边缘与原播放器，若出现彩色细边/黑晕，定位JPEG/alpha预乘转换原因；不得用全图颜色阈值修复原素材。
- [x] 不打包未使用的5,309张位图，不生成新美术，不把提取工具放入发布目录。本批资源验证通过后提交。

## Task 3：独立现代场景

**Files:** 创建 `MapScene.ts`、`WalkPreview.ts`、`ModernApp.vue`、`main.ts`、`modern.html`；修改 `vite.config.ts`、`package.json`。

**Interfaces:** `createMapScene(host: HTMLElement, map: MapData, manifest: AssetManifest, options: { signal: AbortSignal; onFrame: (frame: number) => void }): Promise<MapSceneHandle>`；Vue挂载后创建，在卸载时调用destroy。

- [x] 验证当前PixiJS 8发行信息及兼容性，然后用精确版本锁定依赖；保持现有Vue/Vite版本，除非有可复现的不兼容。
- [x] 增加modern构建模式：开发入口 `/modern.html`，生产输出 `dist-modern/`，modern模式的 `publicDir` 仅指向 `public/modern/`；原模式保留当前入口和构建行为。
- [x] 创建Pixi应用、单一world容器、地图sprite、住宅标记层和人物层。坐标全部由Task1函数提供；通过相机容器平移观察地图，不能改写地块坐标。
- [x] Vue容器固定800×600逻辑比例，根据可用窗口缩放；样本控制只包含标记开关、四方向动画、镜头定位和全屏，明确显示“场景验收，尚未接入完整对局”。
- [x] 用原map资源放置矩阵对齐底图和住宅坐标；用脚底锚点呈现人物。对照地块1、三个远端路口和一处魔法门，逐一保存截图证据。
- [x] 资源加载失败时显示具体文件与重试入口；卸载销毁ticker/纹理引用/事件，重新进入不重复创建画布。禁止在MapScene中加入金钱、骰子、产权或回合逻辑。
- [x] 完成相关检查后提交本任务，保留现代入口与原版入口供下一任务并排比较。

## Task 4：2A验收与交付

**Files:** 创建 `tests/e2e/modern-scene.spec.ts`，更新 `docs/modernization/acceptance-2a.md` 和README中的新入口说明。

**Interfaces:** 消费Task3入口与manifest；产出可复核的测试和截图结果，不增加业务接口。

- [x] 浏览器检查现代入口无SWF/Ruffle请求、无错误日志、只存在一个canvas。可用以下网络断言，测试脚本走项目已有E2E运行方式，交互式检查优先当前Browser工具：

```ts
const requests: string[] = []
page.on('request', request => requests.push(request.url()))
await page.goto('/modern.html')
await expect(page.locator('canvas')).toHaveCount(1)
expect(requests.some(url => /ruffle|\.swf(?:\?|$)/i.test(url))).toBe(false)
```

- [x] 检查四方向切换、相机定位、标记开关、全屏与反复进出；记录人物脚底和地块位置。没有相邻帧连续播放证据不能声明动画稳定。
- [x] 分别在普通桌面窗口和1920×1080全屏检查4∶3区域，显示缩放不能改变地图逻辑坐标。浏览器缩放/设备像素比不应裁掉地图控制。
- [x] 执行modern相关测试、类型检查、modern构建；检查 `dist-modern/` 没有SWF/WASM/Ruffle文件，原版入口的完整性测试仍通过。
- [x] 写2A验收记录：已完成/未完成、截图路径、测试结果、已知差异、提交SHA；提醒此批只完成现代场景。
- [ ] 用户验收2A（本地结果和链接已交付，等待用户确认）。未通过则仅修2A；通过后为2B的规则与回合写独立实施计划，不直接跳到全功能重写。

## 自审清单

- [x] source-id、函数、类型、目录与测试引用一致。
- [x] 场景数据没有误把112住宅记录当成112块地。
- [x] 原图/动画转换与原播放器对齐，未生成替代造型。
- [x] 无业务逻辑混入Vue/Pixi回调，无旧引擎导入。
- [x] 新版发布依赖不包含Ruffle和SWF。
- [x] 2A退出条件与全项目目标之间的剩余工作已明确标记。
