# RK3568 Learning State Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the RK3568 learning site accurately show current stage, acceptance entry points, and evidence grouped by stage.

**Architecture:** Extend the existing vault-data generator with normalized stage metadata. Reuse the shared site shell and classic scripts to render a read-only status strip and grouped evidence cards. Obsidian remains the source of truth.

**Tech Stack:** Node.js ESM generator, Node test runner, static HTML/CSS/JavaScript.

---

### Task 1: Normalize stage and evidence metadata

**Files:**
- Modify: `tools/build-dashboard.mjs`
- Test: `tools/tests/build-dashboard.test.mjs`

- [ ] Add failing tests for punctuation/spacing variants of stage labels and evidence stage keys.
- [ ] Run the focused generator tests and confirm failure.
- [ ] Implement one normalization function that returns numeric stage key plus display label, preserving unknown input.
- [ ] Make generated stage rows and evidence entries expose normalized metadata and warnings only for truly unknown values.
- [ ] Run focused tests, then the full suite.

### Task 2: Add shared current-state presentation

**Files:**
- Modify: `00-首页/学习驾驶舱/site.js`
- Modify: `00-首页/学习驾驶舱/site.css`
- Modify: `00-首页/学习驾驶舱/index.html`
- Modify: `00-首页/学习驾驶舱/pages/learning-route.html`
- Modify: `00-首页/学习驾驶舱/pages/system-map.html`
- Modify: `00-首页/学习驾驶舱/pages/phase0.html`
- Test: `tools/tests/multipage-site.test.mjs`

- [ ] Add failing static contracts for a shared current-state strip and current stage/task data attributes.
- [ ] Implement the smallest shared renderer and styles, using generated data only.
- [ ] Add phase cards' acceptance and Obsidian record links without duplicating source content.
- [ ] Verify keyboard/focus and narrow-screen contracts.

### Task 3: Group evidence by stage and show data quality

**Files:**
- Modify: `00-首页/学习驾驶舱/pages/evidence.html`
- Modify: `00-首页/学习驾驶舱/site.css`
- Test: `tools/tests/multipage-site.test.mjs`

- [ ] Add failing contracts for stage groups, counts, unknown evidence, and missing evidence notices.
- [ ] Implement grouped rendering with defensive media handling and links back to the source record.
- [ ] Verify empty, unknown, image, video, and missing-resource states.

### Task 4: Generate, verify, and integrate

**Files:**
- Modify: `00-首页/学习驾驶舱/generated/vault-data.js`

- [ ] Run the generator against the current vault state.
- [ ] Run `node --test tools/tests/*.test.mjs`, all JS syntax checks, and `git diff --check`.
- [ ] Perform a browser smoke check for desktop and 390px viewport.
- [ ] Review the final diff and merge the isolated branch back to `main`, preserving existing user changes.
