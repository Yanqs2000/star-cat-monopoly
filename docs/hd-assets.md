# 高清素材接入与重建

## 当前范围

- `public/hd-review/` 保留已确认风格的 23 张黑底生成原图、原版图和提示词。
- `public/hd-assets/` 保存 23 张真正带 alpha 的 RGBA PNG。
- `/?art=hd` 使用单独的 `hd-assets/play.swf`，替换 11 张建筑及对应形状的位图填充缩放。游戏逻辑、声音和其他时间轴标签保持不变。
- `/` 仍使用原始 `original/play.swf`，原版文件未修改。
- 人物完整动画未接入。`star1-preview.swf` 仅替换卷毛位图 1；其根时间轴不能直接独立展示，所以页面播放的是提取真实位图与形状生成的 `render-check.swf`。
- 11 张建筑不等于所有地图建筑、朝向、等级或所有动画已经高清化。

## 抠图方法与边界

用户明确授权使用本地程序。`scripts/hd_assets.py` 使用 Pillow、numpy，从图像边缘洪泛移除接近纯黑的背景，并仅在边缘一像素范围生成软 alpha；内部被轮廓包围的黑色细节保留。初版阈值误伤怪卡黑衣和大尾脸部，已通过收紧阈值修复并加入回归检查。

这是一种针对当前黑底素材的保守抠图，不能恢复原先没有生成的真实玻璃透射、阴影透明度或被主体包围的背景孔洞。部分边缘在大倍率下仍有细黑边，可继续逐图精修。薇薇脚下的黑色椭圆保留为原图已有阴影。

## 重建

需要 Python 3、Pillow 和 numpy。在项目目录运行：

```sh
python3 scripts/hd_assets.py
python3 scripts/test_hd_assets.py
npm test -- tests/original-assets.spec.ts
npm run build
```

本机已使用 Codex 配套 Python 执行：

```sh
/Users/yanqs/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/hd_assets.py
```

脚本只重建派生目录 `public/hd-assets/`，不写入 `public/original/` 或黑底生成原图。SWF 写入 DefineBitsLossless2 预乘 ARGB 数据，同时按新旧图像尺寸调整对应 DefineShape 位图填充矩阵，保留形状边界和游戏坐标。

## 已验证

- 23 张 PNG 均有透明、完全不透明像素，浏览器全部加载成功。
- 人物与建筑在白色、绿色背景中进行检查，整批绿色联系表无明显主体缺失。
- 5 项本地检查覆盖黑色内部细节、接近黑色衣物、形状矩阵与精确替换范围。
- 2 项原版完整性测试验证全部原始 SWF 的哈希与长度。
- TypeScript 检查和生产构建通过。
- 内置浏览器真实进入试用对局，完成掷骰、移动并触发买地提示。尚未遍历地图确认每一个替换建筑的触发场景，也未重跑完整存档回归。
- `render-check.swf` 在同一 Ruffle 播放器中正确显示替换后的建筑 178 和卷毛，透明、比例、定位正常，预览页没有错误日志。

下一阶段是人物动画帧清单与一致性处理，以及其余建筑状态的逐场景验证。
