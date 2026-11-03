# Mac / Windows 独立桌面安装包设计

日期：2026-11-03。代码基线：`7c1f3bfa47cafc8f4fa496520d834d78b2530ae8`。

状态：用户已于 2026-11-03 明确选择“按方案实施”，批准独立桌面应用、三个架构包及首版未签名/未公证测试版。公开发布与代码合并前仍需最终验收。

## 用户目标

在 GitHub Release 提供普通用户可下载的 Mac / Windows 安装包。安装后双击进入独立游戏窗口，默认高清，完整素材随包附带，不需要用户安装 Node.js、Python、Java 或使用终端。本机手动存读档可跨关闭、重启和覆盖升级保留。

## 方案比较与选定方向

- **Electron 桌面应用（推荐的实现方式）**：自带 Chromium / Node，复用现有 Vue、PixiJS、Fastify 与 node:sqlite；包体包含浏览器运行库。用户已选择这类独立应用，Electron 是实现方建议。
- Tauri 桌面应用：窗口运行库较小，但现有 Node/Fastify/SQLite 后端需要额外 Node sidecar 或重写成 Rust，还需对各平台 WebView 的 WebGL 行为另外验收；当前项目以复用已验证的行为为优先，因此不采用。
- 自带 Node 的浏览器便携包：能复用服务，但启动后仍打开浏览器；用户已选择独立桌面应用，因此不采用。

## 首版交付

建议版本 `v0.2.0-beta.1`，Release 标为测试版：

| 平台 | 文件 |
|---|---|
| Mac Apple Silicon | `StarCatMonopoly-0.2.0-beta.1-mac-arm64.dmg` |
| Mac Intel | `StarCatMonopoly-0.2.0-beta.1-mac-x64.dmg` |
| Windows x64 | `StarCatMonopoly-0.2.0-beta.1-win-x64-setup.exe` |
| 校验 | `SHA256SUMS.txt` |

最低支持的系统版本按锁定 Electron 的官方要求设置并在 Release 注明，不将仅在新系统上的测试宣称为老系统验收。Windows ARM、Linux、自动更新另行安排。

本机代码签名身份为 0。首版建议采用未签名 Windows 包、Mac 本地临时签名且未公证的测试包，并在下载页明确注明系统可能出现的验证/来源提示；不承诺已通过 Apple 公证或 Windows 信誉验证。若用户要求正式开发者签名，需另行提供相应证书及发布凭据，不能代办或假定其存在。

## 运行架构

1. Electron 主进程启动现有 `createSaveServer`，仅监听 `127.0.0.1`，由系统分配空闲端口，避免与网页开发服务冲突。页面和 API 使用该端口的同一 Origin，保留现有 Host/Origin、会话、CSRF、Schema、修订号和幂等校验。
2. 独立 `BrowserWindow` 加载本地服务的 `/modern.html`。默认高清及游戏逻辑保持现有代码。关闭最后一个窗口即退出，退出前关闭 HTTP 服务与 SQLite。
3. 单实例锁避免同一桌面应用重复创建服务；再次启动聚焦已有窗口。窗口关闭后不留下后台服务。
4. 渲染器开启 `contextIsolation`、`sandbox`，关闭 `nodeIntegration`，不提供通用 Node/文件系统桥接；拒绝跳转到外部页面或任意新窗口。现有 HTML 游戏继续通过同源 HTTP API 存档。
5. 存档默认写入固定应用标识的 Electron 用户数据目录，独立于程序安装路径；升级替换应用不能覆盖存档。沿用 `STAR_CAT_SAVE_DB` 配置能力以便受控验证/特定部署。不会静默移动、覆盖源码目录已有 `.data` 或现有浏览器存档。
6. 桌面应用只包装现代高清入口；现有源码网页版、原版兼容入口和 README 启动命令继续保留。

## 构建与资源边界

- 初选 Electron `45.2.1`（其内置 Node `24.22.1`，与现有存档服务约束一致）、electron-builder `26.18.0`；依赖版本锁定，不使用 beta/nightly。
- 在实际 Electron 二进制中验证 `node:sqlite`、Fastify 与文件读写；不能用外部 Node 测试替代 Electron 运行时验证。如果该运行时验证失败，先解决兼容性，不发布不可用安装包。
- 用现有 `build:modern` 产出游戏。只打包桌面入口、必要服务依赖和 `dist-modern` 的运行资源，不包含源码艺术母版、工作副本、测试数据库、个人配置、分析缓存或原版 Ruffle 运行库。
- 采用独立桌面 app 目录与锁文件，运行依赖仅 Fastify、静态服务、cookie、Ajv 及其传递依赖；编译主进程时保留这些包为外部依赖，避免盲目捆绑导致动态资源路径失效。前端构建与高清资源置于可读的应用 resources 目录，业务存档置于可写用户目录。
- 桌面应用图标从仓库现有游戏标识转换平台格式，不重画人物/地图。
- 安装包名称明确标注架构，每个 Release 附件必须小于 GitHub 的 2 GiB 限制；CI 计算真实大小和 SHA-256，禁止把分卷文件冒充完整安装包。超过限制先收敛实际运行资源，不删除仍被引用的素材。

## GitHub 构建和发布流程

1. 使用独立 `feat/desktop-release` 分支与 PR，保留主工作区已有 29 项 Git 待处理内容。
2. GitHub Actions 分别在 `macos-15`（arm64）、`macos-15-intel`（x64）、Windows x64 runner 构建并运行打包后的启动/存档测试；Windows 安装器在 Windows runner 生成，不将 Mac 上交叉生成的文件视作 Windows 实测。
3. PR 分支的 CI 上传安装包和验证证据为 Actions artifacts；打包失败、运行失败或校验不完整时不发布。
4. 提供后续 tag / 手动触发的 Release 构建流程。首轮可把已验证、与确切提交对应的安装包上传到 **Draft + Pre-release**，供用户审查。
5. 完成实际测试与独立代码审查后，交用户最终验收；按用户的 AGENTS.md 确认后再合并代码、公开 Release。发布时标签必须指向通过测试且已纳入 main 的提交，附件版本、架构、来源提交和校验和必须一致。
6. 现有 GitHub Actions 已启用，目前没有历史 Release；本次不修改仓库默认权限，也不在日志打印任何发布/签名凭据。

## 验收与测试

- TDD：先为用户数据路径/端口选择、仅本地窗口导航、应用退出清理、构建资源选择等新行为建立有意义的失败回归，再写最小实现。
- 全量现有测试、类型检查、存档 Schema 同步、现代版构建继续通过。
- 各平台使用实际打包后的程序验证窗口可打开、默认高清、开始对局/掷骰、实际手动保存/关闭/重启后读取、进程退出、无页面错误或资源 404。
- 包内不得含测试数据库和个人文件；核对资源清单、架构、安装包大小、校验和与版本；Mac DMG 验证挂载与实际 app 启动，Windows EXE 验证安装后程序启动。CI 证据必须区分“已安装验证”和“仅未安装目录启动”。
- Mac 两种架构及 Windows 的测试结果分别报告，不能用本机 Mac 验证冒充其他架构/系统已经通过。
- 用户验收后，在 main 对应提交重新确认 Release 附件来源与可下载性，最后清理本轮临时构建和工作副本，保留必要日志与校验结果。

## 明确边界与实施方决策

本次不改变棋盘、人物、规则、存档版本或提供联网功能；不购买证书、不添加自动更新、不上架应用商店。默认首版英文稳定应用标识 `StarCatMonopoly`、中文展示名称“星猫大富翁”。窗口尺寸、打包脚本划分、CI action 的固定版本和日志落点由实施方根据实际测试决定。优先保证能运行且与现有游戏一致，再处理安装器外观细节。

## 核对依据

- https://releases.electronjs.org/release/ （已核对当前稳定 Electron 45.2.1 / Node 24.22.1）
- https://www.electron.build/v26/docs/targets/ （DMG、NSIS）
- https://www.electron.build/docs/features/multi-platform-build/ （目标平台构建与签名约束）
- https://www.electronjs.org/docs/latest/tutorial/context-isolation/
- https://www.electronjs.org/docs/latest/tutorial/sandbox
- https://github.com/actions/runner-images/blob/main/README.md （runner / CPU 架构）
- https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases （附件小于 2 GiB）
