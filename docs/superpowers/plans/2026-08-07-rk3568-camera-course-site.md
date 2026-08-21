# RK3568 Camera Course Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing 45-page static site into a linear RK3568 Camera course with one 00–11 route, a focused learning cockpit, and automatic course context on every mainline page.

**Architecture:** Keep the existing static HTML/CSS/JavaScript and use `site.js` as the single course-navigation runtime. A 12-item course map will drive global navigation, current-stage state, progress, and previous/next links. Existing content pages remain intact; only the homepage and route hub receive structural rewrites.

**Tech Stack:** Static HTML5, CSS, browser-compatible classic JavaScript, Node.js built-in test runner, existing vault link checker.

---

### Task 1: Lock the 00–11 course contract with failing tests

**Files:**
- Create: `tools/tests/course-navigation.test.mjs`
- Modify: `tools/tests/multipage-site.test.mjs`
- Modify: `tools/tests/dashboard-static.test.mjs`

- [ ] **Step 1: Write the failing course-map test**

Add a test that reads `site.js`, extracts the public course contract, and verifies all 12 IDs, labels, unique target paths, and the current stage:

```js
test('course runtime defines one ordered 00-11 route', () => {
  assert.deepEqual(courseStages.map(({ id }) => id), [
    '00', '01', '02', '03', '04', '05',
    '06', '07', '08', '09', '10', '11',
  ]);
  assert.equal(courseCurrentStage, '04');
  assert.equal(new Set(courseStages.map(({ path }) => path)).size, 12);
});
```

- [ ] **Step 2: Add failing runtime behavior assertions**

Require these shared functions and labels:

```js
for (const functionName of [
  'findCourseStageForPage',
  'renderCourseNavigation',
  'renderCourseContext',
  'renderCourseRoute',
]) {
  assert.match(siteJs, new RegExp(`function\\s+${functionName}\\s*\\(`, 'u'));
}
```

Also assert that the old primary labels `当前任务` and `Phase0` are no longer part of the JavaScript primary navigation.

- [ ] **Step 3: Add failing homepage contract assertions**

Require the homepage to contain:

```js
for (const marker of [
  'data-course-current',
  'data-course-objective',
  'data-course-next',
  'data-course-route',
]) assert.match(html, new RegExp(marker, 'u'));
```

- [ ] **Step 4: Run the focused tests and verify RED**

Run:

```powershell
node --test tools/tests/course-navigation.test.mjs tools/tests/dashboard-static.test.mjs tools/tests/multipage-site.test.mjs
```

Expected: failures report missing course data/functions and old homepage/nav contracts.

### Task 2: Implement the shared course data and global navigation

**Files:**
- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `00-首页/学习驾驶舱/site.css`

- [ ] **Step 1: Add the exact course data**

Define one ordered array in `site.js`:

```js
var COURSE_CURRENT_STAGE = '04';
var COURSE_STAGES = [
  { id: '00', title: '总览', path: 'pages/system-map.html' },
  { id: '01', title: 'Linux Driver Model', path: '../../04-项目/15-Linux设备模型与总线分层.html' },
  { id: '02', title: 'DTS 与设备发现', path: 'pages/notes/06-任务--IMX415-DTS 解读 -2026年7月31日.html' },
  { id: '03', title: 'IMX415 Sensor', path: '../../04-项目/16-IMX415-三层驱动调用流程.html' },
  { id: '04', title: 'MIPI CSI-2 / D-PHY', path: '../../04-项目/17-DPHY-从DTS到MediaGraph.html' },
  { id: '05', title: 'V4L2 Subdev', path: '../../04-项目/19-IMX415-v4l2-subdev注册与开流.html' },
  { id: '06', title: 'Media Controller', path: 'pages/notes/05-实验与证据--2026-07-28-直连板端读取IMX415配置.html' },
  { id: '07', title: 'RKISP', path: '../../04-项目/18-RK3568-Camera从DTS到videoX真实启动时序.html' },
  { id: '08', title: 'V4L2 用户态取流', path: 'pages/notes/07-专项笔记--Camera-V4L2--V4L2命令行抓帧记录.html' },
  { id: '09', title: 'GStreamer / OpenCV', path: 'pages/notes/07-专项笔记--OpenCV--OpenCV读取Camera记录.html' },
  { id: '10', title: 'RKNN / YOLO', path: 'pages/notes/07-专项笔记--系统--AI Camera系统数据流与模块边界.html' },
  { id: '11', title: 'Camera Bring-up 排障', path: 'pages/notes/07-专项笔记--系统--AI Camera故障排查索引.html' },
];
```

Each item also receives a one-sentence objective used by the homepage and route page.

- [ ] **Step 2: Replace the old category-first navigation renderer**

Render these controls in order:

```text
RK3568 Camera 课程 | 学习首页 | 完整路线 | 课程目录 00–11 | 资料与实验 | 当前 04
```

The course menu links to all 12 stage paths. The reference menu links to `system-map.html`, `evidence.html`, `notes.html`, `environment.html`, `phase0.html`, and `archive.html`.

- [ ] **Step 3: Add navigation styles**

Add styles for `.course-menu`, `.course-menu__grid`, `.course-menu__item`, `.course-status`, and narrow-screen horizontal behavior. Preserve keyboard focus styles and readable contrast.

- [ ] **Step 4: Run the focused test and verify partial GREEN**

Run:

```powershell
node --test tools/tests/course-navigation.test.mjs
```

Expected: course map and shared navigation assertions pass; course-context assertions remain failing until Task 3.

### Task 3: Inject course context into the 12 mainline pages

**Files:**
- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `00-首页/学习驾驶舱/site.css`
- Test: `tools/tests/course-navigation.test.mjs`

- [ ] **Step 1: Test page recognition and route adjacency**

Test that all 12 target paths resolve to existing files and that the first/last stages have only one neighbor while middle stages have two.

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test tools/tests/course-navigation.test.mjs
```

Expected: failure reports missing course-context rendering.

- [ ] **Step 3: Implement page recognition**

Compare the decoded current URL to each stage URL created with `new URL(stage.path, siteRoot)`. Return `null` for reference pages.

- [ ] **Step 4: Implement top course context**

For a mainline page, insert before its existing main content:

```html
<section class="course-context" data-course-context>
  <p>当前位置：阶段 04 / MIPI CSI-2 / D-PHY</p>
  <nav class="course-progress" aria-label="RK3568 Camera 学习进度">…</nav>
  <div class="course-adjacent">上一阶段 / 下一阶段</div>
</section>
```

Status classes are derived from the numeric order relative to `COURSE_CURRENT_STAGE`: `is-complete`, `is-current`, and `is-planned`. The viewed page also receives `is-viewing`.

- [ ] **Step 5: Implement bottom course navigation**

Append one `.course-footer-nav` to the mainline page’s `<main>` with previous, route hub, and next links. Do not inject it into reference pages.

- [ ] **Step 6: Add responsive styles and verify GREEN**

Run:

```powershell
node --test tools/tests/course-navigation.test.mjs
```

Expected: all course runtime tests pass.

### Task 4: Rebuild the homepage as the learning cockpit

**Files:**
- Modify: `00-首页/学习驾驶舱/index.html`
- Modify: `00-首页/学习驾驶舱/styles.css`
- Modify: `00-首页/学习驾驶舱/site.js`
- Test: `tools/tests/dashboard-static.test.mjs`

- [ ] **Step 1: Keep the homepage test RED**

Run:

```powershell
node --test tools/tests/dashboard-static.test.mjs
```

Expected: the new marker assertions fail against the old Phase0-oriented homepage.

- [ ] **Step 2: Replace homepage content with four decisions**

The first viewport contains:

```text
当前阶段：04 MIPI CSI-2 / D-PHY
当前目标：从 DTS endpoint 追到 D-PHY 和 Media Graph
下一步：进入阶段 04
完整路线：00 → 11
```

Use `data-course-current`, `data-course-objective`, `data-course-next`, and `data-course-route` so shared JavaScript fills the authoritative data.

- [ ] **Step 3: Move reference links into one secondary section**

Expose only `实验依据`, `专项笔记`, `开发环境`, `总览地图`, and `归档` below the course route.

- [ ] **Step 4: Update title and description**

Use `RK3568 Camera 学习驾驶舱` and remove Phase0 wording from the document title and top-level heading.

- [ ] **Step 5: Run the homepage tests and verify GREEN**

Run:

```powershell
node --test tools/tests/dashboard-static.test.mjs
```

Expected: all homepage tests pass.

### Task 5: Rebuild the learning-route hub

**Files:**
- Modify: `00-首页/学习驾驶舱/pages/learning-route.html`
- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `00-首页/学习驾驶舱/site.css`
- Test: `tools/tests/course-navigation.test.mjs`

- [ ] **Step 1: Add a failing route-page test**

Require one `data-course-route` container and forbid the old hard-coded 0–10 cards.

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test tools/tests/course-navigation.test.mjs
```

Expected: failure reports missing dynamic route container.

- [ ] **Step 3: Replace the old route grid**

Keep a concise header and one empty route container:

```html
<section class="course-route-page" data-course-route aria-label="RK3568 Camera 完整学习路线"></section>
```

- [ ] **Step 4: Render 12 ordered route cards**

Each card displays stage ID, title, objective, status, and a single “进入本阶段” action. Mark 00–03 complete, 04 current, and 05–11 planned.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
node --test tools/tests/course-navigation.test.mjs
```

Expected: route-page tests pass.

### Task 6: Update legacy site tests without weakening link safety

**Files:**
- Modify: `tools/tests/multipage-site.test.mjs`
- Modify: `tools/tests/dashboard-static.test.mjs`

- [ ] **Step 1: Replace old navigation labels**

Change expected primary labels from `当前任务 / 系统地图 / Phase0 / 专项笔记 / 实验依据` to `学习首页 / 完整路线 / 课程目录 / 资料与实验`.

- [ ] **Step 2: Keep static safety assertions**

Continue checking UTF-8, no direct Markdown links, resolvable local links/resources, skip links, focus styles, and classic deferred scripts.

- [ ] **Step 3: Run all tests**

Run:

```powershell
node --test tools/tests/*.test.mjs
```

Expected: all tests pass with zero failures.

### Task 7: Confirm classification and defer deletion safely

**Files:**
- Modify: `00-首页/学习驾驶舱/pages/archive.html`
- Reference: `docs/superpowers/specs/2026-08-07-rk3568-camera-course-site-design.md`

- [ ] **Step 1: Add the five archive candidates to the archive page**

List the generated SKILL page and four Excalidraw HTML pages as “隐藏的归档候选”，with the reason “zero inbound links / not course content”.

- [ ] **Step 2: Do not delete any candidate**

Record that deletion waits for a separate user-approved cleanup after the course navigation has been used.

- [ ] **Step 3: Verify all targets still exist**

Run:

```powershell
node --test tools/tests/multipage-site.test.mjs
```

Expected: active resource and link tests pass.

### Task 8: Full verification and visual QA

**Files:**
- Verify only; fix target files if a test or visual check exposes a defect.

- [ ] **Step 1: Run the complete test suite**

```powershell
node --test tools/tests/*.test.mjs
```

Expected: zero failed tests.

- [ ] **Step 2: Run the vault link checker**

```powershell
node tools/check-vault-links.mjs
```

Expected: zero broken wiki links, zero broken relative links, and zero active-to-archive links. Orphan warnings are reviewed against the five documented archive candidates.

- [ ] **Step 3: Inspect the homepage in the browser**

At desktop width, verify that the first viewport clearly shows current stage, goal, next action, and full route. At narrow width, verify that navigation and progress remain usable without hiding the next action.

- [ ] **Step 4: Inspect three representative pages**

Open stage 01, stage 04, and stage 11. Verify correct location text, progress state, previous/next links, and no duplicate injected components.

- [ ] **Step 5: Review the final diff**

Use `git diff --` only for the files in this plan. Confirm no unrelated user changes were staged, reverted, or overwritten.
