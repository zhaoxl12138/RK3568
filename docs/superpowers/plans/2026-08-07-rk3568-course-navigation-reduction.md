# RK3568 Course Navigation Reduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把课程站点收敛为五个全站入口，并为 12 个主线页面提供不重复的课程侧栏。

**Architecture:** `site.js` 继续作为课程表和共享导航的唯一数据源；导航和侧栏均由它在运行时生成，静态 HTML 只保留无 JavaScript 回退。`site.css` 负责桌面双栏和窄屏折叠，不改变课程正文。

**Tech Stack:** 静态 HTML、CSS、ES5 兼容 JavaScript、Node.js `node:test`、本地 `file://` 与 HTTP 浏览器验证。

---

## File Structure

- Modify: `tools/tests/course-navigation.test.mjs` — 五入口、课程侧栏和 Phase0 边界的行为契约。
- Modify: `tools/tests/multipage-site.test.mjs` — 更新全站共享导航的静态回退契约。
- Modify: `00-首页/学习驾驶舱/site.js` — 渲染五入口导航和主线课程侧栏。
- Modify: `00-首页/学习驾驶舱/site.css` — 桌面课程双栏、侧栏状态和窄屏折叠样式。
- Modify: `00-首页/学习驾驶舱/index.html` — 首页静态导航回退和参考区职责。
- Modify: `00-首页/学习驾驶舱/pages/learning-route.html` — 课程入口静态导航回退。
- Modify: `00-首页/学习驾驶舱/pages/system-map.html` — 明确唯一阶段 00 课程角色。
- Modify: `00-首页/学习驾驶舱/pages/phase0.html` — 明确可视化参考目录角色。
- Modify: active HTML cache-buster references — 让 `file://` 立即加载新版共享脚本和样式。

### Task 1: Lock the five-entry navigation contract

- [ ] **Step 1: Write the failing test**

在 `tools/tests/course-navigation.test.mjs` 中增加：

```js
test('shared navigation exposes exactly five primary learning destinations', () => {
  const { source } = loadCourseContract();
  for (const label of ['学习首页', '课程', '实验', '项目', '参考']) {
    assert.match(source, new RegExp(`label:\\s*['"]${label}['"]`, 'u'));
  }
  for (const staleLabel of ['完整路线', '课程目录', '资料与实验', '当前阶段']) {
    assert.doesNotMatch(source, new RegExp(`label:\\s*['"]${staleLabel}['"]`, 'u'));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/tests/course-navigation.test.mjs`

Expected: FAIL because the runtime still exposes “完整路线 / 课程目录 / 资料与实验 / 当前阶段”。

- [ ] **Step 3: Implement the minimal navigation data**

在 `site.js` 中把一级导航改为：

```js
var primaryItems = [
  { key: 'home', label: '学习首页', path: 'index.html' },
  { key: 'course', label: '课程', path: 'pages/learning-route.html' },
  { key: 'experiment', label: '实验', path: 'pages/evidence.html' },
  { key: 'project', label: '项目', path: 'pages/project.html' },
];
```

“参考”使用一个 `details` 菜单，包含总览补充、专项笔记、开发环境、可视化参考和归档。删除独立课程菜单和当前阶段顶栏按钮。

- [ ] **Step 4: Update static fallbacks and run focused tests**

修改 `index.html` 与 `learning-route.html` 的静态回退导航，使 JavaScript 未执行时仍显示五入口。

Run: `node --test tools/tests/course-navigation.test.mjs tools/tests/multipage-site.test.mjs`

Expected: PASS。

### Task 2: Replace top progress with a mainline course sidebar

- [ ] **Step 1: Write the failing sidebar tests**

在 `tools/tests/course-navigation.test.mjs` 中增加：

```js
test('mainline context renders one 00-11 course sidebar instead of a top progress strip', () => {
  const { source } = loadCourseContract();
  assert.match(source, /function\s+renderCourseSidebar\s*\(/u);
  assert.match(source, /course-sidebar/u);
  assert.match(source, /course-lesson-layout/u);
  assert.doesNotMatch(source, /progress\.className\s*=\s*['"]course-progress['"]/u);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/tests/course-navigation.test.mjs`

Expected: FAIL because `renderCourseSidebar()` and the lesson layout do not exist。

- [ ] **Step 3: Implement sidebar generation**

在 `site.js` 中新增 `renderCourseSidebar(container, viewedStage, siteRoot)`，复用 `COURSE_STAGES` 和 `createCourseStageLink()`：

```js
function renderCourseSidebar(container, viewedStage, siteRoot) {
  var list = document.createElement('nav');
  list.className = 'course-sidebar';
  list.setAttribute('aria-label', '00–11 课程目录');
  for (var i = 0; i < COURSE_STAGES.length; i += 1) {
    var item = createCourseStageLink(COURSE_STAGES[i], siteRoot, 'course-sidebar__item');
    item.classList.add(courseStageStatus(COURSE_STAGES[i]));
    if (viewedStage.id === COURSE_STAGES[i].id) {
      item.classList.add('is-viewing');
      item.setAttribute('aria-current', 'step');
    }
    list.appendChild(item);
  }
  container.appendChild(list);
}
```

调整 `renderCourseContext()`：顶部只保留当前位置和上一课/下一课；把页面原有 `main` 内容包入 `.course-lesson-layout`，侧栏与 `.course-lesson-content` 并列；参考页面不执行包装。

- [ ] **Step 4: Add responsive CSS**

在 `site.css` 中加入：

```css
.course-lesson-layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 1.25rem; align-items: start; }
.course-sidebar { position: sticky; top: 5.5rem; display: grid; gap: .4rem; }
.course-sidebar__item { display: grid; grid-template-columns: 2.2rem 1fr; gap: .55rem; padding: .65rem; border: 1px solid var(--site-line); border-radius: 12px; }
@media (max-width: 900px) {
  .course-lesson-layout { display: block; }
  .course-sidebar { position: static; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 1rem; }
}
@media (max-width: 560px) {
  .course-sidebar { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Run focused tests**

Run: `node --test tools/tests/course-navigation.test.mjs tools/tests/dashboard-static.test.mjs tools/tests/multipage-site.test.mjs`

Expected: PASS。

### Task 3: Separate course overview from Phase0 references

- [ ] **Step 1: Write the failing role-boundary test**

在 `tools/tests/course-navigation.test.mjs` 中增加：

```js
test('system map is stage 00 while Phase0 stays reference-only', () => {
  const systemMap = read('00-首页/学习驾驶舱/pages/system-map.html');
  const phase0 = read('00-首页/学习驾驶舱/pages/phase0.html');
  assert.match(systemMap, /阶段 00|系统总览/u);
  assert.match(phase0, /可视化参考/u);
  assert.doesNotMatch(phase0, /data-course-stage=["']00["']/u);
});
```

- [ ] **Step 2: Run test to verify it fails for the missing explicit role text**

Run: `node --test tools/tests/course-navigation.test.mjs`

Expected: FAIL on one or both explicit role labels。

- [ ] **Step 3: Make the role labels explicit**

- `system-map.html` 标题与导语明确“阶段 00 · 系统总览”，只保留核心地图和进入阶段 01 的学习入口。
- `phase0.html` 标题与导语明确“可视化参考”，只列数据流动画、Camera 配置、驱动层和全系统图。
- 首页参考区将 Phase0 链接命名为“可视化参考”，不再命名为“总览地图”。

- [ ] **Step 4: Run focused tests**

Run: `node --test tools/tests/course-navigation.test.mjs tools/tests/dashboard-static.test.mjs`

Expected: PASS。

### Task 4: Refresh assets, verify, commit, and publish

- [ ] **Step 1: Refresh cache-busters on active HTML**

计算 `site.js` 与 `site.css` 的短 SHA256，并替换 45 个有效 HTML 中对应的 `?v=` 参数，不改页面正文。

- [ ] **Step 2: Run the full automated suite**

Run: `node --test tools/tests/*.test.mjs`

Expected: 0 failures。

Run: `node tools/check-vault-links.mjs`

Expected: Broken wikilinks 0、Broken relative links 0、Active-to-archive links 0。

- [ ] **Step 3: Browser verification**

在桌面宽度验证首页与阶段 04：五入口、侧栏 12 项、唯一当前高亮、上一课/下一课、无横向溢出。在 390px 宽度验证导航和侧栏不产生横向滚动。

- [ ] **Step 4: Commit and push**

```bash
git add <changed site and test files>
git commit -m "收敛课程导航与主线侧栏"
git push
```

Expected: PR #1 更新到最新提交。
