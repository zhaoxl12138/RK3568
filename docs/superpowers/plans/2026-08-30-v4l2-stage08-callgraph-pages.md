# 阶段 08 V4L2 函数调用链专题网页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把阶段 08 从单一总览页扩展为“总览 + 初始化 + 取流闭环 + 100 帧稳定性”四页体系，让用户能沿真实函数调用、框架回调和 Buffer 数据流追代码。

**Architecture:** 保留 `23-V4L2-VB2用户态取流.html` 作为阶段入口，新增三个职责单一的静态 HTML 专题页。新页面共用一个 CSS 文件，桌面端显示 SVG 思维图，窄屏显示等价的纵向调用链；专用 Node 测试锁定文件、导航、函数关系、线型语义、源码链接和响应式结构。

**Tech Stack:** 原生 HTML5、CSS3、内联 SVG、Node.js `node:test`、现有 Markdown/链接检查脚本；本地 `file:///` 直接打开，不引入 React、Vue 或第三方运行时。

**User constraint:** 本计划实施过程中不自动 `git commit`、不 push；每个任务以测试通过和 diff 审查作为检查点。

---

## 文件结构

**Create**

- `04-项目/assets/v4l2-callgraph.css`：三个专题页共用的视觉系统、SVG 语义和窄屏纵向调用链。
- `04-项目/24-V4L2用户程序初始化与Buffer映射.html`：Day1–Day3，应用初始化、ioctl 分发和 mmap 对象关系。
- `04-项目/25-V4L2-QBUF到DQBUF取流闭环.html`：Day4–Day5，QBUF/STREAMON/DQBUF 与 IRQ 完成链。
- `04-项目/26-V4L2连续100帧统计与资源清理.html`：Day6，100 帧统计、双编号和统一 cleanup。
- `tools/tests/v4l2-stage08-topic-pages.test.mjs`：专题页契约、导航、函数关系、视觉语义与证据链接测试。

**Modify**

- `04-项目/23-V4L2-VB2用户态取流.html`：增加三个专题入口、Day6 实验入口和阶段内阅读导航。
- `tools/tests/media-rkisp-page-diagram.test.mjs`：保留已有阶段 08 总览约束，并增加专题入口存在性约束。

**Read-only evidence**

- `05-实验与证据/V4L2用户态取流/Day1-设备能力与格式枚举/query_device.c`
- `05-实验与证据/V4L2用户态取流/Day2-设置NV12格式/set_format.c`
- `05-实验与证据/V4L2用户态取流/Day3-申请与映射Buffer/map_buffers.c`
- `05-实验与证据/V4L2用户态取流/Day4-QBUF与连续取帧/capture_10_frames.c`
- `05-实验与证据/V4L2用户态取流/Day5-保存NV12并验证图像/capture_one_frame.c`
- `05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture_100_frames.c`
- `05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture.log`
- `05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/fps-result.txt`

---

### Task 1: 用失败测试锁定三页专题契约

**Files:**

- Create: `tools/tests/v4l2-stage08-topic-pages.test.mjs`
- Modify: `tools/tests/media-rkisp-page-diagram.test.mjs`

- [ ] **Step 1: 写页面存在性、标题与连续导航测试**

创建测试辅助函数和页面清单：

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const vaultRoot = path.resolve(testDir, '..', '..');
const projectDir = path.join(vaultRoot, '04-项目');

async function readPage(fileName) {
  return readFile(path.join(projectDir, fileName), 'utf8');
}

const pages = [
  ['24-V4L2用户程序初始化与Buffer映射.html', '初始化与 Buffer 映射'],
  ['25-V4L2-QBUF到DQBUF取流闭环.html', 'QBUF 到 DQBUF'],
  ['26-V4L2连续100帧统计与资源清理.html', '连续 100 帧'],
];

test('阶段08包含三个可独立打开的专题页', async () => {
  for (const [fileName, title] of pages) {
    const html = await readPage(fileName);
    assert.match(html, /<!doctype html>/iu);
    assert.match(html, /<meta charset="utf-8">/iu);
    assert.match(html, new RegExp(title, 'u'));
    assert.match(html, /assets\/v4l2-callgraph\.css/u);
  }
});

test('阶段08按23到26连续导航', async () => {
  const overview = await readPage('23-V4L2-VB2用户态取流.html');
  const page24 = await readPage(pages[0][0]);
  const page25 = await readPage(pages[1][0]);
  const page26 = await readPage(pages[2][0]);

  assert.match(overview, /24-V4L2用户程序初始化与Buffer映射\.html/u);
  assert.match(page24, /23-V4L2-VB2用户态取流\.html/u);
  assert.match(page24, /25-V4L2-QBUF到DQBUF取流闭环\.html/u);
  assert.match(page25, /24-V4L2用户程序初始化与Buffer映射\.html/u);
  assert.match(page25, /26-V4L2连续100帧统计与资源清理\.html/u);
  assert.match(page26, /25-V4L2-QBUF到DQBUF取流闭环\.html/u);
  assert.match(page26, /23-V4L2-VB2用户态取流\.html/u);
});
```

- [ ] **Step 2: 写函数关系、视觉语义和窄屏替代结构测试**

在同一测试文件中增加：

```js
test('专题页明确区分直接调用、框架回调和数据流', async () => {
  for (const [fileName] of pages) {
    const html = await readPage(fileName);
    assert.match(html, /直接调用/u);
    assert.match(html, /框架回调/u);
    assert.match(html, /数据流|Buffer 所有权/u);
    assert.match(html, /class="edge direct"/u);
    assert.match(html, /class="edge callback"/u);
    assert.match(html, /class="edge data"/u);
    assert.match(html, /class="mobile-flow"/u);
    assert.doesNotMatch(html, /overflow:\s*(auto|scroll)/iu);
  }
});

test('专题24包含初始化、分发和映射关系', async () => {
  const html = await readPage(pages[0][0]);
  for (const symbol of [
    'set_format()', 'request_buffers()', 'map_buffers()',
    'VIDIOC_S_FMT', 'VIDIOC_REQBUFS', 'VIDIOC_QUERYBUF',
    'video_ioctl2()', '__video_do_ioctl()',
    'rkisp_s_fmt_vid_cap_mplane()', 'mmap()',
  ]) assert.match(html, new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('专题25包含开流控制链和帧完成链', async () => {
  const html = await readPage(pages[1][0]);
  for (const symbol of [
    'queue_all_buffers()', 'queue_one_buffer()', 'start_streaming()',
    'capture_frames()', 'poll()', 'VIDIOC_DQBUF',
    'vb2_ioctl_streamon()', 'vb2_core_streamon()',
    'rkisp_start_streaming()', 'rkisp_mi_v21_isr()',
    'vb2_buffer_done(DONE)',
  ]) assert.match(html, new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('专题26使用真实100帧数据并展示cleanup', async () => {
  const html = await readPage(pages[2][0]);
  for (const evidence of [
    'captured frames', '100', '30.000', 'sequence', '2 → 101',
    'sequence gap', 'poll timeout', '12441600',
    'update_stats()', 'print_summary()', 'cleanup_capture()',
    'VIDIOC_STREAMOFF', 'VIDIOC_REQBUFS(count=0)',
  ]) assert.match(html, new RegExp(evidence.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});
```

- [ ] **Step 3: 在现有总览测试中增加三个专题入口约束**

在 `tools/tests/media-rkisp-page-diagram.test.mjs` 的阶段 08 测试中加入：

```js
for (const topicPage of [
  '24-V4L2用户程序初始化与Buffer映射.html',
  '25-V4L2-QBUF到DQBUF取流闭环.html',
  '26-V4L2连续100帧统计与资源清理.html',
]) assert.match(html, new RegExp(topicPage.replaceAll('.', '\\.'), 'u'));
```

- [ ] **Step 4: 运行测试并确认因页面不存在而失败**

Run:

```powershell
node --test tools/tests/v4l2-stage08-topic-pages.test.mjs tools/tests/media-rkisp-page-diagram.test.mjs
```

Expected: 新测试失败，错误明确指向缺失的 `24/25/26` 页面或缺失专题链接；已有阶段 06–08 测试不得出现语法错误。

- [ ] **Step 5: 检查点（不提交）**

Run:

```powershell
git diff --check -- tools/tests/v4l2-stage08-topic-pages.test.mjs tools/tests/media-rkisp-page-diagram.test.mjs
```

Expected: exit code `0`。

---

### Task 2: 建立专题页共享视觉系统

**Files:**

- Create: `04-项目/assets/v4l2-callgraph.css`
- Test: `tools/tests/v4l2-stage08-topic-pages.test.mjs`

- [ ] **Step 1: 创建颜色、布局和线型基础样式**

CSS 必须包含以下语义类，三个页面只能用这些类表达关系：

```css
:root {
  --bg: #080c14;
  --panel: #101722;
  --border: rgba(255, 255, 255, .13);
  --text: #c9d2dc;
  --bright: #f1f6fa;
  --direct: #8498aa;
  --callback: #aa8be9;
  --data: #64a66f;
  --user: #288d98;
  --vb2: #765cc4;
  --rkisp: #a56a20;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.7 Inter, "Noto Sans SC", "Microsoft YaHei", sans-serif; }
main { max-width: 1320px; margin: auto; padding: 28px 22px 68px; }
.diagram { border: 1px solid var(--border); border-radius: 22px; background: var(--panel); padding: 18px; }
.diagram svg { display: block; width: 100%; height: auto; }
.node-title { fill: var(--bright); font-size: 18px; font-weight: 700; text-anchor: middle; }
.node-note { fill: #a5b5c3; font-size: 16px; text-anchor: middle; }
.edge.direct { fill: none; stroke: var(--direct); stroke-width: 2.2; }
.edge.callback { fill: none; stroke: var(--callback); stroke-width: 2.2; stroke-dasharray: 8 6; }
.edge.data { fill: none; stroke: var(--data); stroke-width: 2.6; }
.mobile-flow { display: none; }
```

- [ ] **Step 2: 增加统一卡片、图例、源码表和导航样式**

```css
.topic-map, .card-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.topic-card, .plain-card, .source-card { border: 1px solid var(--border); border-radius: 16px; background: rgba(255, 255, 255, .035); padding: 17px; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; margin: 12px 0; }
.legend-line { display: inline-block; width: 34px; margin-right: 8px; border-top: 2px solid var(--direct); vertical-align: middle; }
.legend-line.callback { border-top-style: dashed; border-color: var(--callback); }
.legend-line.data { border-color: var(--data); }
.stage-nav { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.source-table { width: 100%; border-collapse: collapse; }
.source-table th, .source-table td { border: 1px solid var(--border); padding: 10px 12px; text-align: left; vertical-align: top; }
```

- [ ] **Step 3: 增加不依赖内部横向滚动的窄屏替代结构**

```css
@media (max-width: 768px) {
  main { padding: 20px 12px 48px; }
  .topic-map, .card-grid { grid-template-columns: 1fr; }
  .diagram { display: none; }
  .mobile-flow { display: grid; gap: 10px; }
  .mobile-step { position: relative; border: 1px solid var(--border); border-radius: 14px; padding: 14px; background: rgba(255, 255, 255, .035); }
  .mobile-step + .mobile-step::before { content: "↓"; position: absolute; top: -22px; left: 50%; color: var(--direct); font-weight: 700; }
  .source-table, .source-table tbody, .source-table tr, .source-table th, .source-table td { display: block; width: 100%; }
}
```

- [ ] **Step 4: 扩展测试验证 CSS 不包含内部滚动并具有窄屏替代**

在专题页测试中读取 CSS，断言：

```js
const css = await readFile(path.join(projectDir, 'assets', 'v4l2-callgraph.css'), 'utf8');
assert.match(css, /@media\s*\(max-width:\s*768px\)/u);
assert.match(css, /\.mobile-flow\s*\{[^}]*display:\s*none/isu);
assert.match(css, /\.diagram\s*\{\s*display:\s*none/isu);
assert.doesNotMatch(css, /overflow(?:-x)?:\s*(auto|scroll)/iu);
```

- [ ] **Step 5: 运行专题测试，确认只剩 HTML 页面缺失失败**

Run:

```powershell
node --test tools/tests/v4l2-stage08-topic-pages.test.mjs
```

Expected: CSS 契约通过，页面存在性测试仍失败。

---

### Task 3: 创建专题 24——初始化与 Buffer 映射

**Files:**

- Create: `04-项目/24-V4L2用户程序初始化与Buffer映射.html`
- Read: Day1–Day3 用户态源码
- Test: `tools/tests/v4l2-stage08-topic-pages.test.mjs`

- [ ] **Step 1: 建立可直接打开的页面骨架和阶段内导航**

页面必须包含：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>阶段08专题 · V4L2 用户程序初始化与 Buffer 映射</title>
  <link rel="stylesheet" href="assets/v4l2-callgraph.css">
</head>
<body>
  <header class="hero">
    <p class="eyebrow">阶段 08 · 专题 1/3</p>
    <h1>初始化与 Buffer 映射</h1>
    <p>本页只追 open、格式协商、申请 Buffer、查询 Buffer 与 mmap。</p>
  </header>
  <main>
    <nav class="topic-map" aria-label="本页阅读顺序">
      <a href="#app-direct-chain">1. 应用直接调用</a>
      <a href="#ioctl-dispatch-chain">2. ioctl 框架分发</a>
      <a href="#mapping-object-chain">3. mmap 对象关系</a>
    </nav>
    <section id="app-direct-chain"><h2>应用源码直接调用链</h2></section>
    <section id="ioctl-dispatch-chain"><h2>V4L2/VB2 框架分发</h2></section>
    <section id="mapping-object-chain"><h2>Buffer 与 mmap 地址关系</h2></section>
    <section id="source-insight"><h2>Source Insight 搜索顺序</h2></section>
    <section id="evidence-boundary"><h2>能证明与不能证明</h2></section>
    <nav class="stage-nav">
      <a href="23-V4L2-VB2用户态取流.html">← 阶段08总览</a>
      <a href="25-V4L2-QBUF到DQBUF取流闭环.html">专题2：取流闭环 →</a>
    </nav>
  </main>
</body>
</html>
```

- [ ] **Step 2: 绘制用户程序直接调用 SVG 与等价 mobile-flow**

图中节点按下列顺序，所有连线使用 `class="edge direct"`：

```text
main()
→ open("/dev/video0")
→ set_format()
   → xioctl(VIDIOC_S_FMT)
→ request_buffers()
   → xioctl(VIDIOC_REQBUFS)
→ map_buffers()
   → xioctl(VIDIOC_QUERYBUF)
   → mmap()
```

每个节点附用户源码文件：`set_format.c`、`map_buffers.c` 或 Day6 `capture_100_frames.c`。mobile-flow 使用相同函数顺序，不得减少节点。

- [ ] **Step 3: 绘制 ioctl 框架分发 SVG**

使用两条分支：

```text
VIDIOC_S_FMT
→ video_ioctl2()
→ __video_do_ioctl()
⇢ vdev->ioctl_ops->vidioc_s_fmt_vid_cap_mplane
⇢ rkisp_s_fmt_vid_cap_mplane()

VIDIOC_REQBUFS / VIDIOC_QUERYBUF
→ video_ioctl2()
→ __video_do_ioctl()
⇢ vb2_ioctl_reqbufs() / vb2_ioctl_querybuf()
→ VB2 Core
```

`→` 使用 `edge direct`，`⇢` 使用 `edge callback`，节点文字必须写明“V4L2 Core 查表回调，不是应用直接调用 RKISP/VB2”。

- [ ] **Step 4: 绘制 mmap 对象关系图并写白话说明**

关系图包含：

```text
VB2/驱动 Buffer
→ QUERYBUF 回填 plane.length + mem_offset
→ mmap(fd, mem_offset)
⇢ 应用 mapped_buffer.start[] / length[]
```

页面白话结论必须包含：

> mmap 只是把同一块底层 Buffer 映射进应用地址空间；它不是复制图像，也不能证明此时已经有有效帧。

- [ ] **Step 5: 增加 Source Insight 搜索表、证据边界与面试表达**

源码表至少包含：

| 文件 | 搜索符号 | 只看什么 |
|---|---|---|
| Day2 `set_format.c` | `VIDIOC_S_FMT` | 请求值和驱动回填值 |
| Day3 `map_buffers.c` | `VIDIOC_QUERYBUF`、`mmap` | offset 怎样变成用户虚拟地址 |
| `drivers/media/v4l2-core/v4l2-ioctl.c` | `video_ioctl2`、`__video_do_ioctl` | cmd 怎样查表分发 |
| RKISP capture 源码 | `rkisp_s_fmt_vid_cap_mplane` | 平台格式回调 |
| `drivers/media/v4l2-core/videobuf2-v4l2.c` | `vb2_ioctl_reqbufs` | Buffer 请求怎样进入 VB2 |

证据边界写清：S_FMT、REQBUFS、QUERYBUF 和 mmap 成功都不能证明已经出流。面试表达控制在 80–120 个汉字。

- [ ] **Step 6: 运行测试**

Run:

```powershell
node --test tools/tests/v4l2-stage08-topic-pages.test.mjs
```

Expected: 专题24相关断言通过；专题25、26仍因文件缺失失败。

---

### Task 4: 创建专题 25——QBUF 到 DQBUF 取流闭环

**Files:**

- Create: `04-项目/25-V4L2-QBUF到DQBUF取流闭环.html`
- Read: Day4、Day5 用户态源码和现有 `23` 的图2/图3
- Test: `tools/tests/v4l2-stage08-topic-pages.test.mjs`

- [ ] **Step 1: 建立页面骨架**

页面 section ID 固定为：

```html
<section id="app-capture-loop"></section>
<section id="streamon-callback-chain"></section>
<section id="frame-completion-chain"></section>
<section id="buffer-ownership"></section>
<section id="source-insight"></section>
<section id="evidence-boundary"></section>
```

顶部标记“阶段08 · 专题2/3”，底部导航到 `24`、`23` 和 `26`。

- [ ] **Step 2: 绘制应用直接调用循环**

```text
queue_all_buffers()
→ queue_one_buffer()
→ xioctl(VIDIOC_QBUF)
→ start_streaming()
→ xioctl(VIDIOC_STREAMON)
→ capture_frames()
   → wait_until_frame_ready()
   → poll()
   → xioctl(VIDIOC_DQBUF)
   → 读取 index / sequence / timestamp / bytesused
   → queue_one_buffer()
```

图中明确：最后一次 `queue_one_buffer()` 返回循环起点，4 个 Buffer 轮转而不是 100 帧申请 100 个 Buffer。

- [ ] **Step 3: 绘制 STREAMON 框架回调链**

```text
xioctl(VIDIOC_STREAMON)
→ ioctl()
→ video_ioctl2()
→ __video_do_ioctl()
→ vb2_ioctl_streamon()
→ vb2_core_streamon()
→ vb2_start_streaming()
⇢ q->ops->start_streaming
⇢ rkisp_start_streaming()
→ rkisp_stream_start()
⇢ pipe.set_stream(true)
⇢ rkisp_pipeline_set_stream()
⇢ 各上游 subdev 的 s_stream(1)
```

前三段普通 C 调用用实线；`q->ops`、`pipe.set_stream` 和 subdev ops 使用虚线。

- [ ] **Step 4: 绘制帧完成返回链和 Buffer 所有权图**

绿色数据线严格按：

```text
Sensor → D-PHY → CSI → ISP → MI/DMA
→ rkisp_mi_v21_isr()
→ vb2_buffer_done(DONE)
→ done_list / wake_up
→ vb2_core_dqbuf()
→ VIDIOC_DQBUF 返回应用
```

所有权图只保留四态：应用空 Buffer、VB2 QUEUED、驱动/DMA ACTIVE、完成队列 DONE，再回应用。

- [ ] **Step 5: 增加 Source Insight 搜索表和证据边界**

搜索表至少包含 `capture_frames`、`vb2_ioctl_streamon`、`vb2_start_streaming`、`rkisp_start_streaming`、`rkisp_mi_v21_isr`、`vb2_buffer_done`、`vb2_core_dqbuf`。证据边界必须区分：

```text
STREAMON 返回0：启动链无立即错误
第一次 DQBUF：至少取得一帧
连续 DQBUF：当前窗口持续出流
```

- [ ] **Step 6: 运行测试**

Run:

```powershell
node --test tools/tests/v4l2-stage08-topic-pages.test.mjs
```

Expected: 专题24、25断言通过；专题26仍因文件缺失失败。

---

### Task 5: 创建专题 26——连续 100 帧统计与资源清理

**Files:**

- Create: `04-项目/26-V4L2连续100帧统计与资源清理.html`
- Read: Day6 程序、日志、FPS 汇总和验收记录
- Test: `tools/tests/v4l2-stage08-topic-pages.test.mjs`

- [ ] **Step 1: 建立页面骨架与真实证据卡片**

页面 section ID 固定为：

```html
<section id="capture-100-chain"></section>
<section id="index-sequence-model"></section>
<section id="fps-model"></section>
<section id="cleanup-chain"></section>
<section id="board-evidence"></section>
<section id="source-insight"></section>
```

证据卡只使用已保存结果：100 帧、3.300023 秒、30.000 FPS、sequence `2 → 101`、gap `0`、timeout `0`、bytesused `12441600`。

- [ ] **Step 2: 绘制 100 帧统计直接调用链**

```text
main()
→ capture_frames()
   ├─ wait_until_frame_ready()
   ├─ xioctl(VIDIOC_DQBUF)
   ├─ total_bytesused()
   ├─ clock_gettime(CLOCK_MONOTONIC)
   ├─ update_stats()
   └─ queue_one_buffer()
→ print_summary()
```

所有调用来自 `capture_100_frames.c`，使用实线；节点写明函数职责和该文件名。

- [ ] **Step 3: 绘制 index/sequence 双编号和 FPS 间隔图**

双编号图：

```text
Buffer index：0 → 1 → 2 → 3 → 0（4个周转箱循环）
Frame sequence：2 → 3 → 4 → 5 → 6（新帧持续编号）
```

FPS 图用 5 个采样点演示 4 个间隔，并给出真实公式：

```text
FPS = (100 - 1) / (last_time - first_time)
    = 99 / 3.300023
    ≈ 30.000
```

- [ ] **Step 4: 绘制统一错误出口和逆序清理图**

所有失败路径汇入一个 `cleanup:` 节点：

```text
open/S_FMT/REQBUFS/mmap/QBUF/STREAMON/poll/DQBUF 任一步失败
成功完成100帧
                   ↘ cleanup:
                     → cleanup_capture()
                     → STREAMOFF（streaming=true）
                     → munmap（只处理已映射地址）
                     → REQBUFS(count=0)（queue_allocated=true）
                     → free()
                     → close(fd)
```

虚线表示由状态标志决定是否执行，不得画成无条件调用。

- [ ] **Step 5: 增加第二次运行、证据边界和实验链接**

页面必须链接：

```text
../05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/README.md
../05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture_100_frames.c
../05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture.log
../05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/fps-result.txt
```

并解释：连续运行两次主要验证正常退出资源清理，不只是让 FPS 数字更权威。

- [ ] **Step 6: 运行专题测试并确认全绿**

Run:

```powershell
node --test tools/tests/v4l2-stage08-topic-pages.test.mjs
```

Expected: 所有专题页契约测试通过，失败数 `0`。

---

### Task 6: 将三个专题接入阶段 08 总览

**Files:**

- Modify: `04-项目/23-V4L2-VB2用户态取流.html`
- Modify: `tools/tests/media-rkisp-page-diagram.test.mjs`

- [ ] **Step 1: 在原有三张图前增加专题入口卡片**

卡片内容固定为：

```html
<nav class="topic-map" aria-label="阶段08专题阅读顺序">
  <a href="24-V4L2用户程序初始化与Buffer映射.html"><b>专题 1</b>open → S_FMT → REQBUFS → mmap</a>
  <a href="25-V4L2-QBUF到DQBUF取流闭环.html"><b>专题 2</b>QBUF → STREAMON → DQBUF</a>
  <a href="26-V4L2连续100帧统计与资源清理.html"><b>专题 3</b>100帧 → FPS → cleanup</a>
</nav>
```

样式使用现有 `.map`，不为总览页再引入第二套 CSS。

- [ ] **Step 2: 增加 Day6 实验入口和证据摘要**

在证据边界后增加：

```html
<p class="note"><strong>板端实测：</strong>连续100帧，30.000 FPS，sequence 2→101，gap=0，poll timeout=0。<a href="26-V4L2连续100帧统计与资源清理.html">查看统计与清理调用图</a></p>
```

- [ ] **Step 3: 调整底部导航但保留阶段09入口**

底部至少同时存在：阶段07、完整路线、专题24、阶段09。专题页是推荐深入阅读，不变成新的课程阶段。

- [ ] **Step 4: 运行总览与专题测试**

Run:

```powershell
node --test tools/tests/media-rkisp-page-diagram.test.mjs tools/tests/v4l2-stage08-topic-pages.test.mjs
```

Expected: 全部通过，失败数 `0`。

---

### Task 7: 视觉、链接和全仓库验收

**Files:**

- Verify: `04-项目/23-V4L2-VB2用户态取流.html`
- Verify: `04-项目/24-V4L2用户程序初始化与Buffer映射.html`
- Verify: `04-项目/25-V4L2-QBUF到DQBUF取流闭环.html`
- Verify: `04-项目/26-V4L2连续100帧统计与资源清理.html`
- Verify: `04-项目/assets/v4l2-callgraph.css`

- [ ] **Step 1: 执行阶段专项测试**

```powershell
node --test tools/tests/media-rkisp-page-diagram.test.mjs tools/tests/v4l2-stage08-topic-pages.test.mjs
```

Expected: 全部通过。

- [ ] **Step 2: 执行完整项目测试和链接检查**

```powershell
node tools/build-dashboard.mjs
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
git diff --check
```

Expected:

- build exit code `0`；
- test failure `0`；
- `Broken wikilinks: 0`；
- `Broken relative links: 0`；
- `git diff --check` 无输出。

- [ ] **Step 3: 检查 1440、1024、768 和 390 像素宽度**

对 23–26 页面逐页检查：

```text
1440：桌面 SVG 显示，所有函数名与注释可读
1024：SVG 无节点重叠、连线穿字或横向裁切
768 ：临界宽度仍无内部滚动，导航正常换行
390 ：隐藏桌面 SVG，显示等价 mobile-flow；源码表纵向展开
```

每页至少截图一次桌面和一次 390px 窄屏，发现重叠必须修正后重拍。

- [ ] **Step 4: 逐条核对函数关系**

对每条 SVG 边记录检查结果：

```text
实线：在用户程序或内核源码中存在直接调用表达式
虚线：节点文字写明 ops 表、函数指针或框架回调来源
绿色：只表示帧、Buffer 状态或所有权，不声称为普通函数调用
```

重点核对 `STREAMON → VB2 → rkisp_start_streaming`、`IRQ → vb2_buffer_done → DQBUF` 和 `capture_frames → cleanup_capture`。

- [ ] **Step 5: 审查工作区且不提交**

```powershell
git status --short
git diff --stat
git diff -- '04-项目/23-V4L2-VB2用户态取流.html' `
  '04-项目/24-V4L2用户程序初始化与Buffer映射.html' `
  '04-项目/25-V4L2-QBUF到DQBUF取流闭环.html' `
  '04-项目/26-V4L2连续100帧统计与资源清理.html' `
  '04-项目/assets/v4l2-callgraph.css' `
  'tools/tests/v4l2-stage08-topic-pages.test.mjs'
```

Expected: 只有本计划文件和用户原有脏工作区修改；不执行 commit，不 push。
