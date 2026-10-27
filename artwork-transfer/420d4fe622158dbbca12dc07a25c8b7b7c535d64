# Task 2：独立开局与移动规则实施报告

## 范围与结果

已实现2B纯TypeScript开局、规则随机、逐格移动和四人回合轮转。规则层不引用DOM、Pixi、Ruffle或旧版 `src/core`。未接入资金事件、特殊格结算、破产、日期、卡牌或UI。

生成器从已提取的原表和经manifest校验的 `play.swf` 生成最小规则数据：

- 146个从8种出生姿态实际可达的道路坐标；
- 28个路口的原始有序方向数组；
- 4个出生区、每区2种原始出生姿态；
- 现金100000、存款100000；
- 原版SWF SHA-256。

生成阶段自身穷举道路闭包并要求结果恰为308个位置/朝向状态、146个坐标；任何路径进入天空/无记录格都会失败。

## 证据边界

`docs/modernization/phase-2b-evidence.md` 已由控制方在实施前核对：初始现金与存款各100000；正常四名未破产玩家按1→2→3→4→1轮转。B-02的独立字节码探针证实未定义 `znmu` 时循环体仍会进入，因此本实现直接表达已验证的正常轮转，不复制反编译出的未定义变量逻辑。淘汰分支仍属后续阶段，本任务没有声称修复原SWF。

## TDD记录

RED：

```text
$ npm test -- --run tests/modern/turns.spec.ts
FAIL tests/modern/turns.spec.ts
Error: Cannot find module '../../src/modern/data/rules.json'
Test Files 1 failed (1)
```

失败原因与预期一致：测试先定义了规则数据和纯状态接口，生产模块尚不存在。

GREEN（最终聚焦验证）：

```text
$ npm test -- --run tests/modern/turns.spec.ts
Test Files 1 passed (1)
Tests 20 passed (20)
Duration 183ms
```

全量单测：

```text
$ npm test
Test Files 12 passed (12)
Tests 89 passed (89)
Duration 11.37s
```

静态验证：

```text
$ npm run typecheck
vue-tsc --noEmit
exit 0

$ git diff --check
exit 0
```

## 实际导出接口

`random.ts`

- `randomInt(state: number, upperBound: number): { value: number; nextState: number }`
- uint32 LCG；种子0有效；每次返回值和下一状态，不保留模块全局状态。

`setup.ts`

- `createGame(humanCharacterIds: number[], seed: number): GameState`
- 校验1至4个不重复角色ID（1..12）和uint32种子。
- 保留人类选择顺序，随后随机不放回补AI；再依次随机不放回分配出生区；最后依玩家顺序随机出生姿态。
- 最后一个出生区仍调用 `randomInt(..., 1)`，保留规则随机消耗。

`turns.ts`

- `roll(state: GameState, fixedDie?: number): GameState`
- `step(state: GameState): GameState`
- `nextTurn(state: GameState): GameState`
- 普通骰消耗一次规则随机；`fixedDie` 是纯核心回放/测试输入，校验1..6且不消耗骰子随机。
- 每步先按当前方向移动到相邻对角格，再按到达路口的原始方向顺序排除反向并抽取出口，最后扣一步。
- 单出口转角也执行一次上界为1的随机抽取；最后一步同样更新方向。
- 所有转换返回新状态；错误阶段或非法命令在构造新状态前抛错。

`types.ts`

- `Direction`、`Hometown`、`PlayerController`、`GamePhase`
- `PlayerState`、`GameState`
- `GameState` 字段：`players`、`activePlayerIndex`、`round`、`phase`、`remainingSteps`、`lastRoll`、`rngState`、`turnPath`。

## 测试覆盖

- 独立字面规则生成结果、最小输出字段、来源哈希；
- 种子0及固定PRNG输出、非法随机参数；
- 人类顺序、AI补位、角色唯一、出生区唯一、资金、无效选择和种子；
- 固定1点和6点、普通骰随机消耗、固定骰不消耗骰子随机；
- 221/225三岔路反向排除、205单出口转角随机消耗、最后一步转向；
- 双掷、错误阶段移动/结束、非法固定骰；
- 成功与失败转换的源状态不变；
- 四人完整轮转与回合数递增；
- 相同种子及命令流的完整状态一致；
- 8种出生姿态穷举308个位置/朝向状态、146个道路坐标、零条无效路径。

## 交接关注点

- PRNG是现代端确定性契约，不宣称复现Flash内部随机序列。
- `fixedDie` 仅供纯核心回放/测试；普通UI应省略该参数。
- `turnPath` 在掷骰时以当前坐标重新开始，逐步追加到达坐标；`nextTurn` 保留上一回合路径和点数，供展示读取，下一次 `roll` 再覆盖路径。
- 规则JSON只含本阶段移动所需数据，没有复制财务、卡牌或事件表。
