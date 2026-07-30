# Camera Vault Directory Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除 `01`～`05` 中与 Camera 驱动求职无关的旧结构，并把首页、任务状态和网页导航收敛到当前周计划与章节学习。

**Architecture:** `06-任务` 是唯一学习主线，`04-项目` 只承担 Camera 可视化，`05-实验与证据` 只承担实测证据。网页生成器从这些现存源文件构建导航；删除源文档时同步删除对应生成页并修复所有反向链接。

**Tech Stack:** Obsidian Markdown、静态 HTML/CSS/JavaScript、Node.js `node:test`、PowerShell、Git

---

### Task 1: 固定新的入口契约

**Files:**
- Modify: `tools/tests/build-dashboard.test.mjs`
- Modify: `tools/tests/multipage-site.test.mjs`
- Modify: `tools/tests/dashboard-static.test.mjs`

- [ ] **Step 1: 把测试中的旧路线改成 Camera 主线**

断言快捷入口使用：

```text
06-任务/Camera驱动求职第1周执行计划.md
05-实验与证据/2026-07-28-Camera驱动Day1验收.md
05-实验与证据/2026-07-28-直连板端读取IMX415配置.md
```

- [ ] **Step 2: 把页面测试中的旧项目、旧环境和旧证据入口断言删除**

新增断言：生成目录中不出现 `01-主线`、`02-资料`、`03-环境` 和 `Python MVP`。

- [ ] **Step 3: 运行测试确认当前实现不满足新契约**

Run:

```powershell
node --test tools/tests/*.test.mjs
```

Expected: 至少一项因旧路径仍存在而失败。

### Task 2: 改写唯一入口和状态页

**Files:**
- Modify: `00-首页/00-RK3568学习主入口.md`
- Modify: `06-任务/01-下一步任务看板.md`
- Modify: `README.md`

- [ ] **Step 1: 首页只保留五个入口**

保留：当前周计划、当前章节、Phase0 总图、板端证据、专项笔记。

- [ ] **Step 2: 任务看板改成轻量状态页**

当前状态固定为“第一章技术学习完成、面试复述待验收；第二章 MIPI D-PHY/CSI2 学习中”，不再复制旧 Buildroot/Python MVP 计划。

- [ ] **Step 3: README 改成 Camera 驱动求职知识库说明**

删除所有指向旧 `01`～`05` 文档的入口。

### Task 3: 更新网页生成器的数据源

**Files:**
- Modify: `tools/build-dashboard.mjs`

- [ ] **Step 1: 替换快捷入口**

```js
['activeRoute', '06-任务/Camera驱动求职第1周执行计划.md']
['dailyRecord', '05-实验与证据/2026-07-28-Camera驱动Day1验收.md']
['evidenceMoc', '05-实验与证据/2026-07-28-直连板端读取IMX415配置.md']
```

- [ ] **Step 2: 删除 `EXTRA_NOTE_PATHS` 中的旧 `01`～`05` 文档**

保留 Camera 周计划、第一章、两份板端证据和仍有效的专项笔记。

- [ ] **Step 3: 从 `ACTIVE_NOTE_ROOTS` 删除 `01-主线`、`02-资料`、`03-环境`**

目录缺失时生成器不应产生警告，也不再生成这些目录的网页。

### Task 4: 删除旧源文档并修复反向链接

**Files:**
- Delete: `01-主线/*.md`
- Delete: `02-资料/*.md`
- Delete: `03-环境/*.md`
- Delete: `04-项目/00-项目可视化入口.md`
- Delete: `04-项目/01-RK3568 YOLOv8n AI Camera项目.md`
- Delete: `04-项目/02-AI Camera项目讲解稿.md`
- Delete: `04-项目/03-Python MVP演示手册.md`
- Delete: `05-实验与证据/00-实验与证据入口.md`
- Delete: `05-实验与证据/01-板子到手验机记录.md`
- Delete: `05-实验与证据/02-每日进度记录.md`
- Modify: active Markdown files returned by `rg`

- [ ] **Step 1: 删除明确无用的源文档**

保留 `04-项目/10`～`16` 和两份 2026-07-28 Camera 证据。

- [ ] **Step 2: 替换仍有意义的链接**

旧“Python MVP 路线”改指向 `Camera驱动求职第1周执行计划`；旧实验入口按内容改指向两份 Camera 实测证据。

- [ ] **Step 3: 删除不再相关的“关联文档”条目**

对于 YOLO、RKNN、推流等历史专项，不伪造 Camera 关联；只移除已删除目标。

### Task 5: 清理对应网页并重建目录数据

**Files:**
- Delete: `00-首页/学习驾驶舱/pages/notes/01-主线--*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/02-资料--*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/03-环境--*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/04-项目--00-*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/04-项目--01-*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/04-项目--02-*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/04-项目--03-*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/05-实验与证据--00-*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/05-实验与证据--01-*.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/05-实验与证据--02-*.html`
- Modify: `00-首页/学习驾驶舱/generated/vault-data.js`
- Modify: `00-首页/学习驾驶舱/pages/notes.html`
- Modify: relevant static navigation pages

- [ ] **Step 1: 删除被删除 Markdown 对应的生成页**

- [ ] **Step 2: 运行网页生成器**

Run:

```powershell
node tools/build-dashboard.mjs .
```

Expected: 无必需输入缺失警告；第二章因 `web-publish: false` 不被发布。

- [ ] **Step 3: 搜索确认网页中没有旧入口**

Run:

```powershell
rg -n "01-主线|02-资料|03-环境|从零到Python MVP|Python MVP演示手册" "00-首页/学习驾驶舱"
```

Expected: 没有导航或目录命中；历史正文命中需要逐项判断。

### Task 6: 验证结构和链接

**Files:**
- Verify: entire repository

- [ ] **Step 1: 验证目录结果**

Run:

```powershell
rg --files "01-主线" "02-资料" "03-环境"
rg --files "04-项目" "05-实验与证据"
```

Expected: 前三目录不存在；后两目录只保留设计中列出的 Camera 文件和暂留实验产物。

- [ ] **Step 2: 运行链接检查**

Run:

```powershell
node tools/check-vault-links.mjs .
```

Expected: `Broken wikilinks: 0`、`Broken relative links: 0`、`Active-to-archive links: 0`。

- [ ] **Step 3: 运行完整测试**

Run:

```powershell
node --test tools/tests/*.test.mjs
```

Expected: 全部通过。

- [ ] **Step 4: 检查 Git 范围并提交**

仅提交本次目录精简及其必要的导航、生成器、测试和生成网页改动，不覆盖其他未完成内容。

