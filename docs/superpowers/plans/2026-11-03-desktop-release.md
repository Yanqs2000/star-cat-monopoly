# Desktop Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 GitHub Release 草稿交付三个可独立安装、默认高清、存档可重启恢复的桌面包。

**Architecture:** Electron 主进程复用现有 Fastify 服务，动态本地端口供隔离的渲染窗口使用。只把现代版资源置入只读 resources，SQLite 放在稳定用户目录。独立 desktop app package 缩减生产依赖，electron-builder 生成 DMG/NSIS，Actions 按真实架构验证。

**Tech Stack:** Electron 45.2.1 / Node 24.22.1、electron-builder 26.18.0、esbuild、既有 Vue/Pixi/Fastify/Ajv/node:sqlite、Playwright。

**Spec:** `docs/superpowers/specs/2026-11-03-desktop-release-design.md`

## Global Constraints

- Mac arm64 / Mac x64 / Windows x64；版本 `0.2.0-beta.1`，初次 Draft + Pre-release，公开发布前用户验收。
- 默认高清、完整离线运行资源、不要求安装 Node/Python/Java；已有网页和规则保持。
- 仅监听 127.0.0.1 空闲端口；保留会话、CSRF、版本化快照、幂等与修订校验。
- 固定应用标识 `StarCatMonopoly`，中文展示“星猫大富翁”；默认用户目录存档，沿用 STAR_CAT_SAVE_DB 可控覆盖。
- 渲染器 sandbox/contextIsolation 开，nodeIntegration 关；拒绝外部顶层导航/新窗口。
- 首版未完成开发者签名、公证，不能声明正式签名；每个附件 <2 GiB，附 SHA256。
- 主工作区 29 项 Git 待处理内容不修改、不上传；安装包不含缓存、个人配置、测试数据库、源艺术母版。

## Review Focus

- 端口占用和重复启动：动态端口/单实例锁；Task 1 实测第二实例聚焦且不多起服务。
- 安装目录只读/覆盖升级：默认数据库独立于 resources；Task 1 路径与 SQLite 测试，Task 2 安装重启恢复。
- 恶意或错误导航：仅同源页面允许；Task 1 测试协议、主机、端口边界。
- Electron 内置 SQLite 和封装后的动态依赖：Task 1 在真实 Electron 验证，Task 2 从真实包启动而非外部 Node。
- 打包遗漏高清/包含用户文件以及错误架构：Task 2 资源清单核对，Task 3 各自 runner 的安装测试与附件清单。

## Task 1: 桌面运行时

**Files:** 创建 `desktop/src/runtime.ts`、`desktop/src/main.ts`、`desktop/package.json`、`desktop/package-lock.json`；创建 `tests/desktop/runtime.spec.ts`；修改根 package scripts/devDependencies、tsconfig include、gitignore；创建 `scripts/build-desktop.mjs`。

**Interfaces:** `resolveSavePath(userData:string, override?:string):string`；`isAppNavigation(url:string, origin:string):boolean`；`startDesktopServer({userData,staticRoot,dbPath?}):Promise<{origin:string,close():Promise<void>}>`；主进程取得 ready 服务后创建 BrowserWindow，退出等待 close。

- [x] 写路径/导航/动态端口/文件 SQLite 关闭重开/保留 Host 与 CSRF 拒绝行为的失败测试，运行确认 RED。
- [x] 最小实现 runtime 与主进程；固定稳定用户目录、单实例、窗口聚焦、启动错误对话框、最后窗口退出和资源关闭。
- [x] 加锁定依赖与独立 desktop lock，编译 Node CJS 入口，外置 fastify/cookie/static/Ajv；在真实 Electron 45.2.1 验证 node:sqlite 与启动。
- [x] 跑定向、全量、类型、Schema，修复后 GREEN；提交桌面运行阶段。

## Task 2: 安装包和运行验收

**Files:** 创建 `electron-builder.yml`、`scripts/prepare-desktop-icons.mjs`、`scripts/desktop-smoke.mjs`、`scripts/verify-desktop-package.mjs`、`tests/desktop/distribution.spec.ts`；按需创建现有标识转换的 `desktop/icons`；修改 scripts。

**Interfaces:** `npm run desktop:build` 创建 `desktop/dist/main.cjs` 和 `dist-modern`；`npm run desktop:package -- --<platform> --<arch>` 产出版本/架构明确的包；smoke 脚本接收实际可执行文件路径与仓库外 evidence/userData 目录；校验脚本接收 app/resources 路径。

- [x] 用临时打包目录验证仅白名单文件进入包、高清 profile/manifest/纹理必须齐全、源码/配置/测试 DB 被排除，先 RED 再最小实现。
- [x] 生成平台图标；配置 app/resources、只读内容与数据库分离；实际制作本机 DMG 并挂载启动。
- [x] 用 Electron Playwright 运行真实包，验证默认高清、开局掷骰、手动保存、关闭/重启恢复、数据库数据/RNG 与资源请求、进程结束；截图/JSON 放仓库外。失败先定位根因，不跳过。
- [x] 全量测试、类型、Schema、网页原入口构建回归；提交安装包与验收脚本阶段。

## Task 3: Actions、草稿与独立审查

**Files:** 创建 `.github/workflows/desktop-release.yml`、`scripts/release-checksums.mjs`、`docs/releases/0.2.0-beta.1.md`；修改 README 下载/系统/签名说明；记录验证证据。

**Interfaces:** PR/push/手动工作流在真实 `macos-15`、`macos-15-intel`、`windows-2025` 上调用 Task 2 命令；安装测试包括 Mac 挂载复制 app、Windows 无管理员静默安装至临时目录后启动；artifacts 含安装包、校验与 smoke 证据。

- [ ] 实测 checksum/大小检查：>2 GiB 或缺失架构包拒绝；按现有项目脚本风格实现，不以源文本匹配测试 YAML。
- [ ] 锁定官方 Actions 版本/提交；CI 只在适当发布阶段授 contents:write，PR 不公开发布。创建 PR 并触发 CI，检查三平台真实结果、日志和安装后截图；失败修复并重跑受影响验证。
- [ ] 独立代码复审整个分支，对每个 Critical/Important 修复并验证，Minor 明确处理；检查既有 Web 构建/813 基线回归。
- [ ] 下载三平台已验证 artifacts，核对来源 SHA/版本/架构/真实大小、SHA256；创建相同提交目标的 Draft + Pre-release，上传三个安装包和 SHA256SUMS、说明。确认附件完整上传，不标为 public。
- [ ] 向用户展示 PR、Release 草稿、安装包结果和限制。等待最终验收后按已授权范围合并、公开发布并核对下载，清理本轮临时构建。

## Execution

用户已明确授权“按方案实施”。本会话由主实现者连续执行上述任务，最后由独立审阅者复审；最终合并/公开发布由用户验收把关。

Self-review：需求均有任务归属；无新增游戏玩法；Task 1/2/3 的接口统一；五类风险均分配实际行为测试。最低系统版本、图标转换工具和 Actions SHA 在实施时查官方依据后锁定。
