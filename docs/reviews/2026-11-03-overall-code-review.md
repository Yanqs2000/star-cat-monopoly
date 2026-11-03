# 整体代码审查 · 2026-11-03

审查快照：[main@3481919c](https://github.com/Yanqs2000/star-cat-monopoly/tree/3481919c966519ef70d172e5a230fb0553399156)（完整 SHA：`3481919c966519ef70d172e5a230fb0553399156`）。
本次按用户要求审查当前整体代码，覆盖核心规则、控制器、存读档、资源加载与构建入口，不仅限于最后一次提交。PR 仅新增这份审查记录，问题仍待修复。

## 结论

确认 **2 个独立 P2 问题**：移动期间丢失控制切换请求；合法负奖券状态无法保存。
工程规范与功能需求两个审查轴独立检查；控制切换问题由两轴同时发现，下面使用同一编号 R1，统计时去重。P2 表示正常使用特定路径会出现的功能错误，需要修复；本次没有确认 P0/P1。

## Standards

### R1 · [P2] 到达回调覆盖移动期间已接受的托管/接管请求

位置：[controller.ts:833–834](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/src/modern/features/game/controller.ts#L833-L834)。

`startStep` 在动画开始前用 `step(current)` 创建整个 `arrived` 快照，动画结束时执行 `current = arrived`。同时 [requestControl](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/src/modern/features/game/controller.ts#L1413-L1418) 允许移动期间更新 `current.pendingControl`，而 [控制面板](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/src/modern/features/game/GamePanel.vue#L101-L107) 的按钮也保持可用。因此，动画期间已接受的“托管”“接管”或“全体托管”请求被旧快照覆盖，不会在回合末应用。

**复现：**

1. 创建控制器，调用 `roll(1)`，让移动的定时回调处于等待状态。
2. 调用 `requestControl(1, 'autoplay')`：返回 `true`，`pendingControl` 为 `{"1":"autoplay"}`。
3. 执行一次移动到达回调：`pendingControl` 变成 `{}`，玩家仍为 `human`。

**生产页面证据：** 在无缓存的新浏览器上下文中，默认高清开局，选择角色 1、2、9、11，以固定星期、日期及随机种子 109 的可重复输入掷出 6。移动动画期间实际点击“卷毛 · 托管”，读取页面的权威状态投影：

```json
{
  "accepted": {
    "pendingControl": {"1": "autoplay"},
    "position": {"column": 29, "row": 33}
  },
  "afterArrival": {
    "pendingControl": {},
    "controller": "human",
    "position": {"column": 28, "row": 34}
  }
}
```

**建议：** 在移动到达时基于最新状态提交移动增量，保留延迟期间接受的控制请求。增加覆盖单角色与全体托管、暂停后继续的定时回归。现有 [lifecycle-controller 测试](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/tests/modern/lifecycle-controller.spec.ts#L50-L58) 在落地阶段提交请求，未覆盖这个时序。

未找到独立的 `CODING_STANDARDS.md` / `CONTRIBUTING.md`，未确认额外的硬性规范违例。Fowler 代码气味仅作为启发式检查，本次没有足够具体、值得单列的气味发现；不把类型工具已检查的规则重复列为问题。

## Spec

### R2 · [P2] 存档校验拒绝规则允许的负奖券，导致全部存档槽无法保存

位置：[snapshot.ts:54](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/src/modern/features/saves/snapshot.ts#L54)。

需求依据：

- [事件设计，第 9 行](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/docs/superpowers/specs/2026-09-15-modern-events-design.md#L9)：“类型2直接改奖券，负奖券不截断”。
- [存档设计，第 9 行](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/docs/superpowers/specs/2026-10-04-modern-saves-design.md#L9)：允许存活玩家在稳定的 `awaiting-roll` 边界保存。

规则函数 [applyLuckEvent](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/src/modern/features/game/events.ts#L66-L67) 正确保留负奖券；现有 [events 测试](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/tests/modern/events.spec.ts#L154-L158) 也明确期望 20 券减至 -80。快照校验却调用默认最小值为 0 的 `integer(g.tickets[p.id]!)`。

**复现：** 初始 200 券，应用正常的第 37 号事件（扣 100 券）三次，得到 -100 券。此时 `canSaveGame` 仍返回 `true`，但 `createSnapshot` 抛出 `存档无效：整数范围`。这不是篡改存档才出现的问题；正常规则可以产生该状态。任意一名玩家的奖券为负，就会拒绝整个快照，三个槽位均无法保存，直到负余额恢复。

**建议：** 让奖券的持久化取值范围与权威规则一致，保留有限、安全整数检查。增加“合法负奖券事件 → 创建快照 → SQLite 保存/读取 → 恢复”的跨模块回归，验证负值与 RNG 均不被改写。

### R1 · 同一控制切换问题也违反功能约定

[3D 验收约定，第 14 行](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/docs/modernization/acceptance-3d.md#L14) 要求“安全回合末应用待切换”；[3D 实施计划，第 23 行](https://github.com/Yanqs2000/star-cat-monopoly/blob/3481919c966519ef70d172e5a230fb0553399156/docs/superpowers/plans/2026-10-04-modern-3d.md#L23) 要求检查“切换处理中动作”。R1 中已接受的请求丢失，使此约定无法兑现。复现、代码位置及建议见 Standards/R1；这是同一问题，不能重复计入独立问题数。

## 验证

本次重新执行，均针对上述固定代码快照：

| 检查 | 结果 | 能证明的范围 |
|---|---|---|
| Node.js 24.22.1；`npm test` | 136 文件 / 799 测试通过 | 已有自动回归 |
| `npm run typecheck` | 退出 0 | TypeScript 类型检查 |
| `npm run check:saves` | 退出 0 | 生成的 Schema 与权威类型同步 |
| `npm run build:modern -- --outDir <临时目录>/dist-modern` | 退出 0 | 现代版生产编译及资源复制；存在包体积提示 |
| 两项独立复现脚本 | 均确认问题存在 | 当前实现的两个边界缺陷，未修复 |
| Chrome / Playwright，1440×1000，生产构建 + 独立临时 SQLite | 默认高清，实际点击复现 R1 | 页面非空、无框架错误遮罩，未捕获页面异常或失败资源请求 |

Browser 插件不可用，浏览器验证使用本机 Chrome 和已有 Playwright。测试使用独立临时数据库，不读取或改写用户存档。构建产物、截图及复现文件均在仓库外；临时服务与大体积产物已清理。已有测试全部通过与两个新发现同时成立：这些边界尚未被现有用例覆盖。

### 可复制的最小复现

将下列内容保存到仓库外的 `reproduce.mjs`，在项目根目录使用 Node.js 24 执行 `node --import tsx /绝对路径/reproduce.mjs`。脚本仅断言并打印当前缺陷，不写入项目或存档：

```js
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const mod = relative => import(pathToFileURL(path.resolve(relative)).href);
const {createGame} = await mod('src/modern/features/game/setup.ts');
const {createGameController} = await mod('src/modern/features/game/controller.ts');
const {applyLuckEvent} = await mod('src/modern/features/game/events.ts');
const {createSnapshot, canSaveGame} = await mod('src/modern/features/saves/snapshot.ts');
const jobs=[];let nextId=0;
const scheduler={now:()=>0,setTimeout(callback){const id=++nextId;jobs.push({callback,id});return id},clearTimeout(id){const i=jobs.findIndex(j=>j.id===id);if(i>=0)jobs.splice(i,1)}};
const c=createGameController(createGame([1],153,1),{scheduler,stepDurationMs:100});
assert.equal(c.roll(1),true);assert.equal(c.state.phase,'moving');
assert.equal(c.requestControl(1,'autoplay'),true);assert.equal(c.state.pendingControl[1],'autoplay');
const accepted=JSON.stringify(c.state.pendingControl);jobs.shift().callback();
assert.equal(c.state.pendingControl[1],undefined);
console.log('CONFIRMED R1: accepted control request',accepted,'lost at arrival:',JSON.stringify(c.state.pendingControl));c.dispose();
const g=createGame([1],102);const stamp='2026-11-03T04:00:00.000Z';
createSnapshot(g,[1],{speed:1,paused:false},stamp,stamp);
const actor=g.players[0];let wallet={cash:actor.cash,deposit:actor.deposit,tickets:g.tickets[actor.id]},funds=g.lostAndFoundFunds;
for(let i=0;i<3;i++){const r=applyLuckEvent(wallet,37,funds);wallet=r.wallet;funds=r.lostAndFoundFunds;}
g.tickets[actor.id]=wallet.tickets;g.lostAndFoundFunds=funds;
assert.equal(wallet.tickets,-100);assert.equal(canSaveGame(g),true);
assert.throws(()=>createSnapshot(g,[1],{speed:1,paused:false},stamp,stamp),/整数范围/);
console.log('CONFIRMED R2: legal event37 x3 -> tickets',wallet.tickets,'canSaveGame',canSaveGame(g),'snapshot rejected: 整数范围');
```

## 审查范围与限制

| 范围 | 核对内容 |
|---|---|
| `src/modern/features/game` | 回合、控制器、卡牌/事件、金融、活动、生命周期；对照现有设计与后续修正记录 |
| `src/modern/ModernApp.vue`、渲染/资源模块 | 场景准备、失败恢复、高清配置、异步资源生命周期及实际高清入口 |
| `src/modern/features/saves`、`server` | 快照语义、恢复交接、请求门控、SQLite 事务、并发修订与幂等路径 |
| `src/original`、构建/运行脚本、`vite.config.ts` | 入口与运行库加载、构建资源范围及启动约束；原版入口本次为静态核对 |
| `tests`、`docs/superpowers`、验收记录 | 已有覆盖及需求边界，不把旧阶段的有意延后或已记录修正当成新缺陷 |

这是针对整体架构与关键执行路径的代码审查及定向复现，不等于逐个素材、所有随机路线、所有小游戏和所有设备的穷举验收，也不代表画面相似度或原版全部行为已验收。正式公网部署、网络多人模式和手机适配不属于当前产品范围。没有修改业务代码、现有素材、个人配置或未提交工作。

两轴统计：Standards 1 项（最高 P2：R1）；Spec 2 项（最高 P2：R1/R2）；去重后 2 项。