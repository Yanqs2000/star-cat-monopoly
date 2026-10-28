# 非人物连续动画 13—17

状态：技术候选，等待用户视觉验收。运行索引 `src/modern/data/non-character-effects.json` 保持 `pending-user-art-review`；本分支未合并主分支。01—12仍使用原批准清单。

## 审阅入口

在仓库根目录运行 `python3 -m http.server 64866 --bind 127.0.0.1 --directory public`，打开 <http://127.0.0.1:64866/hd-review/non-character-13-17/>。页面提供五项原版／高清同速对照、1／0.5／0.25倍、逐帧、背景和缩放；末帧留白一秒后由审阅页重播，游戏中的特效均单次播放。

- `comparison.mp4`：1440×1000、60fps、8秒同速对照。该视频由确定性渲染器采样编码，不用它证明整局设备性能。
- `gameplay/missile-flow.mp4`：实际生产游戏操作录屏，25fps、11.4秒，包含用卡、起飞、暂停、2倍速与命中；同目录保存各项游戏截图及烟雾18／19帧采样。
- `production-browser-results.txt`：最终13个生产浏览器场景全部通过（10个本批、3个兼容场景）。
- `animations/*.webp`：透明、单次动画，每帧16或17毫秒。
- `source-timeline.json`、`source-bitmaps/`：JPEXS提取的原始摆放、矩阵、透明度与嵌套位图。
- `prompts.json`、四张母版PNG：GPT内置生图的提示词、参考来源和实际母版。未生成独立动画姿态。
- `motion-config.json`、`effects-renderer.js`：源轨迹和可重复的连续渲染实现。
- `verification.json`、`browser-verification.json`：478帧像素重建、透明末态、包围盒及独立审阅页播放测量。

## 连续运动与原时序

13卡牌固定正背纹理作连续投影翻转；14金色奖券币固定纹理翻转，保留金色身份；15统一烟团纹理通过扩张、分离、开口和消散得到38帧；16将通用烟团纹理作为残烟层，另叠亮核、火焰和冲击圈，不复用整段帐篷动画；17固定火箭本体与独立尾焰、烟圈连续运动。原时长分别50／30、30／30、19／30、60／30、80／30秒，显示采样为100／60／38／120／160帧。

原业务时钟保持30Hz。烟雾显示帧只能落在当前源帧对应的两个采样中；18帧调用不访问第19源帧，开窗和按钮时点保留。火箭1079第40帧触发落点迁移，第80帧之后才开始爆炸：高清显示在1300毫秒换原点到落点，在2666.667毫秒后播放爆炸。扣卡、伤害、送医、拘留仍由原控制器立即结算。

1048烟圈第11帧含`stop()`，因此起始只播放前10帧，随后为空；第40帧再次明确停在11，第70帧重播。中段空白是原显隐语义。所有特效末帧透明，结束后250毫秒释放对象；延迟和进度均随地图暂停／倍速变化。暂停切换画质会迁移特效的真实进度、延迟、原点、落点，而非重新触发业务。

## 资源成本

全部运行帧保留4倍像素密度和无损RGBA。世界特效透明空白按逻辑像素网格裁切，锚点补偿后逐帧重建与原渲染像素相同；烟雾保留完整画布。完全透明或相同帧复用文件。

|动画|显示帧|独立运行文件|压缩字节|理论解码RGBA字节|
|---|---:|---:|---:|---:|
|card-gain|100|99|1,995,430|10,718,400|
|ticket-gain|60|59|1,073,632|3,672,832|
|fog|38|37|7,108,880|65,508,352|
|explosion|120|116|27,705,114|221,565,440|
|rocket|160|99|5,402,020|59,328,256|
|总计|478|410|43,285,076|360,793,280|

理论RGBA约344.1 MiB，不包含Pixi纹理副本、其他素材或GPU开销，不能当作整局实测内存。为避免Chrome同时请求数千张图片导致`ERR_INSUFFICIENT_RESOURCES`，地图纹理预载限制为6个并行的获取／解码任务，所有帧仍在进入对局前加载。

每帧大画布额外渲染检查可见裁切，阈值alpha>8／255；实测最大越界尾光7／255，只涉及极淡羽化。所有帧alpha和可见RGB的无损压缩重建误差为0。源SWF SHA-256为 `790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba`。

## 可重复验证

使用项目要求的Node24（本次实际24.22.1）、有Pillow与NumPy的Python、JPEXS26.2.1、Chrome和ffmpeg；没有升级依赖。Browser插件不可用，本次使用项目Playwright配置和本机Chrome，生产游戏运行在SwiftShader下。

```sh
npm test
npm run check:saves
npm run build:modern
python3 scripts/verify-approved-non-character.py
python3 scripts/verify-non-character-effects.py
# 先在另一个终端启动 npm run preview:modern -- --port 4201 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4201 npx playwright test --config playwright.modern.config.ts tests/e2e/modern-approved-effects.spec.ts
node scripts/verify-effects-review.mjs
```

重新制作使用 `python3 scripts/build-non-character-effects.py`（会重新运行连续渲染和打包），然后 `python3 scripts/verify-non-character-effects.py --capture-baseline`。重新编码对照视频使用 `node scripts/render-effects-comparison.mjs`，需要审阅服务器已启动。再运行默认验证器可独立核对已保存的每帧可见像素摘要，不依赖忽略目录中的PNG缓存。

验证结果和最终用户审批记录见 `docs/modernization/non-character-13-17-delivery.md`。生产构建仅复制 `public/modern/hd-static/effects-13-17`，母版、源图、审阅页和视频不进入生产包。
