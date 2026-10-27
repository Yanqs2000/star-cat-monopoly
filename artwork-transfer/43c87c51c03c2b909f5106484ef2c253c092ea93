# 静态高清素材替换

用户授权使用 GPT 内置生图替换尚未重绘的静态场景与界面图片，保留既有高清成果。工作分支 `feat/static-hd-art` 基于本地 `main` 的 `eda3c57`；不导入人物动作、立绘、神灵贴图或 Blender 文件。事件插图中的人物属于静态插画。

## 素材与进度

机器清单为 `static-hd-production.json`，记录 130 项去重后的非地图任务、原图哈希、重复资源别名、各图完整提示词与生成来源。地图另列，尚未完成。运行映射为 `src/modern/data/static-hd-assets.json`。

第一阶段接入 54 份重绘母版，覆盖 59 个运行路径：公司建筑 1、16 种卡牌（17 个路径）、37 幅事件插图（41 个路径）。地产房屋与活动面板继续制作。卡牌和公司建筑运行密度为 4，事件插图为 3；母版原生尺寸均达到相应密度，运行图仅缩小打包为无损 WebP。

母版保存于 `public/modern/hd-static-masters/`，运行图保存于 `public/modern/hd-static/`。使用内置 `image_gen`，没有调用 CLI 或 API 生图。透明图保留生成 alpha；事件插图为不透明。`pending-user-review` 表示尚待最终美术验收，已选择的图片已接入高清模式，不会阻塞继续生产。原版画质继续读取原图。

`register_static_hd_master.py` 防止重复注册已完成任务，检查原图、母版原生密度与画布比例，并保存完整提示词和指纹。`verify:modern-static-assets` 检查 81 个既有素材文件未改动、运行图和母版指纹、透明通道、逻辑尺寸、密度和范围。

公司对话框两版因内容区透明度不正确而未启用。相邻地图 M02 两版因道路几何及接缝漂移而未启用；母版留在对应目录追溯。既有已验收 5A 四块地图原始字节保持不变。未把这些候选或旧图插值当作完成重绘。

## 验证

`tests/e2e/modern-static-art.spec.ts` 使用真实 Pixi MapScene、HandPanel 和 InteractionPanel；覆盖新公司建筑、全部 17 张手牌、全部已接入事件图、卡牌选择、事件确认、原版路径与错误监测。测试场景在 `tests/fixtures/modern-static-art.html`，仅供开发测试。Browser 插件不可用，使用项目 Playwright 配置中的本机 Chrome 与 SwiftShader；功能通过不能作为设备性能结论。

生成过程中的验证结果以实际命令输出为准；整体任务尚未完成，不作全地图或全静态界面验收声明。不要覆盖根目录或人物 worktree 的用户工作。
