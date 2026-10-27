# 3B 续跑入口

status: implementation-complete-awaiting-user-acceptance
objective: 按用户计划完成整个3B金融与公司；额度中断后优先从本页恢复。
workspace: `/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/modern-map-foundation`
branch: `feat/modern-map-foundation`
functional_commit: `70af5fc`
rollback_3a: `629db6e`
updated: 2026-09-28 08:03 Asia/Shanghai

## 当前结论

3B 实现、完整范围审计和独立复审已完成，待用户验收。银行存取/借还/信用、股票及日周月更新、公司认购/董事/经营费、必要日历/月结、原建筑和原公司对话框、界面及恢复路径已接入同一现代对局。不调用SWF/Ruffle规则引擎，不推送、合并或部署。详见 `docs/modernization/acceptance-3b.md`。

3A 的旧记录仍为待用户验收；此前“验收通过”所指阶段已用异步问题向用户核实，未收到答复前不要自行改为3A通过。3B也不自行记为用户验收通过。

## 恢复时只做三步

1. 用 `/opt/homebrew/bin/git status --short` 与 `/opt/homebrew/bin/git log -3 --oneline` 核对实际状态。本页功能提交之后只有验收文档提交；不需要重导出原图或重新扫描3A。
2. 若用户验收3B，更新验收记录；若用户明确此前通过是3A，再更新 `acceptance-3a.md`。用户要求进入下一阶段时，从 `roadmap.md` 的3C范围开始，复用3A神灵/医院/监狱和3B日期，不提前加入3D、存档、高清化或部署。
3. 若发现具体新问题，只重现和验证受影响路径。下面已通过证据可复用，不默认重跑整套。

## 最终验证

- `npm test`：40文件、376项通过。
- `npm run build:modern`：Vue类型检查与771模块构建通过；单块超过500kB为提示。
- 最新生产构建25条用例的最后全量结果为24通过、1个测试驱动竞态失败；驱动在异步图片错误出现后误判目标。修正后新卡、运气8、公司原图404定向3/3通过，全部25条均有通过证据；不把它写为一次全量25/25。
- 旧固定seed回放现固定完整2026-09-27日期，避免系统日期改变月界RNG。测试只控制浏览器随机种子/时钟边界，通过真实可见选择操作。
- 开发环境真实组件夹具6/6通过；没有公司分支受本轮原框改动影响，复用该证据。
- 独立整批复审未发现剩余3B数值、RNG顺序或续办缺陷；原公司框补齐后的定向复审无Critical/Important/Minor。审查者未独立重跑门禁。
- 原SWF SHA-256始终为 `790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba`。

## 关键证据与差异

- 三份 `phase-3b-*-evidence.md` 保存源码字段、S1…S6推导样例、AI/营业条件、公司双骰六次随机、日历和月结顺序；负/零AVM1随机探针在 `evidence/stock-negative-random-runtime.json`。
- 原公司框来自show符号1515第20帧深度1/3，排除示例文字，408×356包含原滤镜每边6px；导出器从哈希锁定的SWF只做内存副本，不保存原文件。
- seed96经营费4500后原图404重试仍现金103300、存款100000，两骰3+6=9；继续认购10股只再扣200。
- 金融和3A生产截图在 `.analysis-cache/acceptance-3b/`、`.analysis-cache/acceptance-3a/`，为本地可再生证据。
- 原内部随机流逐位一致未证明；公司50帧掷骰和银行月结逐帧动画使用现代确认面板；零股拒绝、正利润零总股数诊断保护均明确记为现代差异。

## 工具与运行状态

- 原生产预览4184，exec server session56005；恢复时先验HTTP或句柄，不能因为观察超时就重启。
- 全部验证进程已结束；最后定向session56076已返回3/3成功。review_3b_full也已完成，不重复派活跃审查。
- 系统git/python受Xcode许可影响，使用 `/opt/homebrew/bin/git` 与 `/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`；Java为 `/opt/homebrew/opt/openjdk/bin/java`。不替用户接受许可，不使用额度重置点。
