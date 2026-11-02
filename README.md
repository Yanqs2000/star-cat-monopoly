# 星猫大富翁 · 复刻修改版

基于《星猫大富翁》的浏览器游戏复刻与改造项目，使用 Vue 3、TypeScript、PixiJS 和 Ruffle。包含原版兼容入口和现代版，支持玩家与 AI 对局、高清地图与人物、卡牌与股票、事件小游戏和本机存读档。

## 下载并启动高清版

需要 **Node.js 24.x（至少 24.19.0）**、npm 和现代浏览器。

```bash
git clone --branch main --single-branch https://github.com/Yanqs2000/star-cat-monopoly.git
cd star-cat-monopoly
npm ci
npm run build:modern
npm run server:modern
```

打开 [http://127.0.0.1:4186/modern.html](http://127.0.0.1:4186/modern.html)，选择角色后点击“开始对局”。**运行所需的高清图集、地图和人物素材已随代码提供，默认使用高清模式，无需先生成素材，也无需安装 Python、Java 或 Flash 插件。**

也可以在 GitHub 下载 ZIP，解压后进入包含 `package.json` 的目录，从 `npm ci` 开始执行上述命令。

保持终端运行，按 `Ctrl+C` 停止服务。存档保存在本机 `.data/saves.sqlite`。

## 开发调试（可选）

需要修改代码并实时预览时，先停止上面的服务，再在项目目录打开两个终端，分别运行：

```bash
# 终端一：本机存档服务，端口 4186
npm run server:modern
```

```bash
# 终端二：游戏开发服务，端口 5184
npm run dev:modern
```

打开 [http://127.0.0.1:5184/modern.html](http://127.0.0.1:5184/modern.html)。第一个终端提供存读档接口，第二个终端提供游戏页面与热更新。

## 启动原版兼容入口

```bash
npm run dev
```

打开 [http://localhost:5173/](http://localhost:5173/)。启动脚本会自动准备本地 Ruffle 运行库。前端端口被占用时，以终端显示的地址为准。

---

项目仍在持续开发中。原作及原素材的相关权利归原权利方所有。
