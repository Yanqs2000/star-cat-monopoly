# 阿飞完整人物素材（已验收）

阿飞（ID9）保留原作大圆头、红色额顶发冠、紫色脸纹、闭眼微笑地图形象、两条上肢、持弓和四腿红色马身。活动头像/接物/月结睁眼，飞行佩戴黄橙护目镜及蓝色绑带。四蹄属于同一个身体，左右前后脚按对角组交替支撑。

地图四向七态、选择/加载、操作栏、小地图、月冠军/钱包/排名/结算、六种附身、四向乘云、游乐场三姿态及左右移动均接入。保持原动作时长、游戏根位移、规则、随机数及存档格式。游乐场16帧/30Hz原时长由64个120Hz连续关节采样覆盖。

躯干由同身份完整红马身表面和原有上身表面围绕同一支点组合；关节保持原短腿宽度。弓拆为独立完整道具，跟随持弓手并排在掌心之下，避免原图中被遮挡的马蹄像素随手移动。所有源像素和母版独立留存。

检查入口：http://127.0.0.1:64867/hd-review/characters-25/last-three/?role=9&review=afei-complete-r1 。人物形象和自然动作已于2026-11-02通过用户最终验收。

验证：852 项单测、78 项素材检查、10 项不依赖旧完整包的独立导出和16 项生产实机流程通过。954 次支撑脚检查最大漂移0；RAF中位16.7ms/P95为18.5ms。331 个文件重建SHA一致；左右循环跨界像素平均差0.276/0.300，均低于周期内部最大变化。三位共同使用真实API开局，session/slots均200，无浏览器错误或存档写入。此前验收资产保持原文件。

完整包为 `src/modern/data/afei-complete.json`，重建命令 `node scripts/build-next-character-artwork.mjs 9`。回归代码为 `tests/modern/afei-*`、`scripts/test_afei_artwork.py` 和 `tests/e2e/modern-afei-artwork.spec.ts`。证据位于 `/tmp/starcat-last-three-20261102/afei-*` 及 `last-three-real-api-*`。

生图使用内置 image_gen；选中母版、提示词与来源记录位于 `public/hd-review/characters-25/masters/role-09-*`。无CLI或模型切换，未推送远程。
