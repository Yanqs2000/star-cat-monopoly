# 第4阶段：手动存读档验收记录

2026-10-04。实施基线 `e73cb33`；功能交付 `c432611`。本记录代表工程检查通过、等待用户验收，不代替用户确认，也不修改3A–3D验收状态。

## 实际入口与范围

正式页面：http://127.0.0.1:4186/modern.html 。生产预览 http://127.0.0.1:4184/modern.html 使用同一后端。启动方法见 README。Node24.19.0实际运行，SQLite3.53.3，Fastify5.12.5；采用原生SQLite事务，不需要安装数据库服务。

选人页“读取存档”，对局“手动存读档”。三个槽位、真实保存时间/轮次/日期/角色/修订号。只有明确点击保存才写入；覆盖与替换对局均需确认。支持稳定等待掷骰的存活人类、AI、托管，以及已结束结果；中途交互、移动、小游戏不保存。全体托管可先暂停再打开菜单。

快照保存全部28个GameState字段、RNG、原始选人顺序、创建时间、暂停与速度。恢复不重抽随机、不再次清算或结息，不补播过去音效。音量/静音保持当前本机偏好；镜头、显示历史和播放位置属于界面，不保存。

默认持久化文件 `.data/saves.sqlite`，不纳入Git、不放在dist-modern里。正式数据库在收尾检查时仍为0条，三个槽均修订0；全部破坏性/故障验收使用独立 `.analysis-cache/4-browser/saves.sqlite`。测试数据库不作为用户存档。

## 自动检查

| 检查 | 结果与证据 |
|---|---|
| 全量单元回归 | 78文件、616项通过；包含3A/3B/3C/3D已有回归，[日志](evidence/phase-4/unit-results.txt) |
| TypeScript/Vue | 通过，[日志](evidence/phase-4/typecheck-results.txt)；最终构建再次执行vue-tsc |
| 权威TS生成schema一致性 | `npm run check:saves`通过，[日志](evidence/phase-4/schema-results.txt) |
| 最终现代生产构建 | 通过，[日志](evidence/phase-4/build-results.txt)；762.30kB主包尺寸警告保留，未冒充优化完成 |
| 快照/事务/API/恢复 | 版本、字段、引用、整数、日期、淘汰资产、稳定阶段校验；SQLite实际回滚/双实例CAS/幂等；Host/Origin/CSRF；候选资源失败、关闭取消及重复命令覆盖 |
| 月结保存 | 真实settleMonth产出的1–12月键逐月通过，读回后再调用同月结算无变化；一月真实HTTP PUT200，[证据](evidence/phase-4/monthly-api-evidence.json) |

新增检查先RED再GREEN，包括原生fetch接收者绑定、托管保存、月结键和手牌图片预备。完整suite在复审修复后执行；之后只改文档与交付记录，没有再次反复运行无变化的全量测试。

## 实际生产浏览器回放

Chrome与Codex内置浏览器，编译后的真实ModernApp；操作通过UI，未向Vue/controller注入状态。独立验收页只固定初始日期2026-10-04和随机种子102，选卷毛、AI补大牌/大尾/阿飞，出生与后续操作由真实规则决定。

| 场景 | 实际观察 |
|---|---|
| 三槽/自然读回 | 首槽第1轮保存；骰子4、地产选择；读取再保存，28个核心字段/选人/速度/暂停完全一致，下一次骰子仍4，[逐字段证据](evidence/phase-4/roundtrip-evidence.json) |
| 跨浏览器 | Chrome存档由内置浏览器读取再保存，核心全等；共享相同服务器数据库，[证据](evidence/phase-4/cross-browser-evidence.json) |
| 多页覆盖 | 旧页expectedRevision1对已更新revision2得到409；无偷偷重试/覆盖，刷新显示新修订 |
| 刷新/关页/重启 | 保存暂停的第2轮；刷新、关闭整个自建Chrome页再打开读回仍暂停；重启实际Node后端后存档保持，会话重新建立 |
| SQL失败 | 独立SQLite BEFORE UPDATE触发器真实中断；UI500，不显示成功，原payload字节及revision2保持；移除故障后同请求手动重试成功，[证据](evidence/phase-4/sql-failure-evidence.json) |
| 提交后响应丢失 | 后端事务提交后销毁连接；数据库revision4，客户端不报成功；去除故障后手动重试同requestId确认4，再主动保存才变5，[证据](evidence/phase-4/lost-response-evidence.json) |
| 坏版本 | 独立槽临时formatVersion99，真实API422；原局与暂停保持；测试原数据恢复 |
| 资源失败/取消 | company manifest一次503、候选准备期间关闭（15秒受控延迟）、手牌1.png一次503，均保留旧局；关闭菜单后旧100000现金/控制器可继续掷骰4到银行 |
| 托管 | 自然回合全体托管、暂停于AI等待；保存/刷新/读取/再保存，全部四人autoplay、active1、RNG1775445006、暂停及核心全等，[证据](evidence/phase-4/autoplay-roundtrip-evidence.json) |
| 终局 | 明确标注夹具：createGame后令三位AI现金/存款0，经真实settleBankruptcy和getOutcome产生victory；UI读取“卷毛胜出”、原结果PNG已解码、掷骰禁用；再保存全状态相同、清算记录仍3，[证据](evidence/phase-4/terminal-roundtrip-evidence.json) |
| 正式入口 | 最终dist现代预览4184选人开局成功、控制台warn/error为空，正式三个槽修订0；实际停掉4186后菜单提示服务不可用，关闭后掷骰1进入逐格移动，服务现已恢复 |

终局与一月结算是受控夹具，不声称本阶段又自然运行到该终局/跨一月。浏览器DOM与截图在工具回放中验证；持久化JSON对照与构建/测试日志已入库，未声称生成独立PNG截图文件。故障期间预期HTTP错误不算正常入口控制台健康证据。

## 复审、边界与交付

fresh reviewer整体审查发现2个Important，无Critical；一次TDD修复、全量616项及原故障浏览器重放完成，见 [review-4.md](review-4.md)。未再次请同一reviewer重复审查。

本机单用户服务仅绑定loopback；验证Host/Origin、SameSite HttpOnly会话与CSRF。暂不提供公网认证/HTTPS、多用户、自动存档、旧SharedObject导入、移动适配、高清化或部署。现有3D表现差异继续保留，不在本阶段改规则。

参考： [Node发行线](https://nodejs.org/en/about/previous-releases)、[Node24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)、[Fastify LTS](https://fastify.dev/docs/latest/Reference/LTS/)、[Ajv](https://ajv.js.org/guide/getting-started.html)、[TS schema generator](https://github.com/vega/ts-json-schema-generator)。

回退点：`e73cb33`（第4阶段前），`d33b25c`（快照/API），`dfd159e`（完整UI），`c432611`（复审修复）。代码回退不删除数据库；旧代码如无存档入口应停止存档服务，不对旧规则强行读取新版文件。未push/merge，未开始5/6。服务和续跑信息见 [resume-4.md](resume-4.md)。
