# 第4阶段手动存读档设计

基线e73cb33，用户授权“进入第四阶段，直到完成”；沿用已批准architecture.md与roadmap.md第4A/4B。本轮连续内联实施，最后独立复审；不要求重复批准既有范围。

三个服务器槽位；单用户本机loopback Fastify服务，SQLite独立文件，事务整体替换。Node24 LTS（实测24.19.0）、原生node:sqlite，依赖锁定。服务不允许外部网卡绑定，检查Host/Origin，HttpOnly SameSite会话及每会话CSRF；本地不追加网络登录，正式凭据/HTTPS在部署阶段。

新版Snapshot包含format/version/rulesVersion、创建和保存时间、完整GameState、原开局选人顺序、速度/暂停。GameState JSON schema由权威TypeScript生成，Ajv不转换或补默认值；增加数值、地图/玩家/股票引用、日期、终局与稳定流程的语义校验。不读取旧SharedObject。

仅真人awaiting-roll且无interaction/continuation、或已结束结果允许保存。禁止保存移动/动画/小游戏中间时刻，菜单提示当前为何不可保存。打开存档菜单冻结当前控制器、场景、音频；快捷键被菜单截断，关闭恢复原暂停状态。读取可从选人或对局打开；当前局替换需明确点击确认，先请求/校验/准备新场景，任何失败保留旧局，可关菜单继续。

GET /api/saves列三个槽位摘要（空槽revision0），GET /api/saves/:slot返回完整版本化快照。PUT携带expectedRevision/requestId/snapshot：BEGIN IMMEDIATE比较修订号并提交；409只提示冲突，不自动覆盖；重新查看槽位后手动再次保存。相同requestId及请求内容的最后一次写入重复请求返回同一结果，解决响应丢失后手动重试。无自动保存、后台上传、定时重试或客户端副本降级。

恢复核心字段与RNG原样；不保存Pixi/Vue对象、日志引用或播放中的媒体。音量/静音是当前本机用户偏好，不存旧音效；读回结果不补播奖励。场景资源失败保留原局，网络与SQLite失败不显示成功。槽位显示真实保存时间、轮次/日期、参赛者及修订号。

退出标准：自动核心/真实SQLite/API故障和并发检查；生产浏览器手动保存、刷新/关闭/服务重启恢复、跨浏览器共享、过期标签页409、失败后继续；全量回归/类型/构建/独立复审及acceptance-4.md/resume-4.md。存档与数据库不提交git，不动用户已有浏览器对局，不进入高清化/部署。
