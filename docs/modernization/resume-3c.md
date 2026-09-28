# 3C续跑入口

status: active
objective: 完成用户授权的整个3C，统一交付，不以规则草稿或NPC子模块代替整批完成。
workspace: /Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/modern-map-foundation
branch: feat/modern-map-foundation
base: 6c2238c

## 恢复时

先用/opt/homebrew/bin/git status --short和log -4核对，再读本页最近进度和对应任务brief。不要重新扫描3A/3B或重导出未变化素材。实际进程句柄未终止时不得因观察超时重启。

## 当前进度

2026-09-28 13:02：HEAD eab5fa7（普通NPC、兑换/招领纯规则与控制器），前一提交bdf362c为规格/实施计划/入口证据。Task1静态规则与素材元数据已完成；小游戏动态时序/碰撞probe在Task4/5进入实现前执行。Task2前两项已完成，原图UI/动画/生产回放未做；Task3…6未开始。

最新验证：NPC边界8个RED→9/9；兑换/招领4个RED→4/4；控制器4个RED→4/4，加AI空分支特征检查5/5。整套43文件393项通过（新增AI1项后只定向5/5，当前总数应394）；类型检查通过。只修改backend，ModernApp/Vue尚未接exchange命令，不能称已可玩。

下一步：读取Task2 brief和phase-3c-activities-evidence.md最后元数据表；写activity-assets/activity-ui的RED，导出原trait1319完整60帧（pic1313按9/12/13/14/15/23选帧，排除动态示例文字）、witch2184和lottery2194原800×600背景、fog3758(19帧)、car2 865(111帧)。源脚本完整目录已核对，不重导出已有NPC世界素材。新receipt已在WorldEvent→InteractionNotice持久化；票据/手牌差值UI必须用receipt而非amount。

原素材几何只读Inspector在.analysis-cache/3c-assets/InspectActivities.java，JPEXS jar父仓库.analysis-tools/ffdec-26.2.1/ffdec.jar；尚无新原图产物。全批最终审查才派fresh reviewer，不逐模块派实现者。没有运行中的测试/导出句柄。Skill ledger位于.superpowers/sdd/2026-09-28-modern-3c-activities/progress.md，Task2只能标partial，不可task-done。

Ruling: 用户本轮PLEASE IMPLEMENT授权实施，覆盖引用计划末尾“本轮只规划”；3A/3B验收状态保持实际记录。
Ruling: 已有隔离worktree及已安装依赖直接复用；基线功能70af5fc之后仅文档，既有376项通过证据复用，新功能Task2结束时跑整套验证。

工具：/opt/homebrew/bin/git；Python /Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3；Java /opt/homebrew/opt/openjdk/bin/java。不替用户接受Xcode许可。原生产4184预览server旧session56005，先检查HTTP/句柄再决定启动。源SWF SHA790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba。
