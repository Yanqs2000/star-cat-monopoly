# 2B 开局与回合：实施前证据

2026-09-12：用户回复“嗯，可以，验收通过”，2A（5997b7e）已通过，开始2B。22:47按用户指定时间恢复，实施计划见 ../superpowers/plans/2026-09-12-modern-turns.md。

## 本批范围

沿用 roadmap.md 的2B：12角色选人、AI补位、出生区、骰子、逐格移动、普通路口、回合交替。退出条件：指定骰点到达预期格，路径/方向/步数一致，快慢模式不改变最终核心状态。完成后等待用户验收；买地收租属于2C。

## 已核对的原版行为

所有路径相对于 `docs/modernization/evidence/source/play.swf/scripts/`。

- `DefineSprite_3130_startmenu/frame_122/DoAction.as`：12角色；选中1至4人，选中角色都是人类；不足4人时从未选角色中随机抽取、不放回，设为AI。随后从 `[1,2,3,4]` 随机、不放回分配出生区。第5次选择会移除最先选择的人；再次点已选角色会取消。
- `frame_3/DoAction.as:494`：四出生区每区有两组 `[方向,列,行]`：`[[1,34,8],[3,33,7]]`、`[[2,29,33],[4,30,32]]`、`[[1,7,35],[3,6,34]]`、`[[2,10,10],[4,11,9]]`。
- `frame_5/DoAction.as:641`：每位玩家随机选该区两组出生姿态之一；像素坐标为列乘56、行乘40。
- `frame_3/DoAction.as:500`：四方向位移为 `(56,40),(-56,40),(-56,-40),(56,-40)`，对应网格对角移动。
- `DefineSprite_1609_tz1/frame_20/DoAction.as` 与 `frame_65/DoAction.as`：普通骰子为 `random(6)+1`，写入剩余步数。
- `frame_4/DoAction.as` 的 `goload_pg`：慢速一格16次位移，快速8次；运动耗时应与规则状态分离。
- 同文件 `selfveer_pg`：使用 `builddate[格ID][6]` 的方向数组，排除当前方向的反向（映射3、4、1、2），在剩余方向中随机选择。人类与AI都适用，不是人工选路。
- `frame_5/DoAction.as:1807–1884`：先到下一格，按该格路口规则改向，再扣一步。因此最后一步落在路口时同样更新朝向。银行/商店等特殊经过事件在2B明确未接入。
- `frame_6/DoAction.as:67–68`：初始四位玩家现金100000、存款100000；选人菜单只改名字/AI/角色ID/出生区；`frame_4` 的 `checkMoney` 仅将非数字资产恢复为 money_1st 初值。2B不执行其他资金事件。

## 轮转与路网补充核验

- `goback` 在 `tenor_id == 4` 中递增pid，大于znum时置1；找到未破产玩家即break。本批固定四名未破产玩家，按1→2→3→4→1轮转；破产/日历属于3D。
- B-02不能按反编译语法判断为“回合永远不推进”：原pcode条件是 `Greater; Not; Not; If exit`。未定义znmu导致数值比较异常时，其实际行为不同于直接翻译的JS `<=`。独立126字节SWF探针保留相同条件指令，运行本机Ruffle0.6.0，trace得到 `B02: entered loop body`。探针原始hex与结果见 [b02-runtime-probe.json](evidence/b02-runtime-probe.json)。这是条件指令级验证，不是已验证所有破产分支；不宣称已修复原版B-02。
- 原理交叉参考：[Ruffle AVM1执行器](https://github.com/ruffle-rs/ruffle/blob/master/core/src/avm1/activation.rs) 的 action_greater/action_not，以及 [traceObserver API](https://ruffle.rs/js-docs/master/interfaces/Player.PlayerV1.html)。探针第一次在load前设置observer未收到输出；调整为load后设置observer，再运行才获得上述结果。原版SWF未修改。
- 从四出生区的八种姿态出发，用原表的方向顺序穷举合法分支：308个可达位置/朝向状态，146个道路格，零条路径进入无对应记录的景物格。2B生成器/测试应覆盖这一路网闭包，避免只验证住宅地块。
- 原版实际试玩补证（本机Chrome、4173原版入口，未改SWF）：选择卷毛/阿牛/吉吉&米米/佳佳四人，开局显示现金100000、存款100000；按上箭头掷骰，卷毛落到魔法门，按右箭头放弃后，当前角色实际切换为阿牛。截图 `/tmp/starcat-original-turn-start.png`、`/tmp/starcat-original-turn-land.png`、`/tmp/starcat-original-turn-next.png` 已人工检查。证明正常回合确实推进，不将B-02误报为无条件卡死；本次只验证第一位→第二位，未覆盖淘汰分支。

## 下一步

1. 核对回合轮转函数 `frame_5/DoAction.as` 的 `goback`，针对现存 B-02 (`znmu`) 区分原版真实行为和反编译结果；不能直接照抄可疑拼写。
2. 从 original-tables.json 导出行走拓扑、出生区及必要初值，形成纯TypeScript规则状态；用手算的固定骰点/随机输入样例做TDD。
3. 将原版12角色的普通四向动作离线导出为PNG并保留各自锚点，不能用卷毛代替其他角色；现有 OriginalSpriteBounds.java 仅硬编码 star1 的ID，需要按各SWF实际时间轴取角色ID。
4. 在已验收场景上接入选人和回合UI；原版入口和2A可回退点保留。
5. 用项目Playwright验证选人→开局→人类掷骰→逐格移动→AI回合→返回人类回合，比较快慢终态并检查素材、全屏、重载和控制台。当前会话未列出 Browser skill，按 frontend-testing-debugging 使用项目Playwright。

本文件是证据与续跑说明，不是已完成的2B验收报告。详细实施计划尚待上述规则疑点核对后编写。
