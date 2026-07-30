# RK3568 Web Encoding And Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate raw Markdown web entrances and give every RK3568 learning page one consistent, responsive global navigation bar.

**Architecture:** Extend the existing static generator so it recursively discovers HTML-to-Markdown links across the vault, generates stable HTML note pages, and rewrites every in-scope link. Keep navigation content centralized in the classic `site.js` runtime so existing static pages and generated pages share one source of truth while retaining local page-sequence controls.

**Tech Stack:** Node.js ESM generator, Node built-in test runner, classic browser JavaScript, static HTML/CSS, Obsidian Markdown.

---

### Task 1: Reproduce The Broken Markdown Entrance

**Files:**
- Modify: `tools/tests/build-dashboard.test.mjs`
- Modify: `tools/tests/multipage-site.test.mjs`

- [ ] **Step 1: Write a failing generator test**

Add a temporary `04-项目/diagram.html` that links `../06-任务/source.md`, run `writeDashboardData()`, then assert:

```js
const rewritten = await readFile(path.join(vaultDir, '04-项目/diagram.html'), 'utf8');
assert.doesNotMatch(rewritten, /\.md(?:#|["'])/u);
assert.match(rewritten, /\.\.\/00-首页\/学习驾驶舱\/pages\/notes\/06-任务--source\.html/u);
await access(path.join(
  vaultDir,
  '00-首页/学习驾驶舱/pages/notes/06-任务--source.html',
));
```

- [ ] **Step 2: Add a repository-wide static contract**

Make the multipage test recursively inspect active HTML and fail when an anchor links to `.md`, when UTF-8 replacement characters exist, or when charset is missing:

```js
assert.doesNotMatch(html, /\uFFFD/u);
assert.match(html.slice(0, 1024), /<meta\b[^>]*charset=["']?utf-8/iu);
assert.doesNotMatch(html, /<a\b[^>]*href=["'][^"']+\.md(?:#[^"']*)?["']/iu);
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```powershell
node --test tools/tests/build-dashboard.test.mjs tools/tests/multipage-site.test.mjs
```

Expected: failure reports the `04-项目` Markdown link and current Phase0/IMX415 `.md` links.

### Task 2: Fix Discovery, Generation, And Rewriting

**Files:**
- Modify: `tools/build-dashboard.mjs`
- Test: `tools/tests/build-dashboard.test.mjs`

- [ ] **Step 1: Add recursive file collection**

Implement a focused helper that skips `.git`, `.obsidian`, `tmp`, generated note pages, and archive-only surfaces while returning HTML files from the dashboard and `04-项目`.

- [ ] **Step 2: Use the same collection boundary for discovery and rewriting**

Replace the current first-level `readdir()` logic in `linkedMarkdownPaths()` and `rewriteSiteMarkdownLinks()` with the shared collector. Preserve the special mapping:

```js
00-首页/00-RK3568学习主入口.md
-> 00-首页/学习驾驶舱/index.html
```

- [ ] **Step 3: Generate actual HTML images**

Extend `renderInline()` so Markdown image syntax emits:

```html
<img src="..." alt="...">
```

Escape both attributes and keep ordinary Markdown links unchanged.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
node --test tools/tests/build-dashboard.test.mjs
```

Expected: all generator tests pass and the new external-page rewrite test is green.

### Task 3: Centralize And Improve Global Navigation

**Files:**
- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `00-首页/学习驾驶舱/site.css`
- Modify: `tools/tests/dashboard-static.test.mjs`
- Modify: `tools/tests/multipage-site.test.mjs`

- [ ] **Step 1: Write failing navigation tests**

Require `site.js` to expose a navigation renderer and the labels/targets for:

```text
首页、当前任务、学习路线、系统地图、Phase0、专项笔记、实验依据
```

Require CSS contracts for an active link, current-stage chip, auxiliary menu, and narrow-screen horizontal navigation.

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
node --test tools/tests/dashboard-static.test.mjs tools/tests/multipage-site.test.mjs
```

Expected: navigation renderer and new CSS contracts are absent.

- [ ] **Step 3: Implement `renderSiteNavigation()`**

Derive the dashboard root from the loaded `site.js` URL, replace the contents of every `[data-site-nav]`, and generate stable links with URL objects so HTTP and `file://` both work. Mark the current section from `location.pathname`; populate the current-stage chip from `window.RK3568_VAULT_DATA`.

- [ ] **Step 4: Add responsive navigation CSS**

Keep desktop navigation fixed, constrain the link row, and use horizontal scrolling below 760px. Use a native `<details>` element for environment, project, archive, and Obsidian auxiliary links.

- [ ] **Step 5: Run navigation tests and verify GREEN**

Run:

```powershell
node --test tools/tests/dashboard-static.test.mjs tools/tests/multipage-site.test.mjs
```

Expected: all navigation contracts pass.

### Task 4: Rebuild And Audit The Complete Site

**Files:**
- Regenerate: `00-首页/学习驾驶舱/generated/vault-data.js`
- Regenerate: `00-首页/学习驾驶舱/pages/notes/*.html`
- Rewrite in place: `04-项目/*.html`

- [ ] **Step 1: Run the generator**

```powershell
node tools/build-dashboard.mjs .
```

- [ ] **Step 2: Run the complete automated suite**

```powershell
node --test tools/tests/*.mjs
node tools/check-vault-links.mjs --root .
```

Expected: zero failed tests and zero active broken links.

- [ ] **Step 3: Run a byte and content audit**

Recursively verify `.md`, `.html`, `.js`, `.mjs`, and `.css` with fatal UTF-8 decoding; assert no generated HTML contains `\uFFFD`, no active HTML lacks charset, and no anchor still targets `.md`.

### Task 5: Browser Verification

**Files:**
- No source changes unless verification reveals a reproducible defect.

- [ ] **Step 1: Reload the local dashboard**

Verify desktop navigation and current-stage content on:

```text
/00-首页/学习驾驶舱/index.html
/04-项目/10-Phase0-可视化总入口.html
/04-项目/16-IMX415-三层驱动调用流程.html
/00-首页/学习驾驶舱/pages/notes/06-任务--RK3568-IMX415-SDK源码对照.html
```

- [ ] **Step 2: Verify link behavior**

Navigate from the IMX415 diagram to the generated SDK note and confirm the browser remains on an `.html` URL with readable Chinese.

- [ ] **Step 3: Verify narrow-screen navigation**

Set a narrow viewport, confirm navigation does not cover content and remains keyboard/touch accessible, then reset the viewport.

- [ ] **Step 4: Finalize browser tabs**

Keep one dashboard tab as the deliverable and close duplicate/intermediate tabs.
