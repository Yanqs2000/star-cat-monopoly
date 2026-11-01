# 怪卡完整人物素材 · 已验收

状态：全入口已接入，工程与生产场景验证通过，用户已确认形象和自然动作通过。薇薇也已验收；整轮最终证据与审查修复见 `guaika-weiwei-delivery.md`。用户已授权推送并合并，执行状态以Git记录为准。

## 覆盖与来源

原1184张调用素材：96行走、1040反应、6附身标记、41活动、1月结。逐图路径、SHA、原注册和时钟见 `public/hd-review/characters-25/role-11-material-sources.json`；原源文件保持。原四向七态，所有人物头像/选择/加载/钱包/排名/月结/结果，四向乘云，游乐场三姿态与左右移动，六个附身标记均有候选。

固定蓝色玻璃瓶头、单鱼、水带、黑礼服、红领结、白手套及黑鞋。复用原四向母版，内置 imagegen 补完整替换表情头、干净礼服、四向乘云、游乐场母版与被遮挡的完整鞋面。保留提示词与来源；鞋面r1有不合原形象的开口，改用闭合圆润的r2。静态徽记复用已验收的阿牛共享六图，保持各角色原注册。

共68张地图分件、55张游乐场分件；完整运行索引117张（含6共享徽记）、9静态覆盖、9活动clip。独立文件 `guaika-map-rig.json`、`guaika-carnival.json`、`guaika-complete.json`；`characters-25-materials.ts` 汇入现有管线。原阿牛JSON保持逐字节不变，单独重建不会抹掉另一个人物。

## 动画与修复

- 先复现怪卡起步跳足，明确将阿牛的世界接地控制扩展到ID11；不作用于漂浮薇薇。起停、拐角和小位移修正保留同接触支撑点。
- 遮挡鞋不使用半只原鞋硬切。补完整圆润鞋面后逐视角登记与保留RGB，不重复保留骨层里的旧鞋。
- 独立审查发现腿骨胶囊混入尖礼服和白手套；已使用role-11-clean-legs-r1完整黑裤腿供体替换地图与游乐场上下腿，保留轴长与厚度。未通过隐藏腿部规避。
- 白手套跨躯干矩形的部分是手的真实轮廓，用明确作者标记保留，避免动作中出现平切面。阿牛默认裁切行为保持。
- 玻璃表情头的低alpha边缘把上下行连在一起，原自动连通域会合并头。新增明确单元格登记，保留整头；受伤头上方曾混入189像素蓝碎片，修复后仅剩玻璃轮廓的少量冷色抗锯齿像素。
- 游乐场前视的瓶底/原领结不能烘进头部；通过保护轮廓和独立双侧黑领保留一套领结。冠军图展示完整手套，避免抬手后被大瓶头完全遮住。
- 新游乐场clip在原30Hz规则间显示120Hz采样并插值根位置；原帧数/时长、输入、碰撞、得分和RNG不变。

## 当前验证

- 最终124个Vitest文件824项、24项Python素材检查通过。新增接地、全路由及新角色游乐场插值测试先失败后通过。
- 原素材清单、怪卡分件、怪卡完整资源、阿牛原检查均通过；阿牛原10项分件检查和原来源检查通过。
- 生产构建通过；真实生产包 `tests/e2e/modern-guaika-artwork.spec.ts` 16场景通过：高清/原版与卷毛同场，四条六格转向，六附身，三反应，四飞行，游乐场键盘/暂停/计分/欢呼，月结/最终结果图片SHA。
- 本机同场怪卡109个移动采样、479次同接触支撑检查，最大世界支撑漂移0；卷毛86移动采样、27次支撑检查，最大1.43e-13px。rAF中位约16.7ms，P95约17.4ms；不是所有设备性能保证。
- 独立完整审阅页19项派生图解码成功，控制台和资源错误0。截图 `/tmp/starcat-guaika-weiwei/guaika-complete-review.png`，实际游戏截图 `/tmp/starcat-guaika-game/`，测试日志 `/tmp/starcat-guaika-weiwei/`。

入口：`http://127.0.0.1:64867/hd-review/characters-25/next/?role=11`。原试玩页未刷新或重置。用户需要在整轮交付时验收形象和动作；测试不代替视觉确认。

## 重建

Node24，Python `/opt/homebrew/bin/python3`，静态审阅服务器64867。

1. `python3 scripts/build-characters25.py --role 11`
2. `python3 scripts/build-characters25.py --role 11 --author role-11-carnival-authoring.json`
3. `node scripts/build-characters25-next-review.mjs`
4. `node scripts/render-character-materials.mjs 11`
5. `python3 scripts/build-character-materials.py --role 11`
6. 再打包审阅脚本并运行相关检查/生产构建。

`scripts/test_next_character_materials.py`现整文件通过，包含薇薇全路由、末7帧和冠军裙体回归；整轮已获用户回复“两位通过”。

## 用户最终确认

2026-11-01，用户回复“两位通过”，随后要求“推送并合并”。工程验证和用户验收均完成；合并不涉及暂停人物、原游戏规则或主工作区用户本地修改。生成索引的candidate状态仅表示生成阶段，最终验收以独立acceptance.json为准。
