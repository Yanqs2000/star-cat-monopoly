# 星猫大富翁 · 原版兼容运行

现在的默认入口运行 **4399《星猫大富翁》的原始游戏文件**。人物、人物动画、地图、建筑、界面、音效和游戏逻辑由原程序提供，不再使用此前自绘的猫、方形棋盘或自编规则。

工程仍然是 **Vite + Vue 3 + TypeScript**，通过本地 Ruffle WebAssembly 运行库兼容 Flash。它是原版运行工程，不是把原程序全部改写成 TypeScript，也不是用 Three.js 猜画原版。

## 启动

```bash
npm ci
npm run dev
```

打开终端显示的地址（默认 http://localhost:5173）。`predev` 会从固定版本的 npm 依赖复制本地运行库，不使用远程 CDN。

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

`dist/` 是可部署的静态产物，包含原版资源与兼容运行库。必须用 HTTP 服务访问，不能双击 `dist/index.html` 以 `file://` 打开。浏览器测试默认使用 macOS 已安装的 Google Chrome；其他系统可在 `playwright.config.ts` 配置本机 Chrome 或 Playwright Chromium。

## 原版资源

来源：[4399 原游戏页面](https://www.4399.com/flash/15000.htm)。页面指向 `game3.htm`，加载器 `4399loading.swf` 读取 `files.xml`，最终加载 `play.swf`。

- `public/original/play.swf`：原始主程序，800×600，Flash 8 / ActionScript 2。
- `public/original/star1.swf` 至 `star12.swf`：原人物资源。
- `public/original/manifest.json`：原页面、资源地址、大小与 SHA-256。
- 13 个 SWF 共 21,855,507 字节，保留取得时的原始字节，不修改原文件。
- 原游戏与素材署名、版权归原作者；Ruffle 的 MIT / Apache 2.0 许可证随本地运行库一起保留。

原版人物、建筑及画面的相似性不再依赖程序生成模型；兼容运行器的字体、音频、时间轴及浏览器差异仍需实测，不能仅凭文件相同声称所有环境的每个像素和行为绝对一致。

## 操作

进入原版标题画面，点击「开始」，选择角色，再点击「开始游戏」。其他规则以游戏内「帮助」为准。

原版帮助确认：↑ 掷骰，← 确认选择，→ 取消选择；计算器中的方向键含义见游戏内帮助。动态中文通过浏览器设备字体绘制，避免兼容运行库默认西文字体缺少中文字形。

外层只提供静音、全屏与重新载入，不覆盖游戏原工具栏。重新载入前有确认提示；未保存的当前局不会被外层自动保存，进度由原游戏自己的存档功能管理。保存数据与浏览器、访问地址关联，切换 `localhost` / `127.0.0.1` 或端口可能看到不同的存档。

## 结构

```text
src/App.vue                       默认入口
src/original/OriginalGame.vue      播放器挂载、加载/失败状态、重试、音量、全屏
src/original/runtime.ts            Ruffle 类型边界、脚本加载、资源预检
public/original/                  原始程序、12 个角色与来源校验清单
scripts/prepare-runtime.mjs        准备本地 JS/WASM 和许可证
public/ruffle/                     自动生成的运行库（不纳入版本控制）
tests/original-assets.spec.ts      原文件完整性测试
tests/e2e/original.spec.ts          真实 Chrome 的原版运行验证
src/LegacyApp.vue                  之前自绘版本的入口备份，不进入默认构建
src/core/、src/render3d/ 等          之前版本保留代码，不参与原版规则执行
```

此前实现的文档保留于 `docs/legacy-implementation.md`，仅用于历史追溯；里面关于原版规则、数值和渲染技术的未核实陈述不应当作原版规格。

## 验证边界

- 资源校验检查所有原 SWF 的 SHA-256、压缩头和解压长度，防止下载错误页、文件遗漏或意外改写。
- 浏览器验证使用真实本机 Chrome，检查主程序元数据、画面、交互与实际资源请求。
- 旧版引擎的 54 个测试仅验证旧代码，不代表原版游戏已通过 54 项玩法测试。
- 本次不承诺未经实测的所有随机事件、整局结算、所有浏览器与原 Flash Player 完全等价。实际验证结果以交付说明为准。

构建产物已通过 5 项 Playwright 检查：原版入口和元数据、缺角色资源后恢复重试、静音与重载确认/取消、390px 窄屏、动态中文绘制。修复了运行库提示层遮挡重载确认按钮的问题。原版实机试玩已覆盖选人、载入地图、↑ 掷骰移动、AI 回合推进、魔法门分布图和系统菜单。

存档已实际完成“系统菜单 → 存储进度 → 存档一 → 游戏保存完毕 → 重新打开页面 → 进度 → 读取存档一”的闭环，恢复了保存时的游戏日期、角色、位置和卡片。该记录来自同一浏览器环境，不代表已验证跨浏览器迁移。
