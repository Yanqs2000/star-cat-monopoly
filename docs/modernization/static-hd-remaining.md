# 静态高清素材剩余清单

核对日期：2026-10-18。来源：`static-hd-production.json` 与 `src/modern/data/static-hd-assets.json`，并校验工作目录实际文件。统计范围为本次静态场景、房屋、卡牌、事件插画及静态界面重绘任务；人物动画、单独立绘、神灵贴图与 Blender 工作继续排除。

## 已接入的素材

本次已有 120 项生成素材接入高清模式，覆盖 189 个运行资源路径。包括公司建筑 1、16 种卡牌、37 幅事件插画、44 项业主房屋、2 个独立朝向出售牌、10 项中立房屋和 10 项静态活动素材。路径数包含相同图像的复用别名，不等于独立生成次数。公司建筑 2—12 与既有地图样本继续沿用已有高清成果。

四种业主颜色的 1—5 级房屋已逐等级、逐独立朝向比较；房屋显示使用原图可见边界配准，维持地块占位与落地点。法院罪名和奖券兑换面板使用消除内部透明缺口后的重做版本。生成后未采用的候选只作为追溯文件保留，不会映射到运行时。

## 尚未生成：21 项文件任务

| 分类 | 数量 | 原资源 |
| --- | ---: | --- |
| 完整小地图背景 | 1 | `assets/activities/map-mini/1.png` |
| 骰子游戏面板 | 3 | `assets/activities/ludo-betting/1.png`、`assets/activities/ludo-game/1.png`、`assets/activities/ludo-ai-betting/1.png` |
| 游乐场游玩与计分背景 | 2 | `assets/activities/carnival-play/1.png`、`assets/activities/carnival-score/1.png` |
| 结算界面 | 3 | `assets/activities/bankrupt/1.png`、`assets/activities/gamewin/1.png`、`assets/activities/gameover/1.png` |
| 静态骰面 1—6 | 6 | `assets/activities/ludo-face-{1..6}/1.png` |
| 带投影的骰子 1—6 | 6 | `assets/activities/ludo-shadow-{1..6}/1.png` |

游乐场的两个原文件哈希相同，后续可生成一份合格母版复用两个路径。因此 21 项文件任务对应 20 种不同原图；当前生产清单仍保留两个文件任务分别登记，不把这种复用计为额外生成。

## 已生成候选，但仍需返工

- 公司通用对话框：`assets/companies/dialog.png`。已有两次候选，内容区出现意外半透明，未启用，仍使用原有素材。
- 主地图扩展：`assets/map.png`。已有 M01/M02 候选，但道路、路缘及相邻图块接缝发生漂移，未启用。当前只保留已验收区域 `[640,420,512,512]` 的四块高清图；其余地图尚未完成可用的高清替换。完整地图另列，不包含在上方 21 项中。

## 主分支集成与验证

本批合并使用本地 `main`，主分支工作目录复用 `.worktrees/non-character-assets`。根目录 `analysis/modernization-baseline` 上的用户配置修改及人物建模 worktree 保持不动。进入本工作目录后运行 `npm run dev:modern`，游戏内选择“高清素材”即可使用；原版画质仍使用原图。

验证：643 项单元测试、4 项 Python 静态素材回归、静态素材校验、既有高清资源及地图校验、`build:modern:hd` 构建通过。合并后在 `main` 完成 7 项浏览器测试：5 项实际组件测试覆盖手牌、事件、四种颜色房屋、小地图、静态活动以及法院和兑换交互；2 项完整游戏入口测试验证原版/高清同种子状态一致、新静态素材实际请求、暂停切换画质及失败恢复。开发服务与生产预览提供的法院、奖券和房屋 WebP 字节与主分支登记指纹一致。工程校验与交互通过不代替最终美术验收。

所有既有受保护的 81 个高清素材文件指纹不变。没有导入新的角色动画或 Blender 文件，没有推送远端或发布站点。
