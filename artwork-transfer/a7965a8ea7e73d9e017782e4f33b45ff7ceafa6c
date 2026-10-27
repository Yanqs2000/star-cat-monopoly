# Phase 3B：银行与信用结算源码证据

> 阶段：3B 实现前静态取证。本文只记录原版 `play.swf` 的可复核行为，不把现有近似实现当作原版规则。
>
> 证据口径：下文路径均相对仓库根目录；简写的 `frame_*` 与 `DefineSprite_*` 均位于 `docs/modernization/evidence/source/play.swf/scripts/`。已跟踪子集没有菜单/金额控件脚本，因此又用仓库 README 记载的 JPEXS 26.2.1 命令把完整脚本和文本只读导出至 `.analysis-cache/3b-bank/`。除非明确写“待动态核对”，结论均由静态源码直接确认。

## 1. 数据字段

原版初始 `moneydate` 每名玩家为 13 个字段，现金与存款均为 `100000`，信用分为 `100`：`docs/modernization/evidence/source/play.swf/scripts/frame_6/DoAction.as:68`。结合读写点可确认本阶段字段：

| 字段 | 含义 | 直接证据 |
| --- | --- | --- |
| `[1]` | 现金 | 存款时减少、取款/借款时增加：`frame_4/DoAction.as:3567-3586` |
| `[2]` | 银行存款 | 取款时减少、存款时增加；月结利息写回：`frame_4/DoAction.as:3567-3577`；`DefineSprite_2527_bank/frame_5/DoAction.as:4-11` |
| `[4]` | 总资产缓存 | 由现金、存款、信用卡已用额、银行贷款及其他资产重算：`frame_4/DoAction.as:2926-2933` |
| `[5]` | 信用评分/银行贷款额度基数 | 人类贷款上限为 `[5] * 1000`，且必须 `> 0`：`frame_4/DoAction.as:3449-3468`；信用卡申请要求 `>= 50`：`frame_4/DoAction.as:3499-3516` |
| `[6]` | 信用卡已用额（待还） | 信用卡取现增加，主动还款和月结减少：`frame_4/DoAction.as:3601-3605`；`DefineSprite_2527_bank/frame_3/DoAction.as:4-24` |
| `[7]` | 信用卡可用额度 | 发卡设为 `100000`；取现减少、还款/月结增加：`frame_4/DoAction.as:3525-3528,3601-3605`；`DefineSprite_2527_bank/frame_3/DoAction.as:12-24` |
| `[8]` | 银行贷款余额（待还） | 借款增加、主动还款和月结减少：`frame_4/DoAction.as:3583-3595`；`DefineSprite_2527_bank/frame_4/DoAction.as:4-21` |

字段关系可写成原版资产缓存公式：`netWorth = int(cash + deposit - creditUsed - bankLoan + propertyValue + stockValue)`；具体资产项见 `frame_4/DoAction.as:2926-2933`。信用卡 `available` 不进入净资产。

`[5]` 的所有增减来源尚未在本次银行范围内穷举；本文只确认它在银行界面中承担上述两个资格/额度判断。

## 2. 人类路过银行

移动到 `builddate[dz][1] == 18` 的格子后，每一个到达步骤都会按玩家类型分流；`playerdate[pid][1] == 0` 的人类进入 `self_pg1()`，否则执行 AI 分支：`docs/modernization/evidence/source/play.swf/scripts/frame_5/DoAction.as:1828-1847`。因此银行不是仅在最终落点触发。

人类在 `week_id != 0` 时先看到“路过银行要进入吗？”；`week_id == 0` 时只显示“银行周日休息一天”，然后离开：`frame_4/DoAction.as:3372-3404`。选择进入后打开银行菜单；选择不进入则直接结束本次银行步骤。

补充完整 JPEXS 导出确认菜单的七项可见标签与返回值：`1 取款`、`2 存款`、`3 贷款`、`4 还贷`、`5 申请信用卡`、`6 缴纳刷卡额`、`7 取消`。文本见 `.analysis-cache/3b-bank/1534.txt:1` 至 `1539.txt:1` 与 `1523.txt:1`；返回值 1/3/5 见 `.analysis-cache/3b-bank/scripts/DefineButton2_1528/BUTTONCONDACTION on(release).as:1-4`、`DefineButton2_1529/BUTTONCONDACTION on(release).as:1-4`、`DefineButton2_1530/BUTTONCONDACTION on(release).as:1-4`，返回值 2/4/6 见相邻的 `DefineButton2_1531`、`1532`、`1533` 同名脚本 `:1-4`，取消见 `DefineButton2_1522/BUTTONCONDACTION on(release, keyPress Right).as:1-4`。主状态机中 `yesno_id == 7` 直接转结束路径：`frame_4/DoAction.as:3558-3561`。

### 2.1 存取款与借还款

| 操作 | 进入条件与输入上限 | 确认后的原子变更 |
| --- | --- | --- |
| 取款 | 存款 `[2] > 0`；计数器上限为当前存款 | `cash += amount; deposit -= amount` |
| 存款 | 现金 `[1] > 0`；上限为当前现金 | `cash -= amount; deposit += amount` |
| 银行贷款 | 信用分 `[5] > 0` 且旧贷款 `[8] == 0`；上限为 `score * 1000` | `cash += amount; loan += amount` |
| 偿还银行贷款 | 贷款 `[8] != 0` 且现金 `[1] > 0`；上限为 `min(cash, loan)` | `cash -= amount; loan -= amount` |

资格与上限见 `frame_4/DoAction.as:3411-3493`，实际写回见 `frame_4/DoAction.as:3563-3597`。金额控件只能追加十进制数字，并在追加前用 `(max-digit)/10` 限制结果不超过上限；另有“最大”“归零”“退格”“结束”：`.analysis-cache/3b-bank/scripts/DefineButton2_1446/BUTTONCONDACTION on(release, keyPress 8).as:1-7`（其余数字同构）、`DefineButton2_1455/...:1-3`、`DefineButton2_1457/...:1-3`、`DefineButton2_1458/...:1-3`、`DefineButton2_1459/...:1-4`。结束时 `Number(counter_say2)`，NaN 回退为 0，再写回父级：`.analysis-cache/3b-bank/scripts/DefineSprite_1463_counter/frame_2/DoAction.as:1-8`。

所以原版 UI 只产出 `0..max` 的整数；**0 是有效提交**，金额控件没有独立取消。负值仅是父状态机等待期间使用的哨兵（初始化为 `-1`），控件本身不会生成，且主逻辑的 `yesno_id >= 0` 会阻止其写回：`frame_4/DoAction.as:3565-3595`。

独立 RED 例：

- `cash=300, deposit=700`，取款输入 `250` 后应为 `cash=550, deposit=450`；总和不变。
- `cash=300, deposit=700`，存款输入 `300` 后应为 `cash=0, deposit=1000`；输入上限不是总资产。
- `score=37, loan=0, cash=100`，可借上限 `37000`；借 `12000` 后 `cash=12100, loan=12000`。
- `cash=4000, loan=9000`，还款上限 `4000`；还 `4000` 后 `cash=0, loan=5000`。
- 上述任一操作输入 `0` 都进入完成路径但资金不变；负值不能结算。

### 2.2 信用卡申请与主动还款

申请同时满足：`used == 0`、`available == 0`、`score >= 50`、卡片数 `<= 23`（即仍有第 24 个槽位）。批准后把卡号 `1` 插到手牌首位、数量加一，并设 `available=100000`；不改现金：`frame_4/DoAction.as:3496-3530`。

主动还信用卡要求已经有信用状态（`used > 0` 或 `available > 0`）且现金 `> 0`；计数器上限是 `min(cash, used)`。提交后 `cash -= amount; used -= amount; available += amount`：`frame_4/DoAction.as:3532-3556,3599-3607`。

独立 RED 例：

- `score=49, used=0, available=0, 23 张手牌`：拒绝；`score=50` 时批准，信用卡插入首位（原数组 `[1]`、现代 0-based inventory 的索引 0），额度为 `100000`，手牌变 24 张。
- `cash=3000, used=5000, available=95000`，主动还款上限 `3000`；还款后为 `cash=0, used=2000, available=98000`。
- `used=0, available=100000` 仍被视为“已经有信用卡”，不能重复申请。

银行结束统一刷新资金面板并令 `sport_id=3` 继续移动：`frame_4/DoAction.as:3617-3623`。

## 3. AI 路过银行

AI 分支 `AI_build18()` 不检查 `week_id`，按 `playerdate[pid][8]`（AI 等级）执行三层逻辑，最后直接 `sport_id=3`：`frame_5/DoAction.as:1-70`。

1. 等级 `> 2` 且 `loan == 0`：固定借 `100000`，现金同时增加 `100000`；不检查信用分。
2. 等级 `> 1` 且首张卡不是信用卡、卡片数 `< 24`：把信用卡插到首位并设 `available=100000`。该判断只看首张卡 `_loc2_[1] != 1`，并未扫描整副手牌。
3. 等级 `> 0`：保持 `cash + deposit` 总和，将现金重设为以下目标，余数全部成为存款。原版 `random(n)` 返回 `[0,n-1]` 整数：

| 总现金资产 `T` | 新现金 |
| --- | --- |
| `T > price_id * 300000` | `price_id * 100000 + random(30000)` |
| `price_id*200000 < T <= price_id*300000` | `price_id * 80000 + random(20000)` |
| `price_id*100000 < T <= price_id*200000` | `price_id * 50000 + random(20000)` |
| `price_id*40000 < T <= price_id*100000` | `price_id * 30000 + random(10000)` |
| `T <= price_id*40000` | 全部转为现金，存款为 0 |

独立 RED 例（令 `price_id=1`）：`T=300001` 时现金范围为 `100000..129999`；`T=300000` 落入下一档，现金范围为 `80000..99999`；`T=40000` 现金恰为 `40000`、存款为 0。借款发生在重分配之前，所以等级 3 AI 的 `T` 包含刚借的 `100000`。等级 0 不借款、不领卡、也不重分配。

随机消费也由该分支精确决定：AI 等级 `>0` 且 `T > price_id*40000` 时恰调用一次 `random(...)`；最低档不调用。借款与领卡不消费随机数，人类银行操作也不消费随机数。实现测试应注入 RNG，并断言阈值等号两侧的调用次数与上界。

## 4. 月初银行弹窗结算

主循环在 `day_id == 1` 且当前玩家之后没有其他未破产玩家时挂载 `bank` 月结弹窗：`frame_5/DoAction.as:1467-1487`。银行 sprite 的静态帧顺序为：公司分配（frame 2）→ 信用卡月还（frame 3）→ 银行贷款月还（frame 4）→ 存款利息（frame 5）→ 资产/排名展示（frame 6）→ 清理并回主循环（frame 10）。

### 4.1 公司分配先入存款

只处理 `stockdate[i][17] > 0` 的公司。每名持股者先得到自己的持股数 `shares`，再得到 `int(companyProfit * shares / allPlayerShares)`；随后公司利润清零。最后仅未破产玩家把 15 家公司的逐项结果总和加到存款：`DefineSprite_2527_bank/frame_2/DoAction.as:19-76`。

公式：`award[p,c] = shares[p,c] + int(profit[c] * shares[p,c] / totalShares[c])`。

- 分母 `totalShares` 在 `profit>0` 时未显式防 0；不过只有 `temp > 0` 才写入利润份额。零持股/零分母的 ActionScript 具体数值传播应动态核对，不能擅自规定。
- `int` 对每个玩家独立截断，余数不再分配，因此不能假设利润总额守恒。
- 破产玩家仍参与总持股分母与逐项 `date0` 计算，但最终不会把奖励写入存款；公司利润仍会清零。

RED 例：利润 `10`，A/B 各持股 `3/2`，则 A 得 `3+int(10*3/5)=9`，B 得 `2+int(10*2/5)=6`；总发放 `15`。若 A 已破产，B 仍只得 `6`，A 的 `9` 不入账，利润仍清零。

### 4.2 信用卡月还

仅 `used > 0` 时处理：`used <= 10000` 则本月全还并把 `available` **直接重置为** `100000`；否则还 `int(used/2)`，`used -= payment`、`available += payment`。付款先从存款扣；若存款变负，将这个负数加到现金，再把存款归零，即不足部分由现金承担：`DefineSprite_2527_bank/frame_3/DoAction.as:1-30`。该循环不检查 `playerdate[i][3]`，破产玩家也会执行信用月还。

公式：

- `used <= 10000`: `payment=used; used'=0; available'=100000`
- `used > 10000`: `payment=int(used/2); used'=used-payment; available'=available+payment`
- `deposit1=deposit-payment`; 若 `deposit1<0`，则 `cash'=cash+deposit1; deposit'=0`。

RED 例：`cash=5000, deposit=3000, used=12001, available=87999`，付款 `6000`，结果 `cash=2000, deposit=0, used=6001, available=93999`。这里是存款优先、现金补差，现金允许变负。

这里没有信用卡利息或手续费：月结只归还既有 `used` 本金；`used > 10000` 时的“减半”是本期还款额，不是新增利息。

### 4.3 银行贷款月还

仅 `loan > 0` 时处理；`loan <= 10000` 全还，否则固定还 `10000`。同样先扣存款，不足部分扣现金，存款归零：`DefineSprite_2527_bank/frame_4/DoAction.as:1-27`。没有贷款利息或额外手续费；该帧同样不跳过破产玩家。

RED 例：`cash=2000, deposit=3000, loan=12000`，月还后 `cash=-5000, deposit=0, loan=2000`。

### 4.4 存款利息最后结算

若此时 `deposit > 0`，利息为 `int(deposit/10)` 并立即加入存款，即每月 **10%**、向零截断；不是按日计息，也不会在普通存取款时惰性结息：`DefineSprite_2527_bank/frame_5/DoAction.as:1-18`。该循环也不检查破产标记。

由于顺序固定，利息基数是完成公司分配、信用卡还款和银行贷款还款后的存款。RED 例：月初存款 `10000`，先收到公司分配 `1000`，信用卡月还 `2000`，贷款月还 `1000`，则计息前为 `8000`，利息 `800`，月结后存款 `8800`。

frame 2 可由 150 帧计时或按钮进入下一帧：`DefineSprite_2527_bank/frame_2/DoAction.as:79-93`。随后界面的“继续 →”按钮（文本 `.analysis-cache/3b-bank/2418.txt:1-7`）执行 `nextFrame(); timez=0`：`.analysis-cache/3b-bank/scripts/DefineButton2_2417/BUTTONCONDACTION on(release, keyPress Right).as:1-4`。frame 6 在财务结算后调用 `asset_pg()` 重算资产/排名，并用一次 `random(date2.length)` 随机冠军台词；这次随机只影响文案，但会推进原版全局随机序列：`DefineSprite_2527_bank/frame_6/DoAction.as:1-47`。

frame 10 清理音乐、设 `_root.system_id=0`、`_root.tenor_id=3`、`_root.gotoAndPlay(12)` 并移除弹窗：`DefineSprite_2527_bank/frame_10/DoAction.as:1-8`。这是静态可确认的结算完成信号；控制器必须等到完整月结确认结束后再恢复日历 continuation。

## 5. 与当前 3A/现有实现的契约差异

当前 `applyBankCredit` 只实现“申请信用卡”，人类资格与原版大体一致，但 AI 只实现等级 `>1` 的领卡，缺少等级 `>2` 借款与等级 `>0` 资金重分配；入口只暴露 `requestCredit/leaveBank`：`src/modern/features/game/world-cards.ts:564-583`；`src/modern/features/game/controller.ts:742-764`。当前直接信用卡允许有限非整数和 0 金额，更新 `cash/used/available` 且不消耗卡：`src/modern/features/game/direct-cards.ts:218-226`。原版信用卡取现也不消耗卡、允许 0，但复用整数金额控件，输入上限是 `available`：`docs/modernization/evidence/source/play.swf/scripts/DefineSprite_3693_usecard/frame_4/DoAction.as:6-29`。因此 3B 需要收紧非整数金额，而不改变 3A 已确认的“不消耗卡”契约。

当前通用 `src/core/rules/bank.ts:5-55` 是“按日单利、操作时惰性结息”的自创规则，与原版月初 10% 存款利息冲突，3B 不能复用其计息语义。

3B 最小接口应补齐：

- 玩家银行会话：`withdraw/deposit/borrow/repayLoan/applyCredit/repayCredit/leave`，金额校验要把 0 与取消区分开。
- AI 银行：显式输入 AI 等级、`price_id` 与可注入 RNG；借款、领卡、资金重分配必须一次按源码顺序执行。
- 月结：一个固定顺序的纯结算入口，输出逐玩家/逐公司的可审计明细；结算完成后由控制器继续既有 calendar continuation。
- 玩家信用状态继续需要 `{ score, used, available }`，另为银行贷款余额建独立字段；不要把信用卡已用额与银行贷款合并。
- 所有支付路径须保留“存款优先、现金补差且可为负”的原版行为，破产判断留在月结完成后的既有回合/日历流程。

## 6. 待动态核对，不得臆造

1. `profit>0 && totalShares==0` 的 ActionScript/Ruffle 运行时结果。
2. 月结“继续”按钮在 frame 3、4、5、6 的实际可点击时间与动画节奏；静态代码已确认按钮动作、财务帧顺序及最终完成信号。
3. 月结完成后 calendar 的完整可见动画/提示先后；本文只确认银行关闭时把主循环恢复到 `tenor_id=3` 并跳到主时间轴 frame 12。
