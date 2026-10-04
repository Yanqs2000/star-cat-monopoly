# 星猫大富翁第4阶段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 三个可实际手动保存与恢复的服务器槽位及故障/覆盖保护。
**Architecture:** 权威GameState生成schema与共享语义校验；Fastify+SQLite事务及CAS；Vue暂停菜单与事务场景替换。业务规则继续离线可玩。
**Tech Stack:** Node24 LTS、Fastify5、node:sqlite、Ajv8、tsx、Vue3/Pixi8。
**Spec:** docs/superpowers/specs/2026-10-04-modern-saves-design.md

## Global Constraints

三个手动槽位；不自动保存/兼容旧档；stable awaiting-roll存活玩家（人类/AI/托管）或ended可保存；数据独立代码，loopback单用户；验证失败保留当前局与旧槽；全部GameState与RNG原样。沿用原素材，不刷新用户已有对局。

## Review Focus

- 响应丢失后同一请求重试不会多增revision或覆盖别人的新局（Task2）。
- 读取准备场景时图片失败/关闭菜单，旧局仍可继续（Task3）。
- JSON完整但引用非法、数组记录缺项、无穷/小数计数不获保存（Task1）。
- 跨浏览器共享同DB，旧标签页409之后不偷偷重试覆盖（Task4）。
- 关页/重启后端后结果与暂停和RNG恢复，声音不补播（Task4）。

### Task 1: 版本化快照与完整校验
**Files:** src/modern/features/saves/{snapshot.ts,snapshot-types.ts,snapshot.schema.json}, scripts/build-save-schema.mjs, tests/saves/snapshot.spec.ts
**Interfaces:** createSnapshot(state,selection,settings,createdAt,now):SaveSnapshot; parseSnapshot(unknown):SaveSnapshot; canSaveGame(GameState):boolean。
- [x] 写失败测试：完整初局round1/RNG/持股/地图roundtrip；缺字段/未知版本/坏日期/坏引用/小数计数/重复玩家拒绝；非stable保存拒绝；终局快照可恢复。
- [x] npm test -- tests/saves/snapshot.spec.ts → RED，再实现generator/schema与语义校验。
- [x] 同命令 → GREEN；npm run typecheck → 通过；提交。

### Task 2: SQLite事务与本地API
**Files:** server/{store.ts,app.ts,main.ts}, tests/saves/{store.spec.ts,api.spec.ts}, package.json, tsconfig.json, .gitignore, vite.config.ts
**Interfaces:** SaveStore(path).list/read/save(slot,expectedRevision,requestId,snapshot)；createSaveServer({dbPath,staticRoot?,allowedOrigins?}):FastifyInstance；/api/session、/api/saves、/api/saves/:slot。
- [x] 写失败测试：三个槽/重开数据库原样；CAS双实例一胜一409；真实SQLite触发器失败旧值保留；同请求重试revision不变、不同内容拒绝；空槽404、坏格式400、无CSRF/坏Origin/Host403。
- [x] npm test -- tests/saves/store.spec.ts tests/saves/api.spec.ts → RED，锁定依赖并实现SQLite/Fastify。
- [x] 同命令 → GREEN；typecheck；启动实际Node24服务curl核对；提交。

### Task 3: 手动存读档菜单和无损替换
**Files:** src/modern/features/saves/{client.ts,SavePanel.vue,restore.ts}, src/modern/ModernApp.vue, tests/saves/{client.spec.ts,panel.spec.ts,restore.spec.ts}
**Interfaces:** SaveClient.list/read/save；SavePanel(props canSave,busy,slots,error; emits save/load/refresh/close)；prepare-before-commit恢复流程。
- [x] 写失败测试：网络失败无成功；409不自动重试；未知数据不替换；读图失败保留旧局；操作中双击只提交一次；稳定暂停捕获；菜单关闭解除输入锁且恢复原暂停。
- [x] npm test -- tests/saves/client.spec.ts tests/saves/panel.spec.ts tests/saves/restore.spec.ts → RED，实现后GREEN。
- [x] 类型/生产构建，单元回归；提交。

### Task 4: 实际持久化和故障交付
**Files:** tests/fixtures/modern-saves.html, docs/modernization/{acceptance-4.md,resume-4.md,review-4.md}, README.md
- [x] 实际生产UI选人/保存三槽、掷骰/加载、刷新/关页/后端重启读回；跨浏览器同槽；旧标签页冲突；SQLite写失败/断网/读资源失败保留局；自然状态全部字段与下一骰RNG对照。
- [x] npm test、typecheck、build:modern及schema重新生成一致 → 通过。
- [x] 独立fresh reviewer整体审查；重要发现一次TDD修复和全量回归。
- [x] 验收与续跑记录、入口/持久化路径/回退点、干净提交；不代用户验收，不进入5/6。
