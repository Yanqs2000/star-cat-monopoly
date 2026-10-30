# 24 卷毛连续 2D 动画候选

本批仅角色1卷毛。当前状态是 `candidate-awaiting-user-review`。用户尚未接受本批新母版、新分层或新运动。没有修改原版 SWF、原版/旧高清角色纹理，其他11个可玩角色亦未改。

## 来源与方法

- 身份来源：`public/hd-review/juanmao-hd-v2.png`（历史5A角色身份参考）。历史“5A通过”仅适用于当时2D样本，不批准本次新运动或3D模型。
- 原动作来源：`public/original/star1.swf` SHA-256 `7c20816b680f04fdb0c64bcdbf6203d4d4687cc690c89c3a118b4b6e8d107fcc`。`source-audit.json`逐方向记录完整帧数、去重数、保持映射和时长。
- 原SWF并不存在可直接恢复的分肢骨架：sprite130有24帧，仅depth1切换8个整身位图，每张保持3帧100ms。其形状→位图依赖与放置矩阵见 `original-swf-probe.txt`。反应也采用整身位图序列。
- 本批由内置 ImageGen 生成同一身份四向neutral母版，再制作happy、sad脸部及hurt焦黑炸毛变体；生成文件保留于本目录。身体、头、手和鞋按同一neutral几何分层；关节间在原立绘遮挡位置使用银白材质的圆端连接段，双骨IK驱动，头角始终作同一刚体变换，不做光流或拉扯五官。
- 独立示例行走以800ms为基准；游戏内按真实位移适配步频，使支撑足固定于世界地面，业务移动速度不变。neutral/ready保持静态，happy1900ms、sad73帧/左下74帧、hurt2000ms、cheer68帧的原时长保留。准备显示红点骰面道具，受伤使用固定四向焦黑炸毛头部，欢呼包含蓄力、跃起、悬空、落地。地图实例以(28,20)注册原格内锚点。

## 可重现

使用项目已配置的Node24与带Pillow/NumPy的Python：

```sh
python scripts/build-juanmao-24.py
node scripts/build-juanmao-24-review.mjs
npm test -- tests/modern/juanmao-24.spec.ts
npm run typecheck
# 用静态HTTP服务提供 public/，随后：
JUANMAO_24_BASE_URL=http://127.0.0.1:64869 JUANMAO_24_VIDEO=1 node scripts/verify-juanmao-24.mjs
```

审阅入口是 `hd-review/character-24/index.html`（保留index.html以免Vite目录请求退回首页）。runtime.js已打包，不依赖Vite转换TS。

## 实际验证与限制

TDD先运行3个运动回归测试，确认缺少连续步态、60Hz新子帧与正确时长均失败，再实现通过；另有实际Pixi消费者测试验证脚、手独立移动且步行头贴图不换。最终浏览器状态见 `browser-verification.json`；每态桌面截图、移动布局与七态视频为实际Chrome/WebGL渲染。

这是新2D puppet对原动作的演绎，不能说是原版完整四肢运动的提取或逐姿态复刻。支撑足已按实际世界位移驱动，并在真实游戏直线移动及暂停恢复中验证；转向、起停的观感仍需用户目视确认。受伤采用单独的焦黑炸毛母版，白眼直接来自母版，不再用近似白点；后侧视角不见脸时表情自然不明显。关节连接材质、手套边缘和四向身份仍待用户验收。最终验证与范围见../characters-22-24/final-verification.json及项目交付记录。
