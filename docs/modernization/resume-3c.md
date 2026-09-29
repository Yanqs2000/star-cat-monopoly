# 3C续跑入口

status: active
objective: 完成用户授权的全部3C，内部逐模块检查后统一交付，不以NPC子模块代替整批完成。
workspace: /Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/modern-map-foundation
branch: feat/modern-map-foundation
base: 6c2238c

## 恢复时

先用/opt/homebrew/bin/git status --short与log -4核对，读本页最近进度和任务brief。不要重扫3A/3B或重导未变化素材。进程仍活跃时先poll，不因观察超时重启。生产回放占用dist时不得重建它，Vite会清目录导致假404。

## 当前提交与完成范围

2026-09-28：功能HEAD c19bd15，NPC规则eab5fa7，源证据/计划bdf362c；旧检查点3a14668。Task1静态规则/素材入口已完成，小游戏不确定动态项在Task4/5进入数值实现前探针验证。Task2内部检查完成：普通NPC1/9/12/13/14/15、券现金双向兑换、招领、原图UI、完整NPC/双卡/烟雾与车辆、逐项收据、暂停/可序列化帧位/资源重试及自然入口已接入。

本页未提交内容只是续跑/验收计数更新。Task3…6尚未实施：下一项魔法门、法院和出入院呈现；然后真实投注、20秒接物、联合日期/月结回归、最后一次fresh全批独立复审。不能称3C完成，不自动更新3A/3B用户验收。

## 最近验证

整体47文件403项GREEN后新增烟雾尾段1项，受影响12项GREEN；类型及生产构建通过。task-done收尾整体47文件404项通过（日志已核对）。

生产9条流程累计通过：2026-09-28完整开局、角色1人类、原AI补位、速度2。seed20帐篷、24彩票公司：暂停/20券交易/重复提交，原图824宽；seed6流氓、11恶犬、33警察、61小偷、80乞丐、0招领：原动画/暂停/实际收据；seed11车辆80.png受控404重试保留住院3天和速度2。NPC13尺寸修复后又定向确认462宽。截图/记录.analysis-cache/acceptance-3c；详情acceptance-3c.md。

曾出现的乞丐回放404属于我们同时重建dist清目录，源/目标文件存在且HTTP200，冻结dist后的原种子重跑通过。原图压缩468的CSS问题按生产RED回归修复，824/462尺寸与新截图GREEN。Browser plugin not available，按frontend-testing-debugging用既有Playwright，不操作用户当前页面。

## 活跃进程

生产4184旧preview session56005仍HTTP200，未重启。最近浏览器session48446、98943、39676均结束，原图导出也结束。整体task-done session86301已结束，404项通过；当前没有活跃测试/导出。

## Task3的已读证据

根frame4 end_pg17及station2542 frame1/2/3/5完整读过。四站到达(31,7)/(32,28)/(9,35)/(8,14)，方向[2,4]/[1,3]/[2,4]/[1,3]，当前站或5取消不抽出站方向；AI random5+1，完成飞行后根random2选方向。飞行源step15，先scale60→100，近目的地600px转缩小41次，镜头随flight，fly982根1帧/子981为121角色象限选图（不是动画），矩阵(-195,-267)。只读Inspector在.analysis-cache/3c-assets/InspectFlight.java/Inspect3CNext.java。

法院courtz2683 frame1..6已完整读：目标排除自己及state2/3/9；AI选择目标、案件各60逻辑帧展示；三案原静态文字由TextTag核对：行为不检(2天)、欺善怕恶(3天)、藐视电脑(5天)。random101，小于60/50/40胜，至80/75/70和，以上败；胜送被告/败送原告，id<=activepid加1天。判决等40帧，car1第56帧移到jail、第113帧隐藏/设置刑期，再等40帧；胜诉恢复原告镜头。show2 1472源45帧，car1 884源113帧。复用现有applyRestriction和worldRules.jail，不能补费用/保释。

下一步：task-start计划3，读Task3 brief，写portal/court规则RED，然后原飞行/法院与转运阶段。资产导出扩展须复用已有542帧，不重导全部。

## 工具与约束

/opt/homebrew/bin/git；Python /Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3；Java /opt/homebrew/opt/openjdk/bin/java；JPEXS父仓库.analysis-tools/ffdec-26.2.1/ffdec.jar。源SWF SHA790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba。Skill ledger.superpowers/sdd/2026-09-28-modern-3c-activities/progress.md；本会话内实施，模块不派实现者，全批末尾按executing-plans做一个fresh独立审查。

用户本轮PLEASE IMPLEMENT覆盖引用计划末尾仅规划旧措辞；不推送/合并/部署，不接纳Xcode许可。3D/存档/高清化/部署仍为后续。

## Task3进行中补记（2026-09-28）

基线0c090bd（Task2功能c19bd15+检查点），没有Task3提交。WIP portal/court纯规则和控制器已接入；新素材245帧与旧542合并（78clips/787frames），未重导旧组。portal/court规则12项、控制器4项、原图1项、原入口Vue2项、角色显示3项分别已通过（最新类型/定向工具句柄33937/10936待核对返回）；完整3C仍未完成。

原probe scripts/probe-original-activities.mjs/portal-flight-runtime.json执行原station2542.frame3，东到南前41步的twips截断坐标/缩放/计数逐项匹配，42步原版直接定位终点，43条观察含移除。原source未改；scratch仅改root1且root4 bytecode核对不变。原版4173 dev session51064为新开启的probe服务（当前有用，保留）。Task3素材导出91953/32070/54857全部结束。

已修正sourceDog时序证据：car2父处理忽略show_id2（55），48逻辑帧隐藏原演员、111完成后定位/镜头到医院。旧Task2提前55切医院有误，activityCameraTarget/poses已TDD修复；现代ModernApp已移除55的旧摄像跳转。法院原角色在56移到jail、113隐藏；判决parent40计数与show2快进分别保存verdictFrame，恢复不重判；AI目标/案件各60逻辑帧取原抽签，已验证。

UI组件已添加原station/court-target/court-case/court-verdict、头像/光点/判决层；NativeActivity正扩展为整组预加载再ready。控制器和界面事件已声明，但尚无Task3生产构建/浏览器验证，未完成内部检查。必须继续Task3，不可标完成。

下一步：补完原魔法门地图。源frame4 showmap_pg(2719…)另有头像random50初始化、0阶段每帧random40、2阶段每帧random10及alpha0..100闪烁，影响同一根RNG，当前未建模；需要受控probe确定onEnterFrame遍历顺序，再把头像阶段/alpha/计数和选择时钟放GameInteraction，校对图和随机。头像head1…12/原map25%待Inspector当前句柄确认；不应使用court face图片替代地图head。然后实际portal选择/flight/car1镜头、无目标/判决与医院/拘留到期回归；修复相关e2e旧自然种子只以当前实际入口为准，旧Task2路线证据属于c19bd15。

尚待Task3：NPC新标记应在源动画完成后可见（权威规则已原子提交，视觉只投影），统一死亡/送医/拘留与出入场效果；资源重试和2倍速生产回放；模块结束整体/类型/构建，记录提交。Task4/5原小游戏动态探针与真玩法、Task6独立复审/全批验收均未开始。目标active，不要把局部通过当最终完成。

Task3最近补证/验证：完整53文件430项通过，类型通过（session57585/35429已结束）。新portal-heads2规则、portal/court-controller6（头像资源等待/暂停/关窗尾帧）、activity-poses3均GREEN。原探针68457/51401结束：头回调每帧4,3,2,1；较早创建但晚注册的older回调0在其后，已保留原关窗前头像最后一轮随机。头状态用同一rngState；AI不进地图。原map-mini/head1…12/magic-talk14帧已追加，总92clips/801帧。NativeActivity整组预加载/root样式已修；Portal/Court UI和ModernApp选择/ready/转运接通。

当前WIP全部仍未提交；Task3不能task-done。最新新生产build及scout-portals句柄见当前工具（不要并发重建和生产回放）。接下来正式portal/court浏览器回放、资源失败、退出释放与NPC视觉标记续办；3A/3B回归复用430项当前整体结果。地图房屋/NPC小图动态投影尚未补，不能把只有地图/头像的图称完整原版地图表现。另记录活动资源失败若发生在全局暂停期间，现ModernApp重试会把paused重置false，Task5/6必须按TDD补全冻结/恢复偏好，不能遗漏。

Task3生产回放session63063已结束：3/3通过（seed4首轮原地图/10图层/头像/飞行暂停/东站31,7；fly-1-4原图404后恢复相同目的地/速度2；seed24第9轮法院选合法目标/案件和判决）。截图已实际查看。此后新增世界视觉投影，隐藏已提交的新NPC至原遭遇动画完成、帐篷旧图15帧隐藏；演员/镜头按sourceDog48/111、courtz56/113。最新release原setfree.brow7改ready（旧neutral预期已按原源码修正，god-expired仍neutral）；AI帐篷补npc-opening原烟雾/18逻辑帧空分支、唯一重新放置与同格续办，TDD控制器新增1 GREEN。定向26项通过，当前类型12685已返回待记录，预计全套434。没有正在运行的浏览器回放；当前dist仍是以上视觉小修前版本，下一次构建之后再做定向转运/释放复测。

剩余Task3：原小地图房屋/NPC状态图层（SourceNPC_s与普通源素材比对），法院car1失败/合法目标改变/释放真实浏览器；Human放弃/当前站UI、AI视觉空分支生产检查；提交收尾。勿因3条通过就跳过这些原要求。Task4/5真实小游戏尚未开始。

## Task3最终检查点

2026-09-28：Task3功能准备提交，53文件436项GREEN，生产5/5通过（session69160结束），类型及构建成功。小地图106clips/815帧总manifest含完整房屋/公司/14种NPC障碍小图，真实页面82图层；源几何已验证。法院胜诉case/car1失败恢复与2天释放通过。NPC隐藏迁移、dog48/111、release.ready、AI tent18帧空业务均修正并测试。Task3完成内部检查，待task-done ledger。

仍活跃：4184 preview56005；原4173 dev51064。无活跃浏览器或导出，dist可重建。下一项Task4：读取ludoz2163全帧与骰1594，低券/未下注及骰序受控探针后，原36区域筹码真实投注UI/骰/结算；随后Task5真20秒接物/输入/恢复、Task6联合/独立复审。Task5/6必须TDD修复ModernApp资源重试期间paused被重置false的问题。不得以Task3部分通过作整批完成。

## Task4检查点

真实投注已完成：ludo.ts、控制器唯一入场/开奖/入账、LudoActivity原36区和95新帧；source低券及未下注探针证实，9次骰随机；新10项及整体57文件446项通过。自然seed0第3轮6,24下注/暂停/日期生产1通过；确认后ludo-game/1.png失败恢复1通过，均2倍速。截图已看。最新构建27199须poll；全测62152、浏览器44203/20445均结束。Task4准备commit/task-done；Task5还未实施，原碰撞probe得到boy1.frame1 bbox355..445/400.35..500.35，bb1.frame1 ±18.5/±19，边界delta63.5相交、63.55不交。旧probe起点先于symbol准备约3秒，已修起点至实际carnie入口并需重跑，不能用旧时间样本作timer次序依据。scripts/original-carnival-probe.as已存，可复现。

下一项Task5：source真正20秒接物，30Hz固定逻辑、落物计时/碰撞/键鼠/AI、原12 boy及4 bb素材；源frame3结束输入但现有落物仍继续碰撞，frame4每4逻辑帧优先4/3/2/1结分，等15次再入账，必须保留。然后Task6统一复审/交付，勿提前完成goal。

## Task5进行中：完整规则/界面和首次真实回放

HEAD6b35bd6；Task4 ledger完成。Task5未提交WIP：carnival.ts/geometry/158+90新原图/Pixi CarnivalStage/键鼠独占/控制器23秒（3倒数+20操作）、原计分收尾。Controlled carnival-runtime.json含12角色×3姿态和4落物×30帧的156包围盒；真实碰撞delta63.5命中/63.55不命中。完整原回放观察29次生成（13/9/6/1）、3秒倍数奇次bb3先bb1、6秒倍数1/2/3、10秒特殊4先2、20秒不再type2，模型逐项匹配。原2154第90帧额外random1000已保留。纯规则6、控制器3、键鼠2、原图1及暂停恢复新增1均GREEN；整体61文件459通过（59126结束）。显示30/60/120分区与延迟补步/暂停计时证明一致。

ModernApp已修暂停重试pref，restoreAfterVisual(paused)保留；暂停视觉重放在原资源准备好后等手动继续再播，controllerReady避免提前启动交互。生产投注暂停后原图404重试仍暂停/速度2通过（8188结束57s）。

首次自然seed21第9轮1,29游乐场：键鼠/暂停/足20秒/发券/退出后方向键掷骰全部走通，但末尾pageerror "Cannot read properties of null (reading clear)"，故整条不计GREEN。卸载时app仍可被排队draw访问；已将loaded=false/app=undefined置于destroy前，待原回放定向复测。第二条因测试target textContent等待无alert阻塞已中断（runner23504 SIGINT），改allTextContents；两者都应重跑。另一Playwright并发共用/tmp输出清掉首个失败artifact，后续每个命令独立--output，不再同时共享产物。

当前新build句柄见当前工具（需poll）；没有活跃浏览器，4184 preview56005/4173原版51064继续服务。下步：新build后modern-carnival两条独立output回放、看截图；459定向变更+类型确认；提交Task5/Task6联合日期月结、普通NPC自然全入口新规则复测、一次fresh最终全批审查、完善acceptance/rollback。3C尚未完成，goal仍active。

Task5异常根因更正：queued draw假设的guard并未解决原失败，44097复测首条仍RED/第二条404GREEN。真实stack定位Pixi Batcher.break.textureBatch.clear；本地8.20.1 AbstractRenderer.destroy(true)触发GlobalResourceRegistry.release，小游戏app.destroy(true)清了主地图共享batchPool。改为app.destroy({removeView:true},{children:true})，仅释放当前renderer，abort候选同样对象参数。sourceAPI证据与MapScene已有对象销毁方式一致。首条回放保留stack断言；404新增pageerror断言，下一次均定向复测。god-property夹具从旧帐篷占位改成真实乞丐，RED兑换→GREEN乞丐→神灵→地产/到期/释放。Task6新增彩票跨月/接物信用神灵月结组合检查（月结确认后有520ms收尾，按已有规则修正测试等待）。

## 2026-09-29最新检查点

HEAD仍6b35bd6，Task5/6 WIP未提交。62文件467项、类型和生产构建通过。更新种子的9条NPC/兑换/招领/住院释放/车辆重试通过；魔法门4条和法院seed150第5轮胜诉/2天释放通过；普通法院已改为seed150，旧seed24在新小游戏随机时序下不再按旧路线可达。正常法院1条、投注3条、接物正常操作/退出1条及入场与发券后happy反馈两处404恢复1条通过。神灵/地产/释放、银行/商店恢复、B01回归通过。明确标注的接物中段与投注已入账保存恢复夹具2条通过：真实原图404冻结，重试资金、随机和阶段保持。

接物步行还在收尾：原boy子动画角色1/2/3/5/7/8/9/11/12为16帧、4为18、6为12、10为14。原carnival-walk运行证实逐帧前进、左右转换保持子帧、停止回站立。376个动态碰撞边界和85条帧样本、376张左右原图已补；boyFrame序列化、规则与Pixi呈现已接入，定向15项和类型通过。当前完整测试/新构建句柄69646待poll，不能重启它；dist新建后再定向接物回放，不能以旧首帧版本的截图称已验证动画。

服务：4184 preview56005，原4173 dev51064，现代5184夹具dev6068。其余浏览器均结束，无回放占用dist。下一步：步行构建与回放，提交Task5并task-done（base6b35bd6）；完成Task6联合验证、一次fresh全分支独立复审、重要问题RED修复与定向复测、重写acceptance-3c及最终resume、提交/回退6c2238c/干净状态核对，整批给用户验收。3D等后续不启动，goal保持active。

Task5最终步行版：完整469项/构建与2条自然接物回放通过（30845结束），保存恢复夹具2通过（79187结束）。当前无活动测试或导出。167clips/1535帧来源锁定。准备功能提交/task-done5，随后Task6全批独立审查与最终文档，不以模块完成代替goal完成。
