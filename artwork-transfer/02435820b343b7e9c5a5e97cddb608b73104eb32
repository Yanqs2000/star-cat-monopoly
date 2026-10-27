# 3B 续跑入口（先读本页）

status: active
objective: 完成整个 3B 金融与公司批次，而非只交付规则笔记或银行子模块。
workspace: `/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/modern-map-foundation`
branch: `feat/modern-map-foundation`
base: `629db6e`（3A 本地完成、验收记录仍待用户明确通过）

## 恢复时只做三步

1. `collaboration.list_agents`，再运行 `/opt/homebrew/bin/git status --short` 和 `/opt/homebrew/bin/git log -4 --oneline`。以实际句柄、工作树与提交为准；不要重复派活跃工作者或丢弃 WIP。
2. 读本页末尾的“已完成 / 下一步”，再只读相应的 3B 证据或实施计划。不要重新扫描 3A、重导出原素材或重跑已通过的 332 项旧测试。
3. 若额度再次中断，在本页更新实际 HEAD、未提交文件、运行中的进程或 session、最近一次 RED/GREEN、下一条精确命令；重新启动长进程前必须核对原句柄。

## 当前事实

- 用户已明确授权执行所给计划直到 3B 完成；这不等于用户已明确验收 3A。3A 验收记录：`docs/modernization/acceptance-3a.md`。原版 SWF 和 2C 回退点保留，不合并、推送或部署。
- 3B 全范围：原版金融取证；日期和月末顺序；银行存取、贷款、还款、信用月结及 AI；原版 12 家可交易公司股票及正确区分其他表行；公司建筑、股份与董事权；真实界面、浏览器回放、分项与整批审查、验收记录。
- 当前 3A 核心：`src/modern/features/game/{setup,types,controller,world-cards}.ts`，前端 `src/modern/ModernApp.vue`，现代构建仍在同一工作区。源脚本已跟踪于 `docs/modernization/evidence/source/play.swf/scripts/`，完整 JPEXS 输出在父仓库 `.analysis-cache/ffdec/play.swf/scripts/`。
- 系统 `/usr/bin/git`、`python3` 会触发 Xcode 许可；使用 `/opt/homebrew/bin/git` 和 `/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`。不要替用户接受许可，不使用额度重置点。

## 已完成 / 下一步

- 当前只完成了 3B 源码定位。银行取证工作者 `/root/audit_3b_bank` 独占 `phase-3b-bank-evidence.md`；股票取证工作者 `/root/audit_3b_stock` 独占 `phase-3b-stock-evidence.md`。两者此前因额度报错而未落文件，已在额度可用时发续跑消息；先核对实际状态与文件，再决定是否补派。
- 主控负责日期与公司关系，已定位源脚本：`frame_6/DoAction.as:59-64` 初始本地日期；`frame_5/DoAction.as:1445-1665` 换人、月/周/日推进；`frame_4/DoAction.as:2999-3087` 股票日/周/月更新；`frame_5:662-691` 出生公司；`frame_4:1778-2114` 公司地点、购股与董事权。尚未写下正式证据文件。
- 下一步：完成三份互不覆盖的源证据，核对银行/月结与股票/公司/日期的接口及不确定项；再写可执行的 3B 规格和分任务实施计划。随后按 RED→最小规则→控制器/界面→实际浏览器→审查推进，直到整批 3B 可验收。
- 原版 `frame_5` 的 `znmu` 轮转和固定二月 28 天属于已记录疑点；不能凭反编译拼写擅自改变已有回合或将系统日期的闰年处理偷偷当成原版行为。3B 金融需要的月界必须明确、可序列化、可验证。
