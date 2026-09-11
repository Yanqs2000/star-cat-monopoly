# 透明素材接入检查

## 实测结果

内置 image_gen 对卷毛和建筑 178 各执行一次透明背景编辑，输出均为 PNG color type 2（RGB），且没有 tRNS 块，没有透明通道。背景棋盘格属于图片像素，不能用于游戏合成。未将这两张失败结果收录为正式素材，原有 23 张黑底高清素材保持不变。

- 卷毛：1099 × 1431，RGB，无 alpha。
- 建筑 178：1227 × 1281，RGB，无 alpha。

## 原版资源检查

- play.swf 含 1194 个位图定义；建筑 178 为 DefineBitsJPEG3，紧邻的形状定义 ID 为 179。
- star1.swf 含 347 个位图定义；人物代表图 ID 为 1，紧邻的形状定义 ID 为 2。
- 347 是位图定义数量，不等于行走动画帧数量。
- 单张人物替换不能代表整套动画完成。高清接入还需核对引用形状的位图填充变换，保持游戏内尺寸。
- 原版 SWF 和游戏运行代码未修改，尚未完成高清资源接入。

## 下一步

内置工具未得到真实透明图。建议对已确认的黑底高清图执行本地抠图，生成独立 RGBA PNG；先验证卷毛及建筑在浅色、深色背景上的边缘，再在原版资源副本上验证替换。图像编辑工具规则要求使用程序替代内置工具前得到用户明确授权。

## 本次完整提示词

Use case: background-removal. Edit this existing approved game asset ONLY to remove its solid black background. Deliver a genuinely TRANSPARENT RGBA PNG with alpha=0 outside the object, not a painted checkerboard and not a solid color background. Preserve all subject pixels, colors, shape, pose, facial details, lighting, framing, scale and resolution as closely as possible. Clean antialiased transparent edges without black halo. Do not redraw, redesign or add anything. Keep dark details inside the object opaque.

