# 阶段 08：V4L2 / VB2 用户态取流整理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将阶段 08 重构为从应用 `fd` 到 `DQBUF` 返回已完成帧的连续源码学习入口。

**Architecture:** 网页用三张职责单一的 SVG 图表达注册对象、取流闭环与单 buffer 状态机；四篇 Markdown 分别承担索引、ioctl 生命周期、VB2/DMA 数据链和调试验收。HTML 只给总图与锚点，细节由源码陪读承担。

**Tech Stack:** 静态 HTML/CSS/SVG、Obsidian Markdown、Node.js `node:test`、Vault 链接检查脚本。

---

### Task 1: 固定阶段 08 网页语义契约

**Files:**
- Modify: `tools/tests/media-rkisp-page-diagram.test.mjs`
- Modify: `04-项目/23-V4L2-VB2用户态取流.html`

- [ ] **Step 1: 写入失败测试**

在 `media-rkisp-page-diagram.test.mjs` 新增独立测试，要求页面含 `v4l2-registration`、`v4l2-streaming`、`v4l2-buffer-state` 三个锚点，并含：

```js
"vdev-&gt;fops = &amp;rkisp_fops"
"vdev-&gt;ioctl_ops = &amp;rkisp_v4l2_ioctl_ops"
"vdev-&gt;queue = &amp;node-&gt;buf_queue"
"DEQUEUED", "PREPARED", "QUEUED", "ACTIVE", "DONE", "ERROR"
"vb2_buffer_done(DONE)"
"STREAMON 返回 0 不等于已有帧"
```

- [ ] **Step 2: 验证失败**

Run: `node --test tools/tests/media-rkisp-page-diagram.test.mjs`

Expected: 新增阶段 08 测试因旧页面缺少锚点或状态图语义失败。

- [ ] **Step 3: 最小化重构网页**

修改 `23-V4L2-VB2用户态取流.html`：图 1 表达注册期三条赋值边与运行期回调；图 2 严格表达 `open → S_FMT → REQBUFS/MMAP → QBUF → STREAMON → vb2_core_streamon → rkisp_start_streaming → frame-end IRQ → vb2_buffer_done(DONE) → DQBUF`；图 3 表达 `DEQUEUED → PREPARED → QUEUED → ACTIVE → DONE/ERROR → DEQUEUED`。实线仅表示调用，虚线仅表示对象关系，绿色仅表示帧完成事件；不使用内部滚动条。

- [ ] **Step 4: 验证通过**

Run: `node --test tools/tests/media-rkisp-page-diagram.test.mjs`

Expected: 全部测试通过。

### Task 2: 压缩并校正源码陪读分工

**Files:**
- Modify: `02-源码陪读/08-V4L2用户态取流/00-源码陪读索引.md`
- Modify: `02-源码陪读/08-V4L2用户态取流/01-生命周期.md`
- Modify: `02-源码陪读/08-V4L2用户态取流/02-对象与数据链.md`
- Modify: `02-源码陪读/08-V4L2用户态取流/03-调试与面试验收.md`
- Test: `tools/tests/stage08-source-comment-coverage.test.mjs`

- [ ] **Step 1: 写入失败测试**

在 `stage08-source-comment-coverage.test.mjs` 新增断言：

```js
assert.match(index, /先看 01，再看 02，最后做 03/u);
assert.match(lifecycle, /注册时挂表，运行时查表/u);
assert.match(dataChain, /应用拥有|驱动\/DMA 拥有|已完成待应用领取/u);
assert.match(acceptance, /DQBUF 超时/u);
```

- [ ] **Step 2: 验证失败**

Run: `node --test tools/tests/stage08-source-comment-coverage.test.mjs`

Expected: 新增章节职责断言失败。

- [ ] **Step 3: 最小化改写四篇笔记**

保留关键源码定位、正确答案区和证据边界；按如下边界重排已有内容：

```text
00：总链、三类框架、最短搜索表、阅读顺序
01：video_device、fops/ioctl_ops、open、video_ioctl2、两级 ioctl 分发
02：vb2_queue、状态机、buf_queue、IRQ、mi_frame_end、buffer_done、DQBUF
03：板端命令、DQBUF 超时逆向排查、NV12 多平面验证、面试验收
```

补充“直接调用 / 函数指针回调 / 中断事件”固定说明，删除重复的阶段 07 初始化叙述。

- [ ] **Step 4: 验证通过**

Run: `node --test tools/tests/stage08-source-comment-coverage.test.mjs`

Expected: 阶段 08 覆盖测试全部通过。

### Task 3: 课程连接与回归验证

**Files:**
- Modify: `04-项目/23-V4L2-VB2用户态取流.html`

- [ ] **Step 1: 保留课程跳转与 Obsidian 索引链接**

保留 `22-RKISP-从RAW到VideoNode.html`、完整路线、阶段 09 和 `02-源码陪读/08-V4L2用户态取流/00-源码陪读索引` 的既有链接。

- [ ] **Step 2: 运行回归检查**

Run: `node --test tools/tests/media-rkisp-page-diagram.test.mjs`

Run: `node --test tools/tests/stage08-source-comment-coverage.test.mjs`

Run: `node tools/check-vault-links.mjs`

Run: `git diff --check`

Expected: 测试全绿、无死链、`git diff --check` 无错误；既有行尾转换提示不作为失败。

- [ ] **Step 3: 不提交变更**

保留工作区修改供用户审阅；不执行 `git commit` 或 `git push`。
