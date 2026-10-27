# 非人物图片素材整合

2026-10-18。按用户授权，从 `feat/modern-hd-rework` 的 `modern-map-foundation` worktree 提取非人物素材，接入已验收地图样本。基线为本地 `main` 的 `2644a13`；来源提交为 `02d6ce2`，地图母版和地图工具此前仍是该 worktree 中的未跟踪文件。

## 整合范围

| 内容 | 数量 / 位置 | 使用状态 |
| --- | --- | --- |
| 已验收 5A 地图母版 | `public/modern/hd-masters/map/region-11-9-v2/`，4 张 PNG | 与已验收包中的 SHA-256 逐张绑定 |
| 已验收地图运行切片 | `public/modern/hd-map/region-11-9/`，4 张无损 WebP | 高清画质实际使用；每张 1119×1119，密度 4.3515625 |
| 旧版地图母版、连续风格参考、原图参考 | `public/modern/hd-masters/map/region-11-9/`，9 张 PNG | 追溯与对照，不作为新增生产地图 |
| 相邻区域 M01 两版母版及布局参考 | `public/modern/hd-masters/map/experiments/`，3 张 PNG | 保留调查结果与提示词；待接缝校准，未接入游戏 |

共收录 16 张源图/参考图和 4 张运行切片。PNG 哈希与状态见 `public/modern/hd-masters/map/inventory.json`。布局参考属于旧图裁切，不计为重绘成果。原始生成清单的 `unreviewed` 状态保留；5A 实际批准由独立运行清单中的母版指纹与切片指纹约束，不追认旧稿或 M01。

建筑、公司等既有候选素材及其基础高清映射已经在 `main`，无需重复导入。未导入任何新增人物立绘、动作/表情帧、神灵贴图、Blender 模型、人物制作脚本、人物候选预览或工作区配置。原版及已有高清人物继续使用主分支资源。

## 运行与来源

高清模式读取独立的 `hd-map/manifest.json`，只接受已批准的地图条目。它只覆盖源地图 `[640,420,512,512]`，世界偏移仍为 `[-184,-313]`；不是全地图高清完成。地图补片位于底图之上、地块标记和角色之下，按视口加载；全图概览与离屏时释放纹理，返回跟随后重新加载。

地图清单及四张切片纳入 Git，避免原 worktree 中忽略的 `assets-hd/` 输出丢失。基础高清包保持原版 15,849 项：manifest SHA-256 为 `9cb6b606e2dcb7491d15002e51752b6df4a616e1f0e6983e4fb14f3819bb5e28`。没有复制包含卷毛新动作的 16,155 项返工包，也没有导入 `characterArt` 映射。

地图来源包的 manifest SHA-256 为 `a6c984c5d5249e9d03be288d79db55b0a0077b333796209981189461d6863aa3`；其中 `mapRegions` 的四项明确标记为 `approved`。历史 `visual-acceptance-5a.json` 记录用户于 2026-10-05 决定“5A通过”。本次保留四张运行图原始字节，仅修改独立清单中的公开 URL。

`verify:modern-map-assets` 检查全部源图哈希，在临时目录重建已验收样本、重新分块，检查世界坐标、密度、交叠、母版指纹、运行图哈希、解码后的可见 RGB 和完整 alpha；不会重写素材或变更验收状态。

## 验证入口

使用项目要求的 Node 24.19.0，以及安装了 `scripts/requirements-modern-hd.txt` 的 Python。设置 `PYTHON` 可指定解释器。

```sh
npm test
npm run check:saves
npm run typecheck
npm run verify:modern-hd-assets
npm run verify:modern-map-assets
npm run test:modern-map-assets
npm run build:modern
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4198 npm run test:e2e:modern -- tests/e2e/modern-hd-map-sample.spec.ts
```

浏览器用例覆盖：原版不请求补片；1920×1080、DPR2 高清显示四块地图且不请求新人物图；同种子的完整 GameState 相等；暂停后原版/高清互切状态相等；地图 404 后重试状态相等；1366×768、DPR1 全图释放与跟随重载。截图与运行产物保存在 `/tmp`，不提交测试证据图片。

本任务未运行全活动浏览器回归、手机适配或全地图美术验收。Browser 插件不可用（`Browser plugin not available`），采用项目 Playwright 配置指定的本机 Chrome；SwiftShader 回放只证明功能，不作为设备性能数据。

本次实跑结果：637/637 单元测试、9/9 地图处理测试、6/6 原高清包测试、类型检查、存档 schema 检查、基础高清包完整校验和地图母版重建校验均通过；生产构建通过，保留既有大于 500kB 的分包提示。生产预览 `http://127.0.0.1:4198/modern.html` 的三个 Playwright 用例全部通过（26.7秒）。截图等待切片解码及后续渲染帧，已目检 1920×1080/DPR2 与 1366×768/DPR1 的游戏画面；无空白页、框架错误覆盖或缺图，主对照用例的控制台错误、pageerror、HTTP错误均为空（404用例为主动故障注入）。证据目录为 `/tmp/starcat-non-character-integration/`。

## 本地分支与回退

`main` 在 `.worktrees/non-character-assets/` 独立目录中整合。根目录仍保留 `analysis/modernization-baseline` 及其未提交工作；`modern-map-foundation` 和 `afei-r93` 继续保留原有人物工作。未推送、部署、切换或清理它们。

需要撤销本次整合时，对本次唯一整合提交执行 `git revert`；不需要重置其他分支，也不应删除人物 worktree。
