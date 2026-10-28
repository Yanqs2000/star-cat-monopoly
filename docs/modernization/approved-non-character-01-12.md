# 已验收非人物素材01—12：主分支整合

用户于2026-10-28确认“行，1-12通过，合并到主分支，然后分析13-17怎么做，做个计划”。地雷选择补回黑色瞳孔的r4，摆幅±6°、起伏3逻辑像素、四周4逻辑像素透明留白。此次只把已选版本置为approved；此前被拒的切图、母版尝试和基线失败证据作为历史保留。

## 运行范围

- 01—04：现金、存款、奖券和徽标；覆盖主工具栏、账户、地图信息、帮助、月结、存档、购地、终局等入口，只替换当前高清画质下的图标。
- 05—06：手牌栏有效图像区域和公司计算器；保留现有卡槽裁切及计算器热区、动态数字、键盘、滑块与交易行为。
- 07—09：法院高亮、Ready、Win，继续使用原生矢量4倍导出和原30fps闪烁节奏。
- 10—11：四方向路障和地雷；高清显示时间轴60fps、20／160帧，原周期不变。地雷世界偏移补偿透明留白，图案与r4审阅动画一致。
- 12：银币及三本杂志，60fps／60帧，保留一秒旋转。游戏逻辑仍30Hz；游乐场使用真实时钟，不受地图2倍速影响。只在实际逻辑帧或阶段变化时更新子帧原点，鼠标输入不把运动时钟清零；play与tally阶段均连续显示，暂停冻结。

原版画质、源SWF、原始资源清单、已安装的211项静态高清映射、人物与游戏业务状态保持原样。此次独立批准清单不会改写原始清单的严格验证标准。

## 文件与重建

- 制作和验收档案：`public/hd-review/ui-icons-20261028/`、`public/hd-review/non-character-05-12-20261028/`。
- 运行资源：`public/modern/hd-static/approved-01-12/`，415个不同文件、15,609,930字节。
- 批准映射、来源路径与输出哈希：`src/modern/data/approved-non-character.json`。
- 显示替换入口：`src/modern/features/assets/approved-artwork.ts`及`profiles.ts`，解析原清单后再替换高清显示。
- 重建：使用有Pillow的Python执行 `scripts/install-approved-non-character.py`。脚本读取项目内母版和已验收无损动画，不依赖临时目录或重新生图。
- 校验：有Pillow、NumPy的Python执行 `scripts/verify-approved-non-character.py`。检查输出SHA、大小、各帧alpha及可见RGB、160／60帧采样和不相邻重复约束。共400个运动帧与批准WebP逐像素匹配。

WebP的16／17ms整数时长不能再按16.666ms重新采样；地雷和旋转物按编码帧索引保留完整样本，只有路障有意的开／关状态按时长展开。03是粉色票券UI，原ticket-gain是金色币特效，两者不是同一张图，13—17计划单独处理。

运行输出落在既有`hd-static`允许目录；制作母版、审阅资料和视频不复制到生产构建。05手牌栏的原生有效区域1920×308，归一化到4倍运行画布属于显示打包，不将其称为4倍原生生图细节。

## 验证方式与边界

1. `npm test`：原有单元测试和新增映射、帧序、锚点、时长、UI画质传播回归。
2. `npm run build:modern`：含类型检查的生产构建；保留已有大分包提示。
3. `scripts/verify-approved-non-character.py`与原`verify_static_hd_assets.py`：新运行资源逐像素和哈希检查；既有81个保护文件及211项映射不变。
4. 生产预览本地4199端口下执行`modern-approved-assets.spec.ts`、`modern-company-calculator.spec.ts`、`modern-hd-replay-parity.spec.ts`中的目标用例：真实20秒接物、子帧预载、键鼠、截图级暂停冻结、结算与释放输入；两种画质认购滑块和数字键且扣款一次；同种子开局与掷骰完整GameState逐字段一致。

Browser插件不可用，采用项目Playwright配置中的本机Chrome。浏览器采用SwiftShader以验证真实页面和交互，不把它作为用户显卡的整局60fps性能保证；本轮没有自然触发法院和Win所有分支，也没有做全游戏长时性能验收。截图和浏览器日志保存在`/tmp/starcat-approved-assets-e2e/`及`/tmp/starcat-modern-e2e/`。

执行环境使用Node24.22.1，符合项目`>=24.19.0 <25`范围，与`.node-version`固定的24.19.0不同；本轮未声称在固定小版本上测试。

原有`scripts/requirements-modern-hd.txt`、`.claude/`、`.mcp.json`、`docs/modernization/resume-state.md`不纳入此次提交。13—17只有源结构证据、分析和待执行计划，没有生成新美术或提前更改其运行素材。

## 本次结果

单元测试757／757通过；生产构建及类型检查通过；415个运行文件哈希与尺寸通过，400个运动帧alpha及可见RGB逐像素一致。原静态素材校验确认81个保护文件及211项映射不变。最终浏览器结果记录在 `evidence/approved-non-character-01-12/verification.json`。
