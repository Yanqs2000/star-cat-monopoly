# 吉吉米米、佳佳、帅戈完整素材（已验收）

本轮逐位完成ID3、4、7，均已接入高清游戏。完整素材包括地图四向七态、人物选择/加载缩略图、操作栏/小地图头像、四向乘云、游乐场三姿态与左右连续动画、六附身标识、钱包/排名/月结与最终结算。保留原版入口。此前验收的阿杰/妮妮已合并本地main=b89031a；本轮三位于2026-11-02获用户回复“三位通过”，形象与自然动作验收完成。

| 人物 | 原来源记录数 | 骨架 | 游乐场采样 | 完整包 |
|---|---:|---|---:|---|
| 吉吉米米3 | 1168 | 两身份、独立四脚接地、头巾带 | 64/方向 | `src/modern/data/jjmm-complete.json` |
| 佳佳4 | 1188 | 两主脚、六侧足、双螯、双眼柄、刚性蟹壳 | 72/方向 | `src/modern/data/jiajia-complete.json` |
| 帅戈7 | 1152 | 无腿漂浮、双臂、水平悬挂双秤盘 | 64/方向 | `src/modern/data/shuaige-complete.json` |

验收页支持四向七态、真实根位移自然移动、慢放、暂停、进度定位、原作对照及全部派生素材：

- 吉吉米米：http://127.0.0.1:64867/hd-review/characters-25/trio/?role=3&review=trio-complete-r1
- 佳佳：http://127.0.0.1:64867/hd-review/characters-25/trio/?role=4&review=trio-complete-r1
- 帅戈：http://127.0.0.1:64867/hd-review/characters-25/trio/?role=7&review=trio-complete-r1
- 实际游戏：http://127.0.0.1:4202/modern.html

动画来自同一套分件/关节的连续变换，未逐帧独立生图。地图接地步态按根位移推进，原游戏根移动速度不变；动作展示时长及活动采样时长分别使用原始角色清单。游乐场采用120Hz采样，三位均严格覆盖一整个原活动周期。

## 实际验证

843项TS单测、32项Python素材验证、7项阻断旧完整包的独立导出测试通过，生产构建成功。三位各16项生产Chrome实测通过，覆盖HD/原版、四路六格转弯、六附身、三反应、四向飞行、游乐场输入/暂停/计分/欢呼、月结与结算。三位同场3/4/7/1真实API新局成功，未写存档。

实际游乐场0/周期末PNG一致，末帧至首帧变化未超过普通帧最大变化。完整重建分别检查404、338、238个文件，SHA均一致；既有995个验收资源未改变。独立代码审查未发现技术集成阻塞项。工程验证之外，用户已独立确认三位形象与自然动作通过；最终验收记录为`public/hd-review/characters-25/trio/acceptance.json`。

## 素材与制作来源

- 生成工具：内置`image_gen.imagegen`，保留生成透明通道；未使用CLI生图或Blender。
- 原作逐帧来源：`public/hd-review/characters-25/role-03-material-sources.json`、`role-04-material-sources.json`、`role-07-material-sources.json`，含原SWF、PNG、帧、注册与SHA。
- 母版、完整分件供体、提示词集及生成出处：`public/hd-review/characters-25/masters/role-03-*`、`role-04-*`、`role-07-*`；每次生成对应`.prompt.txt`与`.provenance.json`，确定性提取件对应来源/轮廓/索引记录。
- 四向坐标与分件归属：`public/hd-review/characters-25/role-03-authoring.json`、`role-04-authoring.json`、`role-07-authoring.json`及各自`-carnival-authoring.json`。
- 游戏使用文件：`public/modern/hd-characters/characters-25/role-03/`、`role-04/`、`role-07/`，活动骨架另存各自`-carnival/`。
- 完整重建命令：`node scripts/build-next-character-artwork.mjs 3`，随后分别使用4、7；需本地64867审阅服务及项目依赖。源部件和坐标已随仓库保存，不依赖旧派生完整包。

详细失败回归、修复及验证过程见`docs/superpowers/plans/2026-11-01-jjmm-jiajia-shuaige.md`。当前全部候选在`feat/jjmm-jiajia-shuaige-artwork`，本轮制作、接入及最终用户验收已完成；本轮三位尚未合并主分支。
