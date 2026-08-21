# RKISP 第 07 页流程图深化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在原第 07 页补齐 Async 建链、STREAMON 反向启动和 IRQ/DMA 回帧三条关键源码链。

**Architecture:** 保留现有三张 SVG，在同一 HTML 中增加五图锚点导航、Async 建链 SVG 和开流/回帧 SVG。测试用静态 HTML 断言保证关键函数、调用边界、证据边界和原有跳转不丢失。

**Tech Stack:** 静态 HTML、内嵌 SVG、Node.js `node:test`、现有课程 CSS/JS。

---

### Task 1: 用失败测试锁定深化要求

**Files:**
- Modify: `tools/tests/media-rkisp-page-diagram.test.mjs`
- Test: `tools/tests/media-rkisp-page-diagram.test.mjs`

- [ ] 增加断言：页面包含五个图锚点、`subdev_notifier_complete`、`rkisp_create_links`、`rkisp_v4l2_ioctl_ops`、`rkisp_vb2_ops`、`rkisp_start_streaming`、`rkisp_pipeline_set_stream`、`v4l2_subdev_call`、`vb2_buffer_done` 和 `VIDIOC_DQBUF`。
- [ ] 运行 `node --test tools/tests/media-rkisp-page-diagram.test.mjs`，确认因新内容尚不存在而失败。

### Task 2: 深化原第 07 页

**Files:**
- Modify: `04-项目/22-RKISP-从RAW到VideoNode.html`

- [ ] 给现有三张图增加锚点，并添加五图阅读导航。
- [ ] 增加图 4：D-PHY subdev 注册、RKISP notifier、Async `bound/complete` 与 `rkisp_create_links()`。
- [ ] 增加图 5：`VIDIOC_STREAMON` 经 V4L2/VB2/RKISP/subdev 反向启动，以及 IRQ/DMA 经 `vb2_buffer_done()` 返回 `DQBUF`。
- [ ] 每张新增图后附一段 Source Insight 搜索顺序和证据边界。
- [ ] 运行 Prettier，保持原页面格式。

### Task 3: 验证页面

**Files:**
- Test: `tools/tests/media-rkisp-page-diagram.test.mjs`
- Test: `tools/tests/stage07-source-comment-coverage.test.mjs`

- [ ] 运行目标测试，确认新增断言和第 07 章源码覆盖测试全部通过。
- [ ] 运行 `node tools/build-dashboard.mjs`、`node tools/check-vault-links.mjs` 和 `git diff --check`。
- [ ] 检查原页面本地链接、五图锚点和响应式 SVG；不提交、不 push。
