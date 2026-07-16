# 当前阶段直达入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard start action jump directly to the current learning stage and expose a clear action on that stage card.

**Architecture:** Keep the existing classic-script static site. `site.js` owns data-driven current-stage link updates; HTML owns stable stage anchors and the visible button. The fallback remains a normal learning-route URL when generated data has no current stage.

**Tech Stack:** HTML, CSS, classic browser JavaScript, Node.js built-in test runner.

---

### Task 1: Add failing navigation contracts

**Files:**
- Modify: `tools/tests/multipage-site.test.mjs`

- [ ] **Step 1: Add assertions for the dynamic entry contract**

Assert that the homepage contains `data-current-stage-link`, the route contains eleven `id="stage-{id}"` anchors, and each stage card has a `data-stage-start` link.

- [ ] **Step 2: Run the focused test**

Run `node --test tools/tests/multipage-site.test.mjs`; it should fail because the new attributes do not exist yet.

### Task 2: Implement current-stage direct navigation

**Files:**
- Modify: `00-首页/学习驾驶舱/index.html`
- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `00-首页/学习驾驶舱/pages/learning-route.html`

- [ ] **Step 1: Add the homepage link marker**

Add `data-current-stage-link` to the “从当前阶段开始” hero action and leave its initial fallback as `pages/learning-route.html`.

- [ ] **Step 2: Add stable stage anchors and start links**

Give each route card `id="stage-{id}"` and add one `data-stage-start` link whose destination is `#stage-{id}` on the same page.

- [ ] **Step 3: Update links from generated state**

In `renderSiteState`, collect `[data-current-stage-link]` and `[data-stage-start]`; set the homepage link to `pages/learning-route.html#stage-{currentStageId}` when a valid current stage exists, otherwise use `pages/learning-route.html`. Add `aria-current="step"` to the current card’s start link and remove it from non-current cards.

- [ ] **Step 4: Run focused tests and syntax checks**

Run `node --test tools/tests/multipage-site.test.mjs` and `node --check "00-首页/学习驾驶舱/site.js"`.

### Task 3: Final verification

**Files:**
- No additional files.

- [ ] **Step 1: Run all tests**

Run `node --test tools/tests/*.test.mjs`; expect 76 or more passing tests and zero failures.

- [ ] **Step 2: Run quality checks**

Run JavaScript syntax checks for all `.js` and `.mjs` files and `git diff --check`.

- [ ] **Step 3: Commit**

Run `git add` for the changed HTML, JavaScript, and test files, then commit with `feat: link dashboard to current learning stage`.
