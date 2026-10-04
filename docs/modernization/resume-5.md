# 第5阶段5A/5B续跑记录

用户目标持续为“按照计划，先完成第五阶段的5A和5B阶段”，目前未完成。阶段1–4状态不被更改。第5C和第6阶段仍未开始。

## 当前工作区

项目路径：/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/modern-map-foundation；分支feat/modern-map-foundation。起始回退点5bca5b8。设计/计划已提交b8dd51a。未重置用户文件或对局。

忽略缓存 .analysis-tools/ffdec-26.2.1 含JPEXS26.2.1发布ZIP、Library ZIP与full CLI；下载均依据官方GitHubrelease API记录的SHA校验。本机使用JDK /opt/homebrew/opt/openjdk/bin/java 26.0.1、JPEXS26.2.1。正式原始SWF未修改。

## 5A样本

public/modern/hd-review/5a/index.html 是原图和高清样本的两帧同步播放页；地图可点开2700×2552原尺寸；卷毛四方向、每方向24帧，30fps，可暂停、逐帧切换及选表情。

public/hd-review/juanmao-hd-v2.png 是透明RGBA候选源图。scripts/ExportModernWalkAssets.java 从离线工作SWF按JPEXS 2x倍率导出原动画；scripts/ExportReactionAssets.java现在允许通过starcat.pixelDensity属性以倍率2导出，默认仍是1。scripts/build-modern-hd-sample.py校验原SWF哈希、只补丁工作副本、输出全帧并校验数量、时间和图片边界。871张时间轴图像加1张候选角色源图。逐图哈希在docs/modernization/evidence/phase-5a/sample-manifest.json。

地图源本身已为2700×2552，满足当前1080p桌面游戏区域；样本保留原图不重采样。候选的面部/眼睛/身体比例有可见差异，在样本页中明确说明；该变更等待用户视觉验收，不称为像素级还原。

## 实际页面

本地Vite现代开发服务器exec16813，127.0.0.1:5185；真实Codex内置浏览器tab2打开样本页。真实UI方向选择、帧控制、播放/暂停、反应选择已试。原帧natural dimensions72×96；HD帧144×192；neutral69×90/138×180；地图2700×2552。原和高清资源均显示完成；样本证据见phase-5a目录。独立前端Console Logs API当前不可用，未作该项声称。

## 后续

1. 将assetProfile原始/HD选择集成到ModernApp/Pixi游戏场景，定位/锚点按逻辑尺寸绘制。以同种子和命令核对全GameState和RNG；资料、菜单与画布切换不能触发新规则。
2. 制作重复可跑的完整高清镜像生成器；12角色使用当前批准候选和原时间轴逐帧再导出，包含表情、欢呼和神灵。
3. 公司建筑、住宅出售标记/朝向/等级、全部可达NPC/世界动画、奖券/火箭/爆炸/活动特效、全部互动与地点界面按资源ID建表并填入HD图集。矢量时间轴优先2x重绘；源位图只重采样时明确源分辨率上限。
4. 对原图与HD模式做同指令/同随机状态完整验证；资源预载失败/中断保留当前场景；检查总体资源量与图形内存。
5. 生产构建真实浏览器验证六组资源，写完整acceptance-5a-5b.md并待用户验收。尚未宣布5A/5B完成。
