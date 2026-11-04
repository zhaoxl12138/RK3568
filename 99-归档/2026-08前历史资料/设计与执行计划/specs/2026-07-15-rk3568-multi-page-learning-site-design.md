# RK3568 多页面学习网站设计方案

## 目标

把当前仓库的重要学习内容组织成一组可以互相跳转的本地 HTML 页面，视觉上沿用现有 Phase0 可视化页面的深色、蓝紫渐变、半透明卡片风格；网页负责阅读顺序、系统理解和内容导航，Obsidian 继续负责原始记录、任务状态和复盘。

## 设计原则

1. **先导航，后内容**：首页告诉用户“现在应该看什么、下一页是什么”，不重复展示完整任务状态。
2. **一页一个学习问题**：每个网页围绕一个明确主题组织内容，避免把所有 Markdown 原文堆进单页。
3. **页面互相可达**：所有学习页都提供“上一页 / 总入口 / 下一页 / 回到 Obsidian”导航。
4. **内容不脱离仓库**：网页中的证据、项目、专项笔记和实验记录均指向现有仓库文件；不复制可变的实验事实。
5. **直接打开可用**：不依赖构建工具、后端或 ES Module；双击 `index.html` 可以使用。部署服务器只是可选增强。
6. **当前状态单一来源**：阶段和本轮任务仍由 `06-任务/01-下一步任务看板.md` 维护，网页只显示简短入口信息。

## 页面结构

```text
00-首页/学习驾驶舱/
├── index.html                 # Phase0 风格总入口 / 学习目录
├── styles.css                 # 驾驶舱页面样式
├── site.css                   # 与既有 Phase0 页面共用的导航和补充样式
├── site.js                    # 页面导航、当前阶段轻量展示、媒体路径辅助
├── generated/vault-data.js    # 由现有生成器产生的轻量状态与证据数据
└── pages/
    ├── learning-route.html    # 阶段 0–10 学习路线
    ├── system-map.html        # 系统地图与模块边界
    ├── phase0.html            # Phase0 四张核心可视化页的学习顺序
    ├── project.html           # AI Camera 项目、演示手册、讲解稿
    ├── evidence.html          # 实验产物与可验证证据
    ├── environment.html       # Buildroot、Ubuntu、WSL2、VSCode 环境入口
    ├── notes.html             # Camera、OpenCV、RKNN、Display、Streaming 专项入口
    └── archive.html           # 归档说明与历史文档入口
```

## 首页设计

首页改成与 `04-项目/10-Phase0-可视化总入口.html` 同构的结构：

- 顶部 Hero：RK3568 学习系统标题、当前学习目标、简短说明。
- “现在从这里开始”卡片：显示当前阶段和唯一任务的简短摘要，并跳转任务看板。
- “推荐学习路径”卡片：阶段路线、系统地图、Phase0 可视化、项目复现四个入口。
- “重要内容”卡片网格：项目、环境、证据、专项笔记、资料、归档六个页面。
- 页脚：说明网页只读、内容记录回 Obsidian，并提供仓库 Markdown 总入口。

首页不再渲染完整阶段地图、全部证据和所有技术领域；这些内容分别下沉到独立页面。

## Phase0 页面互相跳转

现有页面保留自己的详细动画、图表和交互，只增加统一导航：

```text
10-Phase0-可视化总入口.html
        ↓
12-Phase0-数据流动画.html
        ↓
13-Phase0-Camera配置全流程.html
        ↓
14-Phase0-驱动层全链路框架图.html
        ↓
15-Phase0-RK3568全系统框架图.html
```

每页顶部固定导航提供：Phase0 总入口、上一页、下一页、学习驾驶舱、Obsidian 项目入口。导航只使用相对路径，保证 `file://` 和本地服务器均可用。

## 内容页面策略

新增内容页采用“摘要 + 关键问题 + 现有文档入口 + 可视化入口”的结构：

- `learning-route.html`：把阶段 0–10 变成可扫描卡片，链接到主线 Markdown 和专项入口。
- `system-map.html`：展示 Camera → V4L2 → GStreamer → OpenCV → RKNN → Display/Streaming 的模块边界，链接到系统专项笔记和 Phase0 图页。
- `phase0.html`：串联现有五张 Phase0 HTML/图片页面。
- `project.html`：展示当前 YOLOv5 RKNN Python MVP 基线，链接项目说明、演示手册、讲解稿和输出沉淀。
- `evidence.html`：按图像、视频、实验记录组织真实资产，资源路径从生成数据读取。
- `environment.html`：按板端、Ubuntu、WSL2、VSCode 组织现有环境文档。
- `notes.html`：按 Camera、OpenCV、RKNN、Display、Streaming、System 组织专项笔记。
- `archive.html`：解释当前入口和历史归档的关系，避免旧路线重新成为入口。

## 数据与跳转

- 所有页面使用普通 `<a href>`，不使用框架路由。
- 站内 HTML 使用相对 `.html` 链接。
- Markdown 入口使用相对 `.md` 链接，允许浏览器查看原文，也保留在 Obsidian 中打开的明确说明。
- 图片和视频使用相对资源路径。
- `site.js` 只读取 `window.RK3568_VAULT_DATA` 的当前阶段、任务和证据字段；不会写入文件或维护第二份状态。
- 现有 `tools/build-dashboard.mjs` 继续负责生成 `vault-data.js`，网页化不会扩大生成器的职责。

## 验收标准

1. 双击 `00-首页/学习驾驶舱/index.html` 能加载首页，无模块脚本错误。
2. 首页能到达所有新增内容页、五张 Phase0 页面和 Obsidian 主入口。
3. 五张 Phase0 页面能按上一页/下一页/总入口互相跳转。
4. 新增页面在桌面宽度和窄屏宽度下均无横向溢出。
5. 证据页的本地图片和视频资源路径全部存在。
6. 现有 Markdown 链接检查仍保持断链、孤立活跃文档和活跃区误连归档为 0。
7. 现有 41 项测试继续通过，生成器重复运行结果稳定。
8. 不修改或删除任何实验原始记录、项目产物和历史归档。
