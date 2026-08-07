# RK3568 多页面学习网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 RK3568 仓库的重要学习内容组织成一组沿用 Phase0 视觉风格、可直接双击运行并能互相跳转的本地 HTML 学习页面。

**Architecture:** 保留现有 Phase0 HTML 页面作为详细可视化内容，在 `00-首页/学习驾驶舱/` 下建立共享站点壳、首页和专题导航页。共享脚本只读取现有生成数据中的当前阶段、任务和证据，不写文件、不建立第二份状态源；所有原始内容仍由 Obsidian Markdown 保存。

**Tech Stack:** 原生 HTML、CSS、经典 defer JavaScript、Node.js 内置 `node:test`，不引入框架和构建依赖。

---

### Task 1: 建立多页面站点共享基础与静态契约测试

**Files:**
- Create: `00-首页/学习驾驶舱/site.css`
- Create: `00-首页/学习驾驶舱/site.js`
- Create: `tools/tests/multipage-site.test.mjs`

- [ ] **Step 1: 写失败测试，锁定页面数量、相对路径和共享导航契约**

测试必须扫描 `00-首页/学习驾驶舱/index.html`、`pages/*.html` 和五张 Phase0 HTML，断言：

```js
assert.ok(html.includes('site.css'));
assert.ok(html.includes('site.js'));
assert.ok(html.includes('data-site-nav'));
assert.ok(fs.existsSync(path.join(root, hrefTarget)));
```

同时断言所有 HTML 页面不包含 `type="module"`，确保直接通过 `file://` 打开。

- [ ] **Step 2: 运行测试确认当前实现失败**

Run: `node --test tools/tests/multipage-site.test.mjs`

Expected: FAIL，因为共享文件、专题页面和统一导航尚不存在。

- [ ] **Step 3: 实现共享样式和导航脚本**

`site.css` 使用现有 Phase0 变量和视觉语言：`#080c14` 背景、蓝紫渐变、半透明 surface、细边框、响应式卡片、固定 `.site-nav` 和 `.page-shell`。

`site.js` 只负责：

```js
document.querySelectorAll('[data-current-stage]').forEach((node) => {
  node.textContent = window.RK3568_VAULT_DATA?.currentStage ?? '当前阶段见 Obsidian 任务看板';
});
```

脚本不得写本地文件或修改任务状态。

- [ ] **Step 4: 运行测试确认基础契约通过**

Run: `node --test tools/tests/multipage-site.test.mjs`

Expected: shared asset and script contract tests PASS；页面数量相关断言仍会等待后续任务。

- [ ] **Step 5: Commit**

```bash
git add 00-首页/学习驾驶舱/site.css 00-首页/学习驾驶舱/site.js tools/tests/multipage-site.test.mjs
git commit -m "feat: add shared RK3568 learning site shell"
```

### Task 2: 将驾驶舱首页改造成 Phase0 风格总入口

**Files:**
- Modify: `00-首页/学习驾驶舱/index.html`
- Modify: `00-首页/学习驾驶舱/styles.css`
- Modify: `00-首页/学习驾驶舱/app.js`

- [ ] **Step 1: 写首页内容契约测试**

在 `tools/tests/multipage-site.test.mjs` 增加断言：首页包含 `Phase0 可视化总入口`、`现在从这里开始`、`推荐学习路径`、`重要内容`，并链接到 `pages/learning-route.html`、`pages/phase0.html`、`pages/project.html`、`pages/evidence.html`、`pages/environment.html`、`pages/notes.html`。

- [ ] **Step 2: 实现首页**

将当前复杂驾驶舱改为：Hero、当前阶段卡片、推荐路径卡片、重要内容卡片、页脚。保留 `data-current-stage` 和任务看板链接，但移除首页的完整阶段地图、全部证据卡片和复杂滚动状态逻辑。

首页必须包含以下入口：

```html
<a href="pages/learning-route.html">学习路线</a>
<a href="pages/system-map.html">系统地图</a>
<a href="pages/phase0.html">Phase0 可视化</a>
<a href="pages/project.html">项目复现</a>
<a href="pages/evidence.html">实验与证据</a>
<a href="pages/environment.html">环境与资料</a>
<a href="pages/notes.html">专项笔记</a>
<a href="../../06-任务/01-下一步任务看板.md">任务看板</a>
```

- [ ] **Step 3: 运行首页契约和现有静态测试**

Run: `node --test tools/tests/multipage-site.test.mjs tools/tests/dashboard-static.test.mjs`

Expected: PASS；如果旧 dashboard-static.test.mjs 仍依赖已删除的旧区块，先将测试契约改为新的首页结构，再继续实现。

- [ ] **Step 4: Commit**

```bash
git add 00-首页/学习驾驶舱/index.html 00-首页/学习驾驶舱/styles.css 00-首页/学习驾驶舱/app.js tools/tests/multipage-site.test.mjs
git commit -m "feat: redesign dashboard as Phase0 learning entrance"
```

### Task 3: 创建学习路线、系统地图和 Phase0 串联页

**Files:**
- Create: `00-首页/学习驾驶舱/pages/learning-route.html`
- Create: `00-首页/学习驾驶舱/pages/system-map.html`
- Create: `00-首页/学习驾驶舱/pages/phase0.html`
- Modify: `tools/tests/multipage-site.test.mjs`

- [ ] **Step 1: 写三个专题页内容断言**

断言页面分别包含：

```js
assert.match(route, /阶段 0/);
assert.match(route, /阶段 1/);
assert.match(system, /Camera/);
assert.match(system, /V4L2/);
assert.match(system, /RKNN/);
assert.match(phase0, /12-Phase0-数据流动画/);
assert.match(phase0, /13-Phase0-Camera配置全流程/);
assert.match(phase0, /14-Phase0-驱动层全链路框架图/);
```

- [ ] **Step 2: 实现学习路线页**

将阶段 0–10 用可扫描卡片呈现；每张卡片包含问题、入口、证据和通过标准，链接到现有主线或专项 Markdown。

- [ ] **Step 3: 实现系统地图页**

用横向/窄屏可换行的链路卡片呈现：`Camera → V4L2 → GStreamer → OpenCV → RKNN → Display / Streaming`。每个模块卡片链接到现有专项笔记，并在页面底部链接 `15-Phase0-RK3568全系统框架图.html`。

- [ ] **Step 4: 实现 Phase0 串联页**

页面展示固定学习顺序，并为五张已有 HTML/PNG 页面提供卡片入口。每张卡片有“学习重点”和“打开页面”按钮。

- [ ] **Step 5: 运行专题页测试**

Run: `node --test tools/tests/multipage-site.test.mjs`

Expected: PASS，且所有站内目标路径存在。

- [ ] **Step 6: Commit**

```bash
git add 00-首页/学习驾驶舱/pages/learning-route.html 00-首页/学习驾驶舱/pages/system-map.html 00-首页/学习驾驶舱/pages/phase0.html tools/tests/multipage-site.test.mjs
git commit -m "feat: add route system map and phase0 pages"
```

### Task 4: 创建项目、证据、环境、专项笔记和归档页

**Files:**
- Create: `00-首页/学习驾驶舱/pages/project.html`
- Create: `00-首页/学习驾驶舱/pages/evidence.html`
- Create: `00-首页/学习驾驶舱/pages/environment.html`
- Create: `00-首页/学习驾驶舱/pages/notes.html`
- Create: `00-首页/学习驾驶舱/pages/archive.html`
- Modify: `tools/tests/multipage-site.test.mjs`

- [ ] **Step 1: 写内容入口测试**

断言五个页面包含对应仓库入口：项目页包含 YOLOv5、演示手册和讲解稿；证据页包含 `assets` 和至少一个 JPG/MP4；环境页包含 Buildroot、Ubuntu、WSL2；专项页包含 Camera、OpenCV、RKNN、Display、Streaming；归档页包含 `99-归档` 和当前主入口。

- [ ] **Step 2: 实现项目页和环境页**

项目页说明当前基线 `RK3568 + Buildroot 4.19 + YOLOv5 RKNN Python MVP`，并链接项目 Markdown、演示手册、讲解稿、Phase0 总图。

环境页按“板端 / Ubuntu / WSL2 / VSCode”分组链接现有文档，明确页面只做导航，不复制命令全文。

- [ ] **Step 3: 实现证据页**

复用 `vault-data.js` 的证据数据，渲染图片缩略图和视频卡片；所有媒体用仓库相对路径，缺失资源显示可读的“资源未找到”卡片，不让一个坏资源阻断页面加载。

- [ ] **Step 4: 实现专项页和归档页**

专项页按六个领域提供卡片和 Markdown 入口；归档页说明旧路线不再是当前入口，链接到归档索引和现行首页。

- [ ] **Step 5: 运行内容页测试**

Run: `node --test tools/tests/multipage-site.test.mjs`

Expected: PASS，所有 Markdown、图片、视频和 HTML 入口均能解析到存在的目标。

- [ ] **Step 6: Commit**

```bash
git add 00-首页/学习驾驶舱/pages tools/tests/multipage-site.test.mjs
git commit -m "feat: webify RK3568 project evidence environment and notes"
```

### Task 5: 给五张既有 Phase0 页面加统一互链导航

**Files:**
- Modify: `04-项目/10-Phase0-可视化总入口.html`
- Modify: `04-项目/12-Phase0-数据流动画.html`
- Modify: `04-项目/13-Phase0-Camera配置全流程.html`
- Modify: `04-项目/14-Phase0-驱动层全链路框架图.html`
- Modify: `04-项目/15-Phase0-RK3568全系统框架图.html`
- Modify: `tools/tests/multipage-site.test.mjs`

- [ ] **Step 1: 写互链测试**

对五个文件断言：每个页面包含 `data-site-nav`、`学习驾驶舱`、`Phase0 总入口`、一个上一页/下一页入口，并且 href 目标存在。

- [ ] **Step 2: 注入统一导航**

在每个页面的 `<body>` 开始位置加入同一组相对链接；使用新增 `site.css` 提供固定顶栏和移动端换行样式。保留页面原有 CSS、动画、SVG 和内容，不重写其内部交互。

- [ ] **Step 3: 运行互链测试**

Run: `node --test tools/tests/multipage-site.test.mjs`

Expected: PASS，五页形成总入口 → 数据流 → Camera → 驱动层 → 全系统框架的闭环。

- [ ] **Step 4: Commit**

```bash
git add 04-项目/10-Phase0-可视化总入口.html 04-项目/12-Phase0-数据流动画.html 04-项目/13-Phase0-Camera配置全流程.html 04-项目/14-Phase0-驱动层全链路框架图.html 04-项目/15-Phase0-RK3568全系统框架图.html tools/tests/multipage-site.test.mjs
git commit -m "feat: link Phase0 visualization pages together"
```

### Task 6: 全量验证与浏览器验收

**Files:**
- Modify: `README.md` only if the new web entry path needs clarification.
- Test: `tools/tests/*.test.mjs`

- [ ] **Step 1: 运行完整自动化验证**

```bash
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs . --json
node --check 00-首页/学习驾驶舱/site.js
node --check 00-首页/学习驾驶舱/app.js
git diff --check
```

Expected: all tests PASS；断链、孤立活跃文档、活跃区直连归档均为 0；脚本检查通过。

- [ ] **Step 2: 运行生成器并确认稳定**

```bash
node tools/build-dashboard.mjs .
node --test tools/tests/*.test.mjs
```

Expected: `vault-data.js` 只反映任务看板当前阶段和证据资源，重复运行不会产生语义差异。

- [ ] **Step 3: 浏览器验收**

用本地服务器打开 `00-首页/学习驾驶舱/index.html`，依次检查首页、学习路线、系统地图、Phase0 串联页、项目页、证据页、环境页、专项页和归档页；再把窗口切到窄屏宽度，确认导航换行、卡片可读、无横向滚动。

- [ ] **Step 4: 直接文件验收**

双击 `00-首页/学习驾驶舱/index.html`，确认首页能加载，不出现模块脚本错误；至少打开一张图片、一张 Phase0 HTML 页面和一个 Markdown 入口。

- [ ] **Step 5: Commit**

```bash
git add README.md 00-首页/学习驾驶舱 04-项目 tools/tests
git commit -m "test: verify RK3568 multi-page learning site"
```
