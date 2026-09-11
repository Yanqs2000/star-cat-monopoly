# 高清素材候选记录

用户请求：使用内置 GPT-Image 做原版美术超分，以改善 1080p 下的清晰度。

执行路径：内置 `image_gen` 编辑工具，未使用 CLI 或外部超分程序。工具未提供底层模型选择，不能把结果标为已确认由 GPT-Image 2.5 生成。

## 原素材

- `juanmao-original.jpg`：`public/original/star1.swf` 的 DefineBitsJPEG3，character ID 1，69×90。
- `building-original.jpg`：`public/original/play.swf` 的 DefineBitsJPEG3，character ID 178，180×188。
- 提取时连接 SWF 中由 EOI/SOI 分开的 JPEG 表和图像数据，使标准解码器可读取；没有修改原 SWF。
- 这里展示 RGB 预览，不包括原 SWF 独立保存的 alpha 遮罩。

## 结果与验收状态

| 文件 | 尺寸 | 透明通道 | 状态 |
|---|---|---|---|
| juanmao-hd-candidate.png | 1099×1431 | 无 | 候选：五官、材质和部分轮廓有变化 |
| building-hd-candidate.png | 1227×1282 | 无 | 候选：局部建筑几何与轮廓有变化 |

人物首版误生成棋盘格背景，未作为候选收录。第二版明确使用纯黑底，消除了这个问题，但不是可直接合成进游戏的透明贴图。

用户已接受这两张样张的视觉方向，并授权继续生成其他素材。本批扩展为 12 位人物代表帧与 11 张建筑（包含两张首批样张）。新增素材的来源与完整提示词见 `batch-manifest.json`。

尚未替换运行中的游戏资源，尚未完成相邻动画帧一致性验证或整套动画处理。内置图像工具的生成式恢复不能等同于严格逐像素超分；黑底图还需要透明边缘处理和游戏资源封装。帅戈首版的多余手部已单独修正，旧版以 `shuaige-rejected-extra-hand.png` 保留作审阅记录，不在对照页展示。

## 人物候选的完整提示词

Use case: identity-preserve. Restore the exact attached low-resolution 69x90 game sprite at high resolution, at least 1080 pixels in height, matching its original portrait aspect and framing. It is ONE animation frame of the original StarQ character 卷毛, a small white ram-themed humanoid with golden curled ram horns, a red headband and silver-white clothing. The goal is faithful super-resolution, not redesign. Preserve the source silhouette, full body, precise pose, proportions, head tilt, eye gaze, small mouth expression, both horn shapes, hairstyle, clothing, gloves and shoe positions. Preserve the original soft pre-rendered 3D toy shading; use smooth soft edges with the same shading as the original, NOT added bold cartoon ink outlines. Do not enlarge eyes, alter the face, add details or change the expression. Remove only JPEG artifacts and coarse pixels. Keep the entire background outside the sprite completely solid black (#000000), just like this source image. Do NOT attempt transparency and do NOT draw a checkerboard. No extra shadow, no text, no UI, no border, no extra objects. Do not crop any part of the head or feet. Prioritize exact identity and layout over creative beautification.

## 建筑候选的完整提示词

Use case: precise-object-edit. This is strictly a fidelity-first super-resolution restoration of Image 1, an original 180x188-pixel StarQ game building sprite. NOT concept art, NOT a redesign. Upscale to a crisp image at least 1080 pixels tall with exactly the same composition and aspect ratio. Preserve every existing building block, its exact isometric projection and proportions, the large round yellow/orange front section, the tall yellow-green rear tower, blue windows, small red roof, white satellite dish with gray rim at the rear left, the small gold dish between sections, and the identical flat green diamond-shaped lawn base. Keep the same colors and old pre-rendered cartoon game appearance. Restore only blurry edges and compression noise; do not add new architecture, textures, doors, signage, vegetation, ornament, outlines, or realism. Keep all object parts at the same proportional coordinates as the source; the complete green base must be visible. The entire area outside the original sprite must remain perfectly uniform pure black (#000000), exactly as in the input. No checkerboard, no white background, no cast shadow outside the green base, no text or watermark.
