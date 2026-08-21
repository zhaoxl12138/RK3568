# RK3568 Camera 文档架构重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有 00–11 Camera 学习顺序、实板证据、源码陪读和可视化网页的前提下，把仓库重构为“唯一课程状态 + Markdown 知识源 + 源码陪读 + 实验证据 + 面试输出 + 只读网页”的可持续学习系统。

**Architecture:** 采用四层架构：`01-课程主线` 保存 00–11 的唯一课程正文；`02-源码陪读` 保存可复用的函数调用与代码解释；`05-实验与证据` 保存不可替代的板端原始事实；`00-首页/学习驾驶舱` 只从统一课程清单与 Markdown 构建只读网页。现有 `04-项目` HTML 继续作为可视化伴读页，不再承担课程状态或技术事实的唯一来源。

**Tech Stack:** Obsidian Markdown、YAML Frontmatter、静态 HTML/CSS/JavaScript、Node.js 构建与测试脚本、Git。

---

## 1. 审计范围与现状基线

本次审计覆盖：

- 全仓库目录、文件类型、文件体积和 Git 状态。
- 75 个 Markdown 的标题、层级、元数据、链接和孤立状态。
- 45 个 HTML 的课程入口、全站导航、脚本加载和链接目标。
- 00–11 课程映射、任务看板、阶段验收、生成数据和网页运行时之间的关系。
- 当前活跃 Camera 文档、实验证据、专项笔记、附录、输出沉淀和历史归档。
- 现有 Node.js 构建脚本、链接检查脚本和 107 项自动测试。

### 1.1 数量基线

| 类型 | 数量 | 说明 |
|---|---:|---|
| Markdown | 75 | 其中约 25 篇是活跃学习内容，26 篇是工程设计/实施计划，18 篇是历史归档，其余是图源和工具说明 |
| HTML | 45 | 26 个 Markdown 生成页、10 个手写可视化页、9 个站点入口/导航页 |
| 自动测试 | 107 | 当前全部通过 |
| 断开的 Markdown 链接 | 0 | 当前链接基础健康 |
| 活跃文档误连归档 | 0 | 当前归档边界健康 |
| 活跃孤立文档 | 7 | 2 篇有效内容、4 个 Excalidraw 图源、1 个绘图 Skill |
| 仓库本地体积 | 约 4.78 GB | 其中 5,001,225,010 字节来自 `$out/` 内一个 SDK 压缩包 |

### 1.2 当前做得好的地方

1. 已经形成真实板卡闭环，不是只摘抄概念：原理图、运行时 DTS、I2C client、probe、Sensor ID、Media Graph 和抓帧都有证据。
2. 当前 00–11 网页路线完整存在，03 → 04 → 05 连续跳转正确。
3. 网页链接、UTF-8、本地 `file://` 打开和统一运行时导航已有自动测试保护。
4. 第一章和 D-PHY 源码陪读已经具备面试导向：结论、源码、运行证据、故障边界和复述模板较完整。
5. `99-归档` 已经把旧 AI 应用过程与当前 Camera 驱动主线做了第一轮隔离。

### 1.3 当前最主要的结构问题

| 优先级 | 问题 | 当前证据 | 后果 |
|---|---|---|---|
| P0 | 课程状态存在两套编号 | `site.js` 当前阶段为课程 `04`；任务看板、验收表和 `vault-data.js` 仍使用“阶段 2” | 同一个 D-PHY 主题出现两个阶段号，后续无法可靠生成进度、证据和导航 |
| P0 | 生成数据已经漂移 | `vault-data.js` 仍引用已删除的 `Camera驱动第2章-MIPI-DPHY与CSI2`，但源任务看板已改为 `media-ctl -p详解` | 自动测试通过但网页数据不是最新源文档，说明缺少“构建后零差异”检查 |
| P0 | 5 GB SDK 压缩包误放在知识库 | `$out/atk-rk3568_linux_release_v1.4_20250104.tgz` 未跟踪且未忽略 | 备份、扫描、Git 工具和 Obsidian 文件观察都会变慢 |
| P1 | 课程主线没有统一的 Markdown 正文层 | 00–11 同时指向手写 HTML、生成笔记、实验记录和专项笔记 | 页面能跳，但每一阶段的“唯一知识源”不清楚 |
| P1 | `06-任务` 同时承担计划、课程、源码陪读和学习记录 | 7 个文件中既有周计划，也有 2350 行源码陪读和 DTS 教程 | 任务文件越来越长，无法区分“今天做什么”和“长期保留什么” |
| P1 | D-PHY 源码陪读过长且前置内容重复 | 约 2350 行；“五层关系”“推荐阅读顺序”等在 0.3/0.10、0.6/0.12 重复 | Source Insight 陪读价值高，但在 Obsidian 中查找、复盘和更新成本过高 |
| P1 | 课程成熟度不均 | 00–05 有专门页面；06 直接落到证据；07 是全时序概览；10/11 仍是旧 AI 总览/排障文档 | 学到后半段会再次出现“有入口、没有教程”的问题 |
| P1 | 证据和结论混写 | Day 1 文档同时写原始事实、审批、后续更正和面试表达 | 同一设备的 1280×720、3840×2160、4.19.232、4.19.255 等状态缺少采集时间和命令上下文 |
| P1 | 页面运行时统一，但静态源码仍含旧导航 | 多个 HTML 的初始导航仍写“当前任务 / Phase0 / 阶段 2”，由 `site.js` 加载后替换 | JavaScript 失效时显示旧体系，也增加维护者阅读源码时的困惑 |
| P2 | 有效内容和工程内部文件混在 Obsidian 树中 | 26 篇 `docs/superpowers` 计划占全部 Markdown 的约 35% | 用户看到的“文档很多”有相当部分不是学习内容 |
| P2 | `project.html` 名称和职责不一致 | 页面标题叫项目基线，正文实际是 Phase0/章节入口集合 | “项目成果”和“课程资料”仍然混在一起 |
| P2 | 资料与旧 AI 内容仍泄漏到活跃索引 | `01-概念索引`、系统图、排障索引仍含 RKNN、HLS、RTMP 大段内容 | 当前唯一目标是 Camera 驱动岗位，主线注意力仍会被拉走 |
| P2 | 元数据缺少统一规范 | 25 篇活跃文档中只有 3 篇使用业务 Frontmatter，字段也不一致 | 不能稳定按课程、状态、证据、发布状态自动分组 |

---

## 2. 目标信息架构

不以“大规模改名”为第一目标。先保留 `00-首页`、`04-项目` 和现有 HTML URL，新增两个语义明确的知识层，把最混乱的 `06-任务` 减负。

```text
RK3568/
├─ 00-首页/
│  ├─ 00-RK3568学习主入口.md         # 人工阅读入口
│  ├─ course-map.json                 # 唯一网页阶段状态源：currentStage
│  └─ 学习驾驶舱/                     # 只读网页与生成产物
│
├─ 01-课程主线/                       # 00–11 每阶段一个唯一 Markdown 正文
│  ├─ 00-系统总览.md
│  ├─ 01-Linux-Driver-Model.md
│  ├─ 02-DTS与设备发现.md
│  ├─ 03-IMX415-Sensor-Bring-up.md
│  ├─ 04-MIPI-CSI2-DPHY.md
│  ├─ 05-V4L2-Subdev.md
│  ├─ 06-Media-Controller.md
│  ├─ 07-RKISP.md
│  ├─ 08-V4L2用户态取流.md
│  ├─ 09-GStreamer与OpenCV.md
│  ├─ 10-RKNN与YOLO.md
│  └─ 11-Camera-Bring-up排障.md
│
├─ 02-源码陪读/                       # 按模块与函数生命周期拆分
│  ├─ 03-IMX415/
│  ├─ 04-DPHY/
│  └─ 07-RKISP/
│
├─ 04-项目/                           # 保留 URL；手写可视化 + 实板项目档案
├─ 05-实验与证据/                     # 原始命令、日志、截图、抓帧与结论边界
├─ 06-任务/                           # 只保留当前任务、周计划和复盘
├─ 07-专项笔记/                       # 术语、命令、跨阶段参考，不承担课程顺序
├─ 08-附录/                           # 原理图、数据手册、资料版本、绘图规范
├─ 09-输出沉淀/                       # 面试答案、讲解稿、简历项目描述
├─ 99-归档/                           # 退出主线的历史内容
├─ docs/                              # 工程设计与实施记录；不进入学习导航
└─ tools/                             # 构建、校验和测试；不进入学习导航
```

### 2.1 六类文档的职责边界

| 文档类型 | 只回答什么 | 不应该包含什么 |
|---|---|---|
| `course` | 这一阶段为什么学、核心原理、当前板卡对应、验收和下一阶段 | 大量逐行源码、当天流水账、完整原始日志 |
| `source-reading` | 谁调用谁、参数来源、结构体变化、DTS 对应和运行证据 | 课程进度、重复的基础概念长篇教学 |
| `evidence` | 执行环境、原始命令/输出、能证明什么、不能证明什么 | 把推测包装成已验证事实 |
| `task` | 当前唯一任务、完成条件、下一动作 | 技术正文和大段正确答案 |
| `reference` | 术语、命令、资料位置和跨章节速查 | 当前学习状态 |
| `interview-output` | 60–90 秒回答、追问、故障场景和项目表达 | 未验证结论 |

### 2.2 统一元数据模型

所有活跃 Markdown 使用以下核心字段；不是每种类型都必须填写全部字段。

```yaml
---
id: course-04-dphy
title: MIPI CSI-2 / D-PHY
doc-type: course
course-stage: "04"
learning-status: in-progress
evidence-status: partial
publish-status: private
last-reviewed: 2026-08-09
---
```

字段语义必须分开：

```text
course-stage     = 00–11 的课程位置
chapter          = 旧五章体系，只在迁移期兼容，最终删除
week/day         = 执行计划中的时间位置
competency-id    = 能力验收编号，不再叫“阶段”
learning-status  = draft / in-progress / review / validated
evidence-status  = none / partial / verified
publish-status   = private / ready / published / archived
```

这样可以避免当前“课程 04 = 五章体系第 2 章 = 周计划 Day 3 = 验收阶段 2”被混成一个数字。

---

## 3. 00–11 课程成熟度与改造策略

保持课程顺序不变，但明确“当前可用程度”。00–08 是 Camera 驱动核心，09–10 是岗位扩展，11 是综合收口。

| 课程 | 当前入口 | 当前成熟度 | 处理策略 |
|---|---|---|---|
| 00 总览 | `system-map.html` + 框架总览记录 | 良好但双源 | 以框架总览 Markdown 为正文，系统地图作为可视化伴读 |
| 01 Linux Driver Model | 手写 HTML | 有图、缺 Markdown 正文 | 从现有图和第一章提炼一个正式课程 Markdown |
| 02 DTS 与设备发现 | `IMX415-DTS 解读` 生成页 | 内容深入但像聊天稿 | 补标题/元数据，删对话开场，拆出通用 DTS 语法附录 |
| 03 IMX415 Sensor | 三层调用图 + 第一章 | 最成熟 | 第一章收敛为 Sensor Bring-up；DTS 细节链接到阶段 02 |
| 04 MIPI CSI-2 / D-PHY | D-PHY HTML + 两篇草稿 | 深度高但重叠/过长 | `media-ctl -p详解` 改为课程正文；源码陪读拆成模块化索引 |
| 05 V4L2 Subdev | 手写 HTML | 可视化较好、缺正文 | 学到该阶段时补正式 Markdown，不提前大改 |
| 06 Media Controller | 直接指向实验证据 | 只有证据、没有教程 | 从 `media-ctl -p` 的 entity/pad/link 部分提炼正式正文 |
| 07 RKISP | DTS→videoX 时序图 | 只有全局时序、缺 RKISP 原理/源码 | 学到该阶段时新增 RKISP 专章和源码陪读 |
| 08 V4L2 用户态取流 | 抓帧实验记录 | 实验强、理论弱 | 保留实验；补 video_device、VB2、mplane、STREAMON 正文 |
| 09 GStreamer/OpenCV | 实验记录 | 可用 | 将实测步骤和通用原理分栏，修正过期 IP/环境信息 |
| 10 RKNN/YOLO | AI Camera 系统边界 | 过于宽泛 | 标记为扩展课；从归档材料提炼最小 Camera→AI 接口，不恢复旧主线 |
| 11 Bring-up 排障 | AI Camera 故障索引 | 范围太宽 | 新建 Camera 专属排障正文；AI/网络故障留在参考或归档 |

---

## 4. 分阶段实施计划

### Task 1: 建立安全基线并清理仓库噪声

**Files:**

- Modify: `.gitignore`
- Create: `.gitattributes`
- Inspect only: `$out/atk-rk3568_linux_release_v1.4_20250104.tgz`
- Inspect only: `tmp/pdfs/*`
- Modify later: `.obsidian/app.json`

- [ ] **Step 1: 保存当前工作树基线**

运行：

```powershell
git status --short
git diff --stat
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
```

Expected: 107 tests pass；0 broken links；记录现有用户修改，不回退任何文件。

- [ ] **Step 2: 忽略大文件和临时产物**

在 `.gitignore` 增加：

```gitignore
$out/
tmp/
```

`$out` 内 5 GB SDK 包建议移动到仓库外的 SDK 归档目录；移动前先记录 SHA-256，移动后再次校验。此步骤不删除原始 SDK。

- [ ] **Step 3: 统一文本换行规则**

创建 `.gitattributes`：

```gitattributes
*.md   text eol=lf
*.html text eol=lf
*.css  text eol=lf
*.js   text eol=lf
*.mjs  text eol=lf
*.json text eol=lf
*.png  binary
*.tgz  binary
```

- [ ] **Step 4: 从 Obsidian 学习视图隐藏工程目录**

将 `docs/`、`tools/`、`00-首页/学习驾驶舱/pages/notes/`、`tmp/`、`$out/` 配置为不参与日常文件浏览/搜索；不要删除这些工程文件。

- [ ] **Step 5: 验证**

```powershell
git check-ignore -v '$out/atk-rk3568_linux_release_v1.4_20250104.tgz'
git check-ignore -v 'tmp/pdfs/imx415-datasheet-page-84.png'
node --test tools/tests/*.test.mjs
```

Expected: 大文件与临时目录被忽略；测试仍全部通过。

- [ ] **Step 6: 本地提交，不 push**

建议提交信息：`chore: isolate temporary and binary workspace files`

---

### Task 2: 建立唯一课程清单和唯一当前状态

**Files:**

- Create: `00-首页/course-map.json`
- Modify: `00-首页/00-RK3568学习主入口.md`
- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `tools/build-dashboard.mjs`
- Modify: `tools/tests/course-navigation.test.mjs`
- Modify: `tools/tests/build-dashboard.test.mjs`
- Modify: `tools/tests/dashboard-static.test.mjs`

- [ ] **Step 1: 先写失败测试**

新增断言：

1. 00–11 只从 `course-map.json` 读取。
2. `site.js` 不再硬编码 `COURSE_CURRENT_STAGE` 和 12 项路径。
3. 当前课程阶段只能是两位字符串，例如 `"04"`。
4. 任务的 `week/day` 和能力 `competency-id` 不能覆盖 `course-stage`。
5. 生成数据中不得出现已删除的 `Camera驱动第2章-MIPI-DPHY与CSI2`。

运行：

```powershell
node --test tools/tests/course-navigation.test.mjs tools/tests/build-dashboard.test.mjs tools/tests/dashboard-static.test.mjs
```

Expected: 新断言先失败。

- [ ] **Step 2: 写入课程清单**

`course-map.json` 固定保存当前已确认的 00–11 顺序、标题、目标、正文源和网页目标；不保存每日任务。

- [ ] **Step 3: 写入唯一当前状态**

`course-map.json.currentStage` 是网页阶段状态的唯一来源，当前值为两位字符串 `"05"`。每日任务的 `week/day` 只保存在任务或复盘文档中，不再建立第二份课程阶段状态页。

- [ ] **Step 4: 让构建脚本生成课程运行时数据**

`build-dashboard.mjs` 读取 `course-map.json` 和状态 Frontmatter，生成：

```javascript
window.RK3568_COURSE = { currentStage: '04', stages: [...] };
```

`site.js` 只消费数据并渲染，不再维护第二份课程表。

- [ ] **Step 5: 将验收表从“阶段”改为“能力”**

把 `07-专项笔记/系统/Camera驱动分阶段验收标准.md` 改名为“Camera 驱动能力验收矩阵”，编号使用 `C01...C10`，每项显式映射到一个或多个 `course-stage`。

- [ ] **Step 6: 重建并验证零漂移**

```powershell
node tools/build-dashboard.mjs
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
git diff --check
```

Expected: 课程当前阶段在首页、路线页、资料页和生成数据中都为 `04`；不存在旧“阶段 2”状态源。

- [ ] **Step 7: 本地提交，不 push**

建议提交信息：`refactor: centralize course map and learning state`

---

### Task 3: 建立统一文档元数据和发布生命周期

**Files:**

- Create: `docs/content-schema.md`
- Create: `08-附录/模板/课程正文模板.md`
- Create: `08-附录/模板/源码陪读模板.md`
- Create: `08-附录/模板/实验证据模板.md`
- Modify: `tools/build-dashboard.mjs`
- Modify: `tools/check-vault-links.mjs`
- Create: `tools/tests/content-schema.test.mjs`

- [ ] **Step 1: 定义六种 `doc-type` 和字段枚举**

支持：`course`、`source-reading`、`evidence`、`task`、`reference`、`interview-output`。

- [ ] **Step 2: 区分学习、证据和发布状态**

禁止继续用一个 `completed` 同时表达“看过、会讲、实板验证、已发布”。

- [ ] **Step 3: 先给 25 篇活跃知识文档补最小元数据**

Excalidraw 与 Skill 标记为内部资源，不进入网页笔记目录，也不计为知识孤岛。

- [ ] **Step 4: 向后兼容 `web-publish: false`**

迁移期间：`web-publish: false` 等价于 `publish-status: private`；全部迁移后删除旧字段。

- [ ] **Step 5: 增加 Schema 测试**

测试至少检查：ID 唯一、course-stage 合法、状态枚举合法、course 文档标题与路径存在、private 文档没有生成 HTML。

- [ ] **Step 6: 验证**

```powershell
node --test tools/tests/content-schema.test.mjs tools/tests/*.test.mjs
node tools/check-vault-links.mjs
```

Expected: 有效内容孤立文档为 0；内部图源不再作为 orphan warning。

---

### Task 4: 将耐久知识从 `06-任务` 迁出

**Files:**

- Create directory: `01-课程主线/`
- Create directory: `02-源码陪读/`
- Move: `06-任务/2026-08-08-Linux Camera驱动框架总览.md` → `01-课程主线/00-系统总览.md`
- Create: `01-课程主线/01-Linux-Driver-Model.md`
- Move and edit: `06-任务/IMX415-DTS 解读 -2026年7月31日.md` → `01-课程主线/02-DTS与设备发现.md`
- Move and edit: `06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md` → `01-课程主线/03-IMX415-Sensor-Bring-up.md`
- Move and edit: `06-任务/media-ctl -p详解.md` → `01-课程主线/04-MIPI-CSI2-DPHY.md`
- Move: `06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md` → `02-源码陪读/04-DPHY/00-源码陪读索引.md`
- Keep in `06-任务`: 当前任务看板、周计划和后续复盘

- [ ] **Step 1: 写路径迁移测试**

测试新路径存在、旧正文路径最终不存在、所有 Wikilink/HTML 路径解析正确。

- [ ] **Step 2: 使用 Git move 保留历史**

不要复制后删除；使用 `git mv`，并让 Obsidian 或链接修复脚本更新所有入链。

- [ ] **Step 3: 修复两个有效内容孤岛**

阶段 00 和阶段 02 进入唯一课程入口后，`Linux Camera 驱动框架总览` 与 `IMX415 DTS 解读` 不再是 Obsidian 孤立文档。

- [ ] **Step 4: 保持旧 HTML URL 可用**

`04-项目` 现有 10 个手写 HTML 暂不移动；课程清单只更新其对应 Markdown 源关系。

- [ ] **Step 5: 重建网页并验证**

```powershell
node tools/build-dashboard.mjs
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
```

Expected: 0 broken link；00–11 每一项有唯一 `sourcePath`；生成页名称不再依赖 `06-任务--` 前缀。

- [ ] **Step 6: 本地提交，不 push**

建议提交信息：`refactor: separate course and source-reading documents`

---

### Task 5: 重构当前 00–04 正文，不提前重写 05–11

**Files:**

- Modify: `01-课程主线/00-系统总览.md`
- Modify: `01-课程主线/01-Linux-Driver-Model.md`
- Modify: `01-课程主线/02-DTS与设备发现.md`
- Modify: `01-课程主线/03-IMX415-Sensor-Bring-up.md`
- Modify: `01-课程主线/04-MIPI-CSI2-DPHY.md`
- Modify: `06-任务/Camera驱动求职第1周执行计划.md`

- [ ] **Step 1: 所有课程正文使用统一模板**

每章固定为：

```text
为什么学习
→ 在整条链路中的位置
→ 输入 / 输出 / 软件身份 / 硬件身份
→ RK3568 当前对应
→ DTS / 源码入口
→ 实板验证
→ 常见故障
→ 面试表达
→ 验收题
→ 下一阶段接口
```

- [ ] **Step 2: 清理阶段 02 的聊天稿痕迹**

删除“可以。你这份 DTS...”式开场，补正式 H1 和摘要；将通用 DTS 语法移到参考附录，正文只保留 IMX415 相关路径。

- [ ] **Step 3: 清理阶段 03 与阶段 02 的边界**

阶段 03 不再重复逐行讲所有 DTS 属性；只说明 probe 怎样消费资源，并链接阶段 02。

- [ ] **Step 4: 重命名阶段 04 正文**

`media-ctl -p 详解` 不是本章真实范围的完整名称。课程正文改为“MIPI CSI-2 / D-PHY”；其中 entity/pad/link 的完整逐项解释在阶段 06 形成正式正文时迁移过去。

- [ ] **Step 5: 周计划只留执行信息**

把 Day 1/Day 2 的长篇正确答案迁回对应课程的“学习记录/问答”区域；周计划只保留任务、状态、验收链接和复盘结论。

- [ ] **Step 6: 不提前重写 05–11**

先为 05–11 建立课程占位元数据和成熟度标识；只有进入该阶段学习时才升级正文。

- [ ] **Step 7: 内容验收**

每个完成阶段必须同时满足：

1. 能用一句话定位模块职责。
2. 能指出当前板子的 DTS/源码位置。
3. 能给出一项实板证据。
4. 能说明该证据不能证明什么。
5. 能回答一个典型故障追问。

---

### Task 6: 将超长 D-PHY 源码陪读拆成“索引 + 生命周期模块”

**Files:**

- Modify: `02-源码陪读/04-DPHY/00-源码陪读索引.md`
- Create: `02-源码陪读/04-DPHY/01-HW-Driver注册与Probe.md`
- Create: `02-源码陪读/04-DPHY/02-逻辑DPHY-Probe与Attach-HW.md`
- Create: `02-源码陪读/04-DPHY/03-V4L2-Subdev与Pads.md`
- Create: `02-源码陪读/04-DPHY/04-Endpoint与Async-Notifier.md`
- Create: `02-源码陪读/04-DPHY/05-Bound与Media-Link.md`
- Create: `02-源码陪读/04-DPHY/06-调试证据与面试验收.md`
- Modify: `tools/tests/dphy-source-reading-note.test.mjs`

- [ ] **Step 1: 先锁定不可丢失的调用链**

测试必须覆盖：

```text
module_platform_driver()
→ rockchip_csi2_dphy_hw_probe()
→ platform_driver_register()
→ rockchip_csi2_dphy_probe()
→ rockchip_csi2_dphy_attach_hw()
→ v4l2_subdev_init()
→ rockchip_csi2dphy_media_init()
→ media_entity_pads_init()
→ parse_fwnode_endpoints_by_port()
→ notifier register
→ .bound()
→ media_create_pad_link()
```

- [ ] **Step 2: 删除现有重复前置章节**

合并 0.3 与 0.10 的“五层关系”；合并 0.6 与 0.12 的“阅读顺序”；每个核心问题只保留一处标准解释。

- [ ] **Step 3: 索引页控制在约 300 行内**

索引页只放完整总图、对象表、源码基线、Source Insight 跳转顺序和六个模块入口。

- [ ] **Step 4: 每个模块使用固定函数卡**

```text
函数属于哪一层
谁调用：直接调用 / 框架回调
参数从哪里来
读取什么
修改哪个结构体
DTS 对应
运行时证据
失败时下一检查点
面试一句话
```

- [ ] **Step 5: 保留 E 盘源码中文注释的边界说明**

明确 E 盘 Source Insight 镜像是学习副本，WSL SDK 和对应 Git commit 才是编译事实源；不要让笔记暗示注释已经进入板端编译源码。

- [ ] **Step 6: 验证**

```powershell
node --test tools/tests/dphy-source-reading-note.test.mjs
node tools/check-vault-links.mjs
```

Expected: 调用链完整；没有重复章节；每个子文档可从索引进入并返回。

---

### Task 7: 把实验证据改造成可审计记录

**Files:**

- Modify: `05-实验与证据/00-Camera证据索引.md`
- Modify: `05-实验与证据/2026-07-28-Camera驱动Day1验收.md`
- Modify: `05-实验与证据/2026-07-28-直连板端读取IMX415配置.md`
- Create: `05-实验与证据/环境基线/RK3568-IMX415当前基线.md`
- Create: `05-实验与证据/assets/manifest.md`
- Move selected assets from: `06-任务/assets/`
- Modify: `00-首页/学习驾驶舱/pages/evidence.html`
- Modify: `tools/build-dashboard.mjs`

- [ ] **Step 1: 为每份证据增加环境快照**

至少记录：采集时间、板卡、系统、内核、DTB/SDK commit、命令、原始输出文件和设备 IP（IP 只作为当时环境，不写成永久事实）。

- [ ] **Step 2: 使用固定证据结构**

```text
操作目的
原始命令
原始输出
可以证明
不能证明
关联课程阶段
状态：verified / superseded
```

- [ ] **Step 3: 处理当前已发现的不一致**

逐项核对：

- `192.168.0.103` 与当前 `192.168.0.230`。
- Buildroot 板端使用 `grep`，不要默认有 `rg`。
- `4.19.232`、Media API `4.19.255` 分别来自哪次环境。
- Media bus format `YUYV8_2X8` 与 video node memory format `NV12` 的层级区别。
- `/dev/video7` statistics 与 `/dev/video8` input-params 的准确映射。
- 1280×720、1920×1080、3840×2160 分别是“协商后的实验配置”还是“默认当前配置”。

- [ ] **Step 4: 整理图片资产**

`tmp/pdfs/imx415-datasheet-page-84.png` 与正式资产哈希相同，只保留正式副本；原始整页、裁剪图、来源 PDF 页码和用途写入 manifest。

- [ ] **Step 5: 让证据页面真正有内容**

当前 `vault-data.js` 的 `evidence` 为空。将带 evidence 元数据的日志/截图按 course-stage 分组生成卡片；没有附件的阶段显示明确待补项。

- [ ] **Step 6: 验证**

Expected: 任一网页技术结论都能回到一个 evidence ID；同名“当前格式”不会跨日期互相覆盖。

---

### Task 8: 收敛网页为课程展示层，而不是第二套知识库

**Files:**

- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `00-首页/学习驾驶舱/index.html`
- Modify: `00-首页/学习驾驶舱/pages/learning-route.html`
- Modify: `00-首页/学习驾驶舱/pages/project.html`
- Modify: `00-首页/学习驾驶舱/pages/notes.html`
- Modify: `00-首页/学习驾驶舱/pages/evidence.html`
- Modify: `00-首页/学习驾驶舱/pages/environment.html`
- Modify: `00-首页/学习驾驶舱/pages/archive.html`
- Modify: `tools/build-dashboard.mjs`
- Modify/Create tests under: `tools/tests/`

- [ ] **Step 1: 静态回退导航与运行时导航同源生成**

不再让 HTML 源码保留旧“当前任务 / Phase0 / 阶段 2”导航，再依赖 JavaScript 替换。构建时直接写入当前统一导航，`site.js` 只增强交互。

- [ ] **Step 2: 课程页显示正文成熟度**

每个阶段卡显示：`草稿 / 学习中 / 已验证 / 已发布`，避免“有链接”被误解为“已经学完”。

- [ ] **Step 3: 改造项目页职责**

`project.html` 改为“RK3568 + IMX415 Bring-up 项目档案”，包含：项目目标、硬件/软件基线、已完成能力、证据、关键故障、可复现步骤、面试/简历表达。Phase0 和课程链接移入“参考可视化”。

- [ ] **Step 4: 笔记页按角色而不是文件夹堆叠**

优先显示课程、源码陪读、证据、面试输出；草稿、图源、Skill、工程 plans/specs 不进入用户笔记目录。

- [ ] **Step 5: 增加生成漂移检查**

在测试/CI 中执行一次构建后检查工作树：

```powershell
node tools/build-dashboard.mjs
git diff --exit-code -- '00-首页/学习驾驶舱'
```

Expected: 已提交仓库中的生成网页必须和 Markdown/课程配置一致。

- [ ] **Step 6: 保持现有 00–11 和 03→04→05 不变**

不新增课程阶段，不把 Phase0 恢复为一级课程，不改变当前视觉语言。

- [ ] **Step 7: 全站验证**

```powershell
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
```

并人工抽查：`file://`、本地 HTTP、窄屏、键盘操作、00→11 前后跳转。

---

### Task 9: 建立面试输出闭环

**Files:**

- Modify: `09-输出沉淀/00-输出沉淀入口.md`
- Create: `09-输出沉淀/模板-阶段面试卡.md`
- Create: `09-输出沉淀/00-项目三分钟讲解.md`
- Create progressively: `09-输出沉淀/01-...` through `11-...`
- Modify: `06-任务/Camera驱动求职第1周执行计划.md`

- [ ] **Step 1: 每个课程阶段只输出一张面试卡**

固定包含：30 秒结论、90 秒展开、当前板卡证据、两个追问、一个故障场景、仍不能证明什么。

- [ ] **Step 2: 课程正文保存知识，输出目录保存表达**

不要在周计划、课程、输出三个地方重复同一份标准答案。

- [ ] **Step 3: 将 09–10 标记为扩展能力**

保持课程编号不变，但首页明确：00–08 + 11 是 Camera 驱动核心；09–10 是 OpenCV/RKNN 岗位加分项。

- [ ] **Step 4: 最终项目表达基于证据 ID**

三分钟讲解中的每一个“我做过”都必须能链接到源码位置或实板证据。

---

### Task 10: 最终归档、质量门禁与交付

**Files:**

- Modify: `99-归档/00-归档说明.md`
- Move superseded documents only after all inbound links are migrated
- Modify: `README.md`
- Modify: `tools/check-vault-links.mjs`
- Modify/Create: relevant tests under `tools/tests/`

- [ ] **Step 1: 只归档已被新正文完整替代的文件**

归档前必须通过引用检查；不因为文件名难看就删除有唯一事实的文档。

- [ ] **Step 2: 工程 plans/specs 不进入学习导航**

保留 Git 历史和实施价值，但在 Obsidian 中默认隐藏。

- [ ] **Step 3: 最终自动验证**

```powershell
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
git diff --check
git status --short
```

Expected:

- 0 broken Wikilink。
- 0 broken relative link。
- 0 active-to-archive link。
- 0 有效内容 orphan；仅允许显式标记的内部资产。
- 00–11 恰好 12 个课程阶段，每阶段一个唯一 Markdown 知识源。
- 全站只显示一个当前课程阶段。
- `publish-status: private` 不生成 HTML。
- 构建后生成目录无未提交漂移。
- `$out/` 和 `tmp/` 不进入 Git 或 Obsidian 日常视图。

- [ ] **Step 4: 人工学习体验验收**

从首页连续执行：

```text
看当前阶段
→ 打开课程正文
→ 打开配套源码陪读
→ 打开当前板端证据
→ 回答面试卡
→ 返回任务看板
```

用户在任一页面都应能在 5 秒内回答：我在哪、这一页是什么角色、上一阶段是什么、下一步做什么、技术结论去哪里验证。

- [ ] **Step 5: 完成分支收尾**

只在用户明确要求时 push；不自动 merge。

---

## 5. 推荐执行批次

### 批次 A：立即修复维护风险

执行 Task 1–3：大文件/临时目录、唯一课程状态、元数据与生成漂移。

完成标志：网页和 Obsidian 只剩一个“当前阶段 04”，构建产物不再落后于源文档。

### 批次 B：只重构当前已经学过的内容

执行 Task 4–7：迁移 00–04 正文、拆 D-PHY 源码陪读、规范证据。

完成标志：当前学习链 `总览 → Driver Model → DTS → IMX415 → D-PHY` 每一站都有唯一正文、源码和证据归属。

### 批次 C：网页与项目展示收口

执行 Task 8–9：课程展示、项目档案、面试卡。

完成标志：网页不再是资料目录，而是当前课程的只读展示层和求职项目入口。

### 批次 D：随学习推进升级后续课程

进入 05–11 时逐章升级，不提前批量制造空教程。

完成标志：每完成一章，再把该章从 draft 升级为 validated/published。

---

## 6. 这次不建议做的事情

1. 不推倒现有 00–11 顺序。
2. 不删除 10 张 `04-项目` 手写 HTML；它们仍有很高的可视化价值。
3. 不一次性重写 05–11 的正文。
4. 不把 2350 行 D-PHY 细节压缩成一张浅层总图；应拆分，而不是丢失。
5. 不把原始实验输出直接改写成“漂亮结论”；原始事实和解释必须分栏。
6. 不再新增第三套“阶段”编号。
7. 不自动 push 或 merge。

---

## 7. 最终判断

当前仓库已经具备一套优秀 Camera 驱动学习库最难获得的三样东西：真实板卡、真实源码、真实运行证据。现在的短板不是技术内容不足，而是缺少内容治理：同一知识分别落在任务、课程、HTML、证据和输出中，且状态编号不统一。

本计划的核心不是“把文件夹重新排得好看”，而是建立以下稳定关系：

```text
一个课程阶段
    ↓
一个唯一 Markdown 正文
    ├─ 若干源码陪读
    ├─ 若干实板证据
    ├─ 一个可视化伴读页
    └─ 一张面试输出卡
```

只要这个关系建立，后续学习 RKISP、Media Controller、VB2 和新 Sensor 移植时，仓库规模即使继续增长，也不会再次失控。
