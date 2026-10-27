# 3B 金融与公司验收记录

状态：**3B 实现、最终门禁和独立复审已完成，等待用户验收**。本文件描述 3B，不代表 3C NPC、3D 完整一局、存档、高清化或部署已完成。3A 用户验收状态沿用 `acceptance-3a.md`；此前“验收通过”所指阶段正在向用户核实，不由本文件推定。

## 交付入口与回退

- 本地桌面网页生产入口：`dist-modern/modern.html`（由 `npm run build:modern` 生成），开发入口 `modern.html`；对局无需 SWF/Ruffle 规则引擎。原版素材及原版运行入口保留。
- 3A 基线/回退提交：`629db6e`；2C 基线：`204ded9`。3B 功能和测试核验提交：`545b964`（包含前序 `17204fb` 等 3B 提交）；验收记录单独提交，不改变运行代码。未推送、合并或部署。
- 原版 `play.swf` SHA-256：`790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba`。金融证据见 `phase-3b-bank-evidence.md`、`phase-3b-stock-evidence.md`、`phase-3b-calendar-company-evidence.md`；受控负随机探针见 `evidence/stock-negative-random-runtime.json`。

## 能力与证据

| 范围 | 已实现的可观察行为 | 证据 |
|---|---|---|
| 金融初态/日期 | 一次注入年月日星期；16 行股票表区分占位 0、交易所 1…12、公共事业 13…15；角色公司按角色 ID 与出生区建立，3000 初始股及 2000 待认购股。原版固定月份长度，整轮最后一人才推进。 | `finance-setup.spec.ts`、`calendar.spec.ts`；跨月生产回放。 |
| 银行 | 人类周日休息；存款、取款、贷款、还贷、申请/还信用卡；AI 按席位等级先借款/发卡再重分配现金和存款；操作只接受整数并按原版上限。 | `bank-operations.spec.ts`、`finance-controller.spec.ts`；生产 seed8 的存取、借还、授信及反馈素材 404 恢复。 |
| 月结 | 日期为 1 的最后玩家回合先按公司分配→信用卡月还→贷款月还→存款利息结算，用户确认后才换日；按年月键防重复；原版排名台词抽取一次 `random(15)`。 | `bank-settlement.spec.ts`、`finance-controller.spec.ts`；四真人跨月生产回放。 |
| 股票 | 1…12 在周一至周六可买卖；现金交易、持股/均价/日限额/池值分开；跨月→跨周→每日价格更新使用单一 RNG 和原版取整；AI 路过不做交易。 | `stock-prices.spec.ts`、`stock-trading.spec.ts`、`finance-controller.spec.ts`；生产 seed5 买卖与续走。 |
| 公司/董事权 | 12 张原 `gufen` 透明建筑按源像素原点、边界偏移和角色出生区渲染；公司格认购只扣现金，严格领先才换董事；对方落地费用进公司利润而非董事现金；普通公司按两枚最终骰子之和（2…12）收费，公共事业按已建房数收费。 | `company.spec.ts`、`company-assets.spec.ts`、`finance-controller.spec.ts`；生产 seed16 公共事业认购/董事权及全图建筑截图。 |
| 恢复/边界 | 银行/股市途中交互结束后接着处理当前格与余步；公司落地、月结及已提交交易在恢复/重复点击下不二次结算；暂停拒绝人类命令。 | `finance-controller.spec.ts`、`interaction-controller.spec.ts`、`finance-ui.spec.ts`；生产授信反馈素材 404 后重试。 |

## 原版差异与未验证边界

- 原版二月固定 28 天，即便闰年也如此；3B 保留该行为，不按系统日历自动校正。`frame_5` 的 `znmu` 反编译疑点仍按已有 2B 运行证据处理，未凭静态拼写改写玩家轮转。
- 原版 `random(负数)` 的 Ruffle/AVM1 原语探针均返回 0；现代 RNG 为确定性生成器，按源码每次调用消费一个状态，不能声称与原版内部随机流逐位相同。股票日限额可大于池值，池值可随交易变负；没有擅自夹取或添加手续费。
- 原版正利润但总持股数为 0 的 ActionScript 数值传播尚无动态证据；现代版清空该笔利润、不派息，并在月结流水标记未分配来源金额。交易所零股确认可能导致原版均价除零，现代 UI 和规则拒绝零股成交；银行金额 0 仍可提交且无资金变化。
- 原版公司费用 `yntz2` 精灵 50 帧动画尚未逐帧搬入现代 UI；现代版保留第 1/10/17 帧的六次抽签与最终两骰收费数值，并显示点数。原版银行月结逐帧点击节奏也以可确认分项面板呈现，数值与一次性提交顺序保留。
- 3D 才实现破产淘汰、完整排名/胜负和完整日历边界；3B 沿用当前资金耗尽停局方式。因此不能把 3B 称为完整玩法或整局通关验证。

## 验证与复审

- 最新整套 `npm test`：39 文件、**375 项通过**（2026-09-27）；定向 RED→GREEN 覆盖原版价格/分配样例、公司六次随机、信用整数额、无持股正利润流水、重复月结等。
- `npm run build:modern`：类型检查通过、Vite 构建 771 模块（2026-09-27）；当前构建有 500 kB 单块大小提示，非失败。
- 生产预览 `http://127.0.0.1:4184/modern.html`：`modern-finance.spec.ts` 银行 seed8、股票 seed5、公司 seed16、四真人跨月及授信反馈素材404 均通过；另连同旧卡牌、地产、场景和回合共 **24/24 通过**。截图：[银行](../../.analysis-cache/acceptance-3b/seed8-bank-1440x1000.png)、[股票](../../.analysis-cache/acceptance-3b/seed5-stock-1440x1000.png)、[公司](../../.analysis-cache/acceptance-3b/seed16-company-1440x1000.png)、[跨月](../../.analysis-cache/acceptance-3b/month-boundary-1440x1000.png)、[全图公司建筑](../../.analysis-cache/acceptance-3b/start-companies-1440x1000.png)。
- 独立复审指出旧 3A 生产回放因金融 RNG 变更而缩短。按新自然路线补回 seed2 连续两次买地、seed8 授信后用信用卡实际取现 5000、在已载入对局中全屏；运气 8 图片 404 恢复仍由 seed2 自然回放验证。复审后受影响的三条生产用例定向 **3/3 通过**。飞弹选中中心的两种特效在规则/坐标测试中均锁定为 `(560,400)`；生产浏览器验证画面变化和目标住院，不把生产包中不可独立导入的 Pixi 模块当成位置探针。
- 测试专用真实组件夹具 `tests/e2e/modern-fixtures.spec.ts` 在 Vite 开发环境 6/6 通过，非生产入口，不充当自然浏览器证明。
- 独立复审未发现剩余的 3B 数值规则、RNG 顺序或序列化续办缺陷，无 Critical 项；其唯一 Important 覆盖缺口已按上述拆分补测。复审未独立重跑门禁。用户对 3B 的最终验收仍待反馈。
