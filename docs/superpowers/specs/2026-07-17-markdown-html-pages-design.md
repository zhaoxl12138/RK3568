# Markdown 笔记 HTML 化设计

## 目标

驾驶舱及其子页面不再直接链接到 `.md` 文件。Markdown 仍是唯一内容源，构建脚本为重要笔记生成独立 HTML 页面，用户从网页入口阅读时看到的是带导航和样式的正式内容页。

## 方案

- 在 `tools/build-dashboard.mjs` 中增加轻量、无第三方依赖的 Markdown 渲染器，覆盖当前仓库笔记实际使用的标题、段落、列表、引用、代码块、表格、图片、链接和 Obsidian wikilink。
- 根据领域入口、快捷入口和路线页证据入口收集去重后的重要 Markdown 文件，生成到 `00-首页/学习驾驶舱/pages/notes/`，文件名由仓库相对路径稳定编码，避免同名覆盖。
- 生成数据中的网页入口增加 `webPath`，保留 `filePath` 和 `obsidian://` 地址；网页优先使用 `webPath`，并提供“在 Obsidian 中打开”和“查看原始 Markdown”两个辅助入口。
- 生成页复用 `site.css`、`site.js` 和导航壳，页面内部链接优先跳转到其他已生成 HTML，无法解析的链接保持原始目标。
- `notes.html`、`learning-route.html` 和驾驶舱重要内容卡片切换到生成的 HTML 入口；任务看板等状态源仍保留 Obsidian 入口。

## 错误处理

缺失或无法读取的 Markdown 不阻断驾驶舱数据生成：跳过该页并写入 warning。HTML 输出统一进行实体转义，避免笔记内容被解释为页面结构。

## 验证

- 单元测试验证 Markdown 结构渲染、wikilink/相对链接转换、路径稳定性和缺失文件 warning。
- 集成测试验证 OpenCV HTML 页面存在、重要网页入口不再直接指向 `.md`，并且所有生成页的相对资源可解析。
- 运行完整 Node 测试、脚本语法检查、构建命令和 `git diff --check`。
