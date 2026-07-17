# Markdown 笔记 HTML 化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate styled HTML reading pages from important Markdown notes and route web navigation to those pages.

**Architecture:** Extend the existing dashboard build script with a small deterministic Markdown renderer and a stable note-path map. The generated note pages live beside the dashboard pages, reuse the existing shell, and expose both web and Obsidian/raw-source links.

**Tech Stack:** Node.js ESM, Node built-in `fs/promises` and `path`, classic HTML/CSS/JavaScript, Node test runner.

---

### Task 1: Add failing renderer and build-contract tests

**Files:**
- Modify: `tools/tests/build-dashboard.test.mjs`
- Modify: `tools/tests/multipage-site.test.mjs`

- [ ] Add tests for escaped headings/code, tables, wikilinks, generated `webPath`, and warning on a missing note.
- [ ] Add integration assertions for the OpenCV generated page, shared shell assets, and no direct `.md` links in the notes page's note cards.
- [ ] Run `node --test tools/tests/build-dashboard.test.mjs tools/tests/multipage-site.test.mjs` and confirm the new tests fail because the renderer and generated pages do not exist.

### Task 2: Implement deterministic Markdown-to-HTML generation

**Files:**
- Modify: `tools/build-dashboard.mjs`

- [ ] Add pure helpers for HTML escaping, URL/path encoding, inline Markdown, block rendering, stable note slugs, and the shared note-page template.
- [ ] Collect unique Markdown sources from domain links, quick links, route evidence links, and acceptance entries.
- [ ] Add `webPath` to generated link records and emit all note pages under `00-首页/学习驾驶舱/pages/notes/`.
- [ ] Keep original `filePath` and `url`; if a source is missing, omit its page and append a deterministic warning.
- [ ] Run focused tests and confirm they pass.

### Task 3: Route existing web entrances to generated pages

**Files:**
- Modify: `00-首页/学习驾驶舱/pages/notes.html`
- Modify: `00-首页/学习驾驶舱/pages/learning-route.html`
- Modify: `00-首页/学习驾驶舱/index.html`
- Modify: `00-首页/学习驾驶舱/site.js`

- [ ] Replace note-card and route evidence/Obsidian display links with generated web paths while preserving task-board `.md` links.
- [ ] Add a shared generated-note-page navigation contract and make the “查看原始 Markdown” link explicit.
- [ ] Run the multipage tests and inspect relative link resolution.

### Task 4: Generate artifacts and verify the complete site

**Files:**
- Generated: `00-首页/学习驾驶舱/generated/vault-data.js`
- Generated: `00-首页/学习驾驶舱/pages/notes/*.html`

- [ ] Run `node tools/build-dashboard.mjs` from the repository root.
- [ ] Run `node --test tools/tests/*.test.mjs` and all JavaScript syntax checks.
- [ ] Run `git diff --check` and verify the OpenCV file path opens as HTML under `pages/notes/`.
- [ ] Commit the implementation and generated pages as one feature commit.
