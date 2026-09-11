# 原版兼容运行实施方案

目标：根据用户已确认的方案，用 Vue/TypeScript 工程运行 4399 原游戏文件，人物、地图、建筑、UI 与规则来自原文件，替代自绘 3D 版本作为默认入口。

## 边界
- 原始来源：https://www.4399.com/flash/15000.htm 。实际加载链 game3.htm → 4399loading.swf → files.xml → play.swf。
- 原文件保持字节不变，记录来源、大小和 SHA-256；不改写原游戏规则，不移除署名。
- 不以现有纯 TS 引擎的测试证明原版正确。原版验证依靠真实运行、画面和交互、依赖请求。
- 旧 App.vue 移为 LegacyApp.vue，原逻辑文件保留。默认构建只引入原版播放器。
- WebAssembly 运行库使用固定版本 @ruffle-rs/ruffle 0.6.0。本地提供运行库和游戏文件，无运行时 CDN 依赖。

## 任务
1. 资源验证：先写缺失文件会失败的资源测试；补齐 play.swf 及运行中引用的角色文件；验证 SWF 文件头、解压大小和 SHA-256，记录在 public/original/manifest.json。
2. 运行库集成：scripts/prepare-runtime.mjs 从安装依赖复制必要 JS/WASM/许可证到 public/ruffle；predev/prebuild 执行，缺依赖直接失败。
3. Vue 首页：src/original/OriginalGame.vue 管理加载、失败、重试、静音、全屏及卸载；原版 4:3 画面保持比例，不覆盖原 UI。src/original/runtime.ts 管理脚本加载与类型边界。App.vue 替换默认入口，旧版本保留。
4. 验证：Playwright 真 Chrome 打开标题、帮助、选人、进入地图、掷骰及购地；检查所有 SWF 请求成功、无外部运行依赖、重启与失败重试有效；桌面及窄屏截图。npm test 与 npm run build 完成后验证 dist 入口。
5. README 改写为原版兼容运行说明，明确此前自绘实现和未经核实的规则描述已废弃；列明本次实际测试范围与未验证部分。

验收：用户看到原版人物与地图并确认；技术测试不替代最终视觉验收。
