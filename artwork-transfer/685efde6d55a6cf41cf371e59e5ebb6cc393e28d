# 原版分析证据与复现

本目录是分析资料，不参与游戏运行。

## 来源与工具

- 原始输入：`public/original/manifest.json` 中的13个SWF。分析脚本逐一检查原始SHA-256与长度。
- 反编译工具：JPEXS Free Flash Decompiler 26.2.1，来自[项目官方发布](https://github.com/jindrapetrik/jpexs-decompiler/releases/tag/version26.2.1)。
- 下载文件：`ffdec_26.2.1.zip`；SHA-256：`0333b56998a55bd83f4e0deb678a811fcdc45607582b4f5dd438309c8c3ad5ce`，与官方GitHub release资产digest一致。
- 本机Java：Homebrew OpenJDK 26.0.1；显式运行 `/opt/homebrew/opt/openjdk/bin/java`，因为系统 `java` 启动器未找到运行时。
- [JPEXS官方命令说明](https://github.com/jindrapetrik/jpexs-decompiler/wiki/Commandline-arguments)；使用导出和P-code功能，不导入/覆盖原文件。
- 工具与完整临时导出保存在 `.analysis-tools/`、`.analysis-cache/`，均加入Git忽略；本目录保留统计、原表、索引、关键源码与动画样本。

## 可复现命令

在项目根目录执行。下载包解压至 `.analysis-tools/ffdec-26.2.1/` 后，先验证哈希，再调用工具：

```sh
shasum -a 256 .analysis-tools/ffdec-26.2.1.zip
mkdir -p .analysis-cache/ffdec
/opt/homebrew/opt/openjdk/bin/java -Xmx2g -Djava.awt.headless=true \
  -jar .analysis-tools/ffdec-26.2.1/ffdec.jar \
  -onerror abort -timeout 60 -exportTimeout 600 \
  -export script,text .analysis-cache/ffdec public/original
python3 scripts/analyze_original.py
```

脚本从反编译文本中只解析完整JSON数组字面量，不执行ActionScript。位图/精灵/音频/根时间轴计数来自原SWF标签，脚本数量来自实际导出文件，两者用途不同。

行走与音频样本的提取命令：

```sh
/opt/homebrew/opt/openjdk/bin/java -Xmx2g -Djava.awt.headless=true \
  -jar .analysis-tools/ffdec-26.2.1/ffdec.jar -onerror abort \
  -selectid 130,308,488,664 -format sprite:png \
  -export sprite .analysis-cache/movement public/original/star1.swf
/opt/homebrew/opt/openjdk/bin/java -Xmx1g -Djava.awt.headless=true \
  -jar .analysis-tools/ffdec-26.2.1/ffdec.jar -onerror abort \
  -export sound .analysis-cache/audio public/original/play.swf
/opt/homebrew/opt/openjdk/bin/java -Xmx1g -Djava.awt.headless=true \
  -jar .analysis-tools/ffdec-26.2.1/ffdec.jar -onerror abort \
  -selectid 20 -format image:png \
  -export image .analysis-cache/map public/original/play.swf
```

本目录4个APNG按原序号1…24合成。原时间轴为30fps、24个时间帧，每个姿态连续保持3帧；Pillow合并相同的连续帧后，每个APNG实际为8个图像帧、每帧100毫秒，周期仍为800毫秒。原96张时间帧PNG保留在临时导出中。联系表只为人工检查，放大采用最近邻，不改变游戏源图。它们没有替换当前游戏素材。

P-code复核：

```sh
/opt/homebrew/opt/openjdk/bin/java -Xmx2g -Djava.awt.headless=true \
  -jar .analysis-tools/ffdec-26.2.1/ffdec.jar -onerror abort \
  -format script:pcode -export script .analysis-cache/pcode public/original/play.swf
```

## 文件索引

| 文件 | 内容 |
|---|---|
| `summary.json` | 汇总统计；住宅记录112与住宅地块56分别记录 |
| `swf-inventory.json` | 每个SWF元数据、标签计数、定义ID、导出符号、精灵帧数/标签/引用、音频信息 |
| `script-index.json` | 877个脚本文件路径、哈希、行数、命名函数入口和耦合特征计数 |
| `original-tables.json` | 保留原始索引的静态数组及其脚本位置，不擅自命名未知字段 |
| `source/` | 68个关键脚本的完整反编译文本，换行规范化但不重写内容；路径与工具导出保持对应 |
| `pcode-checks.json` | “捐款+1000”和“znmu”在P-code中的上下文；不是原播放器动态复现 |
| `movement/` | 卷毛四方向24帧APNG与联系表 |
| `movement-checks.json` | 样本尺寸、格式和帧数 |
| `validation.json` | 本次数据/资源/文档检查的实际结果 |

`script-index.json` 哈希对应临时目录的工具原始导出；`source/`文件规范化了CRLF，不应把二者的不同字节哈希误当成代码逻辑改写。原始SWF哈希另行独立验证。

本次分析不证明所有数组索引的含义、所有代码分支的可达性或Ruffle与原Flash的完全等价。遇到可疑反编译结果，要结合P-code和实际运行解释，不能直接照抄或“纠错”。
