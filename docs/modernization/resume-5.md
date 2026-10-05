# 第五阶段 5A/5B 续跑记录

日期：2026-10-05。用户目标“先完成 5A 和 5B”已完成工程实现、生产构建、整批浏览器回放和独立复审；整批用户验收仍待确认。该记录截至5A/5B交付。后续5C实际进度以 [5C续跑记录](resume-5c.md) 为准；第6阶段未开始。

## 工作树与回退

- 项目：`/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/modern-map-foundation`
- 分支：`feat/modern-map-foundation`
- 本批基线：`8d2813b`；阶段 4 回退点：`5bca5b8`；5A/5B 规划提交：`b8dd51a`
- 正式 `public/original/*.swf` 未修改。`public/modern/assets-hd/` 和 JPEXS 工作 SWF 均处于忽略目录。
- 当前高清清单 SHA-256：`9cb6b606e2dcb7491d15002e51752b6df4a616e1f0e6983e4fb14f3819bb5e28`。
- 5A/5B 基础实现：`ced33f8`（`feat(modern): add original and hd asset profiles`）；最终规则 RNG 隔离与完整回放：`5da56f8`（`fix(modern): isolate portal visual rng and verify HD parity`）。本次验收/续跑文档随后另行提交。回退阶段 4 的代码点仍为 `5bca5b8`。

## 5A/5B 当前结果

5A 地图源保持 2700×2552；12 角色普通动作、表情、欢呼与神灵覆盖已逐帧按 2×生成。5B 用 15,849 张 WebP 覆盖原有 PNG 路径。2,518 张非角色时间轴图由 JPEXS 按 2×重绘，11 张已选公司建筑候选接入公司 2–12。2 张静态资源（地图和公司对话框）使用预乘 alpha Lanczos 插值。

画质在选人页可切换；对局中只允许暂停、稳定回合边界切换。候选资源在隐藏画布完整准备，提交前复核暂停、速度、相机和完整状态；对局区阻断输入，但顶部菜单可以取消。原公司对话框 URL 响应 profile 更新。操作者状态和 GameState 不因画质变化而更新。

补齐的同种子跨画质回放发现：魔法门头像视觉循环曾推进权威 `rngState`，帧时机随资源加载/刷新调度变化，导致转运方向和后续股价不同。现将循环状态放入可序列化的可选 `visualRngState`，保留魔法门入场抽样及选站方向抽样；100ms/1,000ms 等待和生产浏览器同局回放均验证规则 RNG 不再受头像动画节奏影响。`snapshot.schema.json` 已从权威类型重新生成，旧快照无此可选字段仍可解析。

详细边界与用户入口见[5A/5B验收记录](acceptance-5a-5b.md)；路径、像素、透明通道、候选哈希及重建方法见[5B资源清单](evidence/phase-5b/asset-inventory.md)。

## 最近验证

- 最近全量单测：`npm test`，80 个文件、627 项通过；最终 `npm run build:modern -- --outDir .analysis-cache/modern-hd-parity-prod` 含类型检查成功；`npm run check:saves` 成功。
- 高清资源脚本：6 项通过；15,849/15,849 源路径对应、哈希/alpha/尺寸/锚点/时序均通过，WebP 共 244,614,960 字节，清单 SHA-256 `9cb6b606e2dcb7491d15002e51752b6df4a616e1f0e6983e4fb14f3819bb5e28`。
- 最终生产 Playwright 共 13 项通过：`modern-hd-assets.spec.ts` 6 项与 `modern-hd-replay-parity.spec.ts` 7 项。逐字段对照同种子原版/高清完整 GameState 和 RNG，覆盖开局、公司、NPC、魔法门、彩票、月结；还验证暂停点切换、失败恢复、活动画布、全部27组资源预览以及生产画质资源网络/纹理。
- 资源浏览器实测：Chromium `MAX_TEXTURE_SIZE=8192`，图集最大维度 5400；共收集1,294个高清网络响应/1,288张唯一图像，响应正文13,642,813字节。按资源清单像素算出的唯一图像RGBA解码尺寸约405,149,136字节，不等于实际驻留GPU内存。约810张世界/NPC图占225MB解码尺寸，地图占110MB；作为本地桌面运行成本记录，未声称测出实际GPU峰值。
- 独立复审关闭全部 Critical/Important：确认魔法门规则RNG隔离与可选Schema字段；确认转运后稳定状态比较，完整响应计数不受Resource Timing上限影响。13项生产E2E由主执行者复跑。
- `tests/modern/carnival.spec.ts` 比较30/60/120刷新下完整 CarnivalGame 和 RNG；其他动画锚点由原始manifest和全资源校验器对照来源验证。

## 本地进程与下一步

- 用户预览 `127.0.0.1:4184`（PID 54331）保留运行，未替换其输出。
- 开发服务器 `127.0.0.1:5185`（PID 56774）。
- 生产 E2E 预览 `127.0.0.1:5192`（PID 59415），读取 `.analysis-cache/modern-hd-prod/`。
- 当前分支验收预览 `127.0.0.1:5193`（PID 64983），读取 `.analysis-cache/modern-hd-parity-prod/`，保留供用户检查；不要误把未改动的4184页当成本分支结果。
- 上述为5A/5B交付时的下一步；用户后续已授权实施5C并检查、合并分支。当前入口和下一步以 [5C续跑记录](resume-5c.md) 为准。不要提前部署或删除忽略目录中的生成图集。
