# 资源位置与清理记录

本轮按“清理当前构建不用的素材和副本，保留旧人物工作副本”的范围执行。
清理前提交为 `adf1ffa8082f047eb6af9cd77a2f5da6a0842c80`，没有重写 Git 历史。

## 文件在哪里

以下路径均相对于仓库根目录。Finder 默认隐藏以 `.` 开头的目录；按 `⌘⇧.` 显示隐藏项目，或按 `⌘⇧G` 输入完整路径。

| 路径 | 用途与处理 |
| --- | --- |
| `public/modern/assets/` | 原版逐帧图片、界面和数据，运行时需要，保留。 |
| `public/modern/assets-hd/` | 本地生成的高清缓存，运行时需要，保留，不提交 Git。 |
| `public/modern/hd-map/`、`public/modern/hd-static/` | 正式高清地图和静态素材，保留。 |
| `public/modern/hd-masters/`、`public/modern/hd-static-masters/` | 制作来源；保留当前校验、来源登记和地图回放需要的文件，移除未引用的中间图片。 |
| `public/modern/hd-review/5a/` | 旧样本审查副本，已移除；`5b/index.html` 仍供现有开发对照测试使用。 |
| `.worktrees/fix-observed-game-ui/` | 当前界面工作副本，同步清理相同的过期素材。九份旧构建已移除，只保留最新 `dist-modern-preload/`。 |
| `.worktrees/modern-map-foundation/` | 旧人物工作副本，整体保留，包括约 15 GiB 的 `.analysis-cache/` 和未提交素材。 |
| `.analysis-cache/non-character-assets-archive-20261024/` | 已完成地图工作副本的旧缓存备份，已移除。 |
| `.analysis-cache/integrated-worktree-archives-2026-10-26/` | 已整合任务的旧本地副本，已移除。 |
| `.analysis-cache/resource-cleanup-20261027/manifest.json` | 本机完整删除清单、原 Git 对象编号和保留目录校验记录，不提交 Git。 |

## 清理结果

- 主目录移除 4,486 个已跟踪的过期文件，合计 4,087,575,768 字节；界面工作副本移除相同文件。
- 当前提交的原有文件从 23,592 个、6,019,784,325 字节，降至 19,106 个、1,932,208,557 字节；新加入的构建测试与本记录另计。
- 本地项目由约 103 GiB 降至约 29 GiB。磁盘统计包含工作副本、依赖、构建和 Git 历史，与 GitHub 当前文件的体积不同。
- 正式地图的 192 个来源、4 个前景实例、原有保护清单中的 81 个文件及当前已登记母图保留。
- 历史制作记录仍可能包含已移除的旧截图或中间产物名称。这些记录描述当时状态；旧文件可从清理前提交恢复。

`vite.config.ts` 现在按运行入口复制静态目录：现代版只复制 `assets`、`assets-hd`、`hd-map`、`hd-static`；原版入口只复制 `original`、`hd-assets`、`ruffle`。开发服务器仍能访问保留的制作来源。`.gitignore` 排除 `dist-modern-*`，避免新预览副本被提交。

若需要找回某个已跟踪文件，先查看其历史，再执行：

```sh
git restore --source=adf1ffa8082f047eb6af9cd77a2f5da6a0842c80 -- 路径
```

普通删除提交会减少 GitHub 当前文件列表，历史资源仍保留在旧提交中。

## 验证

- 构建复制的回归测试先复现现代版、原版入口多余复制，修正后通过；完整单元测试 750 项通过。
- 地图 Python 测试 33 项通过；地图来源、完整地图和静态素材校验通过。
- 补齐本机高清缓存缺少的 20 个位图派生文件后，15,869 个高清资源的覆盖、校验和、尺寸、透明度检查通过，`build:modern:hd` 通过。
- 原版入口 `npm run build` 通过，原版生产入口的 5 项 Playwright 测试通过。
- 现代版生产产物在本机 Chrome 中分别使用原版素材、高清素材完成选人、进入对局与掷骰；两次均无页面异常或 HTTP 失败。
- 旧人物工作副本清理前后 290,642 个文件的路径、大小和修改时间摘要一致。

本轮提交不包含原有的 `scripts/requirements-modern-hd.txt` 改动、`.claude/`、`.mcp.json` 或 `resume-state.md`。
