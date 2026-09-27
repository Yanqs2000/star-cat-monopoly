# 3B 续跑入口（先读本页）

status: implementation-complete-awaiting-user-acceptance
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

## 已完成 / 下一步（2026-09-27 22:56 Asia/Shanghai）

- 最近提交：`9ca7fda`（3B 四条自然生产回放与额度差值修复）、`78877c3`（金融面板/公司图片）、`37f4818`（控制器）、`fd22db0`（银行/月结）。当前未提交 WIP：月结冠军台词 RNG(15) 及测试、旧 3A 浏览器固定路线改写与新 `tests/e2e/modern-play.ts`、本续跑文件。以 `git status --short` 为准。银行/股票取证者已结束；`/root/review_3b_full` **正在做只读独立整批审查**，勿重复派审查。
- 规格与任务在 `docs/superpowers/specs/2026-09-27-modern-3b-finance-design.md`、`docs/superpowers/plans/2026-09-27-modern-3b-finance.md`。Task 1…6 已做；Task 7 的审查修复、最终全量验证、验收记录未完。目标仍是**整个 3B**。
- 最新验证：月结台词 `bank-settlement/finance-ui/finance-controller` 定向 16 项与 `vue-tsc --noEmit` 通过；`npm run build:modern` 771 模块通过。更早整套 `npm test` 为 366/366（台词新增2项后尚未重跑整套）。生产预览 4184 的新 3B 四条自然回放均通过（银行 seed8、股市 seed5、公司 seed16、四真人跨月），截图在 `.analysis-cache/acceptance-3b/`。旧 3A 固定路线改写后，完整生产浏览器 23 项中 22 通过；唯一通用回合用例缺少“离开公司”处理，修后该用例连同月结台词用例在新 build 上定向 2/2 通过。测试专用 `modern-fixtures.spec.ts` 在 **开发服务器** 6/6 通过。seed1 原版公司建筑全图已检查。
- 旧固定 seed 路线已按新金融 RNG 改写并分别通过：seed153 卡片屋/飞弹，seed2 地产购买/运气8图片404，seed40 新卡18图片404，通用回合处理公司。路线搜索的只读临时脚本在 ignored `.analysis-cache/3b-route-search.spec.ts`；`tests/modern/route-search.tmp.spec.ts` 已删除。旧 fixture 在生产预览的 404 是环境错误，开发环境 6/6 已证实。
- 银行首轮生产回放曾暴露授信通知显示内部事件名和“账户无变化”；已 RED→修复为中文结果与真实信用额度增量，并用同一 seed8 生产回放复测。
- 原版预览 4173 旧 session 94102 可能终止，先验 HTTP；现代生产预览 `http://127.0.0.1:4184/modern.html` **本续跑 exec session 56005**，恢复时先验 HTTP，勿仅因工具超时重启。未部署、推送、合并。
- **下一条工作：**检查 `/root/review_3b_full` 审查反馈；逐项核对原版公司收费掷骰、银行月结、资金/持股事件语义和序列化恢复，按 RED 修重要问题。随后运行 `npm test`、`npm run build:modern`、生产 `modern-finance.spec.ts` 及受影响 3A 浏览器回归；按变化影响决定是否重跑全部 23 项。写 `docs/modernization/acceptance-3b.md`、提交最终代码与回退点，验证干净工作树并呈交用户验收。
- 静态/动态差异：负/零 AVM1 `random` 已在 Ruffle 原语探针确认返回 0；自然价格流尚未逐项回放。固定二月 28 天与 `znmu` 反编译疑点均如证据所述；不能因静态拼写擅自改轮转。

## 最新补充（2026-09-27 23:13 Asia/Shanghai）

- 原版 `DefineSprite_1602_yntz2` 完整脚本确认普通公司收费动画在帧 1/10/17 各抽两次 `random(6)`，最后两枚点数相加、帧 50 提交。因此已用 RED 修掉“单骰 1…6”差异；`company.ts` 现在六次抽签并记录最终两骰，控制器按 2…12 倍收费，面板显示点数。源证据已补到 `phase-3b-calendar-company-evidence.md`。定向 `company/finance-ui/finance-controller` 19/19 通过，类型检查通过。
- 原版信用卡金额控件只产整数；3A 基线的直接取现曾接受小数，3B 已 RED 修正为整数（0 仍有效、不消耗卡）。`direct-cards/interaction-controller/interaction-ui` 103/103 通过。周日股市和银行零金额通知的内部事件名也已改为中文，定向测试通过。
- 授信反馈素材 404 的生产回放在 2 倍速重试后验证信用卡和额度只发一次，测试在 `modern-finance.spec.ts`；另有银行/股市/公司暂停命令和同局“交易→认购→公司分配→信用/贷款月还→利息→股价”的定向测试。最新完整 `npm test` 为 **372/372**，但这些新增测试后需最终再跑一次。独立审查 `/root/review_3b_full` 仍在进行。
- 当前 HEAD 仍为 `9ca7fda`；本段修复、浏览器旧路线、`acceptance-3b.md` 草稿、续跑文件均未提交，见 `git status --short`。现代生产预览 4184 已重启为 **exec session 56005**，最终构建在普通公司双骰修复后运行过；周日通知最新文字尚未再构建。恢复时先检查 HTTP 与 review agent，勿重复启动或派工。
- 下一步：处理 review 的 Critical/Important；之后一次性最终 `npm test`、`npm run build:modern`、受影响生产浏览器回放（至少 `modern-finance.spec.ts`，必要时全量 23 项）以及开发 fixture 6 项；定稿 `acceptance-3b.md`，提交 WIP 并验证工作树干净。不要把草稿或旧 22/23 报告为最终完成。

## 最新补充（2026-09-27 23:23 Asia/Shanghai）

- 审查初步指出正利润但无人持股时缺少诊断流水；已 RED→GREEN 补 `company-undistributed-profit`，月结面板显示来源金额。另据原版 `stockz/frame_4` 扫描顺序补现任 CEO 卖出后其他人并列最高的继任测试，修正证据/规格的过宽表述；当前代码原本与源码相符。
- 最新整套 Vitest **39 文件、375/375**；`npm run build:modern` 类型检查与 771 模块构建通过；生产预览 4184 的 5 个文件 **24/24**，开发夹具 **6/6**。`git diff --check` 通过。验收草稿已写入截图链接和数值，独立复审最终报告、最终提交及干净工作树仍待处理。
- 生产预览 4184 当前仍在线（原 exec session 56005），不要重复启动。`/root/review_3b_full` 仍在只读复审；已两次请其尽快给最终问题。3A 验收措辞通过异步问题向用户核实，不要自行把此前不明所指的“验收通过”记为 3A 明确验收。
- 下一步：取回 reviewer 最终报告，逐项修重要问题并只重跑受影响门禁；完成 `acceptance-3b.md`、实施计划 Task 7 最后一框和本页，然后提交、核对干净工作树并呈交用户验收。若用户答复 3A 验收问题，再更新 `acceptance-3a.md`。

## 最终续跑状态（2026-09-27 23:31 Asia/Shanghai）

- 3B 功能与测试已完成：银行、股票、公司/董事权、单一日历与月结、原版素材及界面、恢复/重试均在同一现代对局中。代码/测试核验 HEAD `545b964`；3A 回退点 `629db6e`。未推送、合并或部署。
- 最终 `npm test` 39 文件 **375/375**；`npm run build:modern` 类型检查及 771 模块构建通过；生产 Chrome 5 文件 **24/24**，开发夹具 **6/6**。复审后又定向通过 seed8 银行授信→信用卡取现及活跃全屏、seed2 连续两轮买地、seed153 飞弹画面三项。无产品代码在上述最终构建之后变更；新增的是测试与验收文档。`git diff --check` 通过。
- 独立只读复审无 Critical、未发现剩余 3B 数值/时序/恢复缺陷；指出的唯一 Important 是旧 3A 生产覆盖删减，已按新 RNG 路线拆分补回。精确飞弹中心由单元测试锁定为两次 `(560,400)`；生产画面可见效果和目标住院，不能把生产 Pixi bundle 当成独立模块探针。
- `docs/modernization/acceptance-3b.md` 为交付记录，含入口、原版差异、截图、测试、回退点。等待用户对 3B 验收；3A 的“验收通过”所指阶段另以异步问题核实，若答复明确为 3A 再更新 `acceptance-3a.md`。本续跑文件用于恢复上下文，以上本节优先于早期 dated 补充。
