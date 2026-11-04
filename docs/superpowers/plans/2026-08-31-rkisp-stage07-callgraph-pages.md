# 阶段 07 RKISP 函数调用链专题网页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把阶段 07 从单页总览扩展为总览加三个源码调用链专题页，让学习者能分别追踪 RKISP 对象桥、节点建链和开流回帧。

**Architecture:** 保留 `22-RKISP-从RAW到VideoNode.html` 作为课程入口；新增 27、28、29 三个独立 HTML，并复用阶段 08 已验证的 `v4l2-callgraph.css`。先用 Node test 锁定文件、导航、函数符号、连线语义和窄屏结构，再逐页实现，最后接入 22 并执行全站验收。

**Tech Stack:** 静态 HTML5、内联 SVG、共享 CSS、Node.js `node:test`、现有 dashboard 构建与链接检查脚本。

---

## File Structure

- Create `tools/tests/rkisp-stage07-topic-pages.test.mjs`：三个专题页的结构、导航、函数链和视觉语义契约。
- Create `04-项目/27-RKISP双Platform驱动与对象桥.html`：双 driver、双 probe、phandle/drvdata 对象桥。
- Create `04-项目/28-RKISP内部节点注册与外部Async建链.html`：内部 subdev/video node 注册与外部 Async complete。
- Create `04-项目/29-RKISP开流与帧完成中断.html`：RKISP start_streaming、上游 s_stream、frame-end IRQ 与 Buffer DONE。
- Modify `04-项目/22-RKISP-从RAW到VideoNode.html`：增加 27–29 真实专题入口和底部推荐阅读出口。
- Reuse `04-项目/assets/v4l2-callgraph.css`：不新增第二套视觉样式。

### Task 1: 写阶段 07 专题页契约测试

**Files:**
- Create: `tools/tests/rkisp-stage07-topic-pages.test.mjs`

- [ ] **Step 1: 写文件与导航失败测试**

测试必须读取以下页面：

```js
const topicPages = [
  '27-RKISP双Platform驱动与对象桥.html',
  '28-RKISP内部节点注册与外部Async建链.html',
  '29-RKISP开流与帧完成中断.html',
];
```

断言：UTF-8、共享 `site.css`、共享 `assets/v4l2-callgraph.css`、`data-site-nav`、共享 `site.js`；导航为 `22→27→28→29→23`，且 27–29 均能返回 22。

- [ ] **Step 2: 写图形语义失败测试**

每页必须包含：

```js
assert.match(html, /<svg\b/iu);
assert.ok(hasSvgEdgeClass(html, 'direct'));
assert.ok(hasSvgEdgeClass(html, 'callback'));
assert.ok(hasSvgEdgeClass(html, 'data'));
assert.match(html, /class=["'][^"']*\bmobile-flow\b/iu);
assert.doesNotMatch(html, /overflow(?:-x|-y)?\s*:\s*(?:auto|scroll)/iu);
```

- [ ] **Step 3: 写三个函数链失败测试**

专题 27 必须包含：

```text
rkisp_hw_drv_init()
platform_driver_register(&rkisp_hw_drv)
platform_driver_register(&rkisp_plat_drv)
rkisp_hw_probe()
rkisp_plat_probe()
rkisp_attach_hw()
of_parse_phandle()
platform_get_drvdata()
dev_set_drvdata()
```

专题 28 必须包含：

```text
rkisp_register_platform_subdevs()
rkisp_register_isp_subdev()
rkisp_register_csi_subdev()
rkisp_register_stream_vdevs()
rkisp_register_stream_v21()
rkisp_register_stream_vdev()
video_register_device()
subdev_notifier_complete()
rkisp_create_links()
```

专题 29 必须包含：

```text
rkisp_start_streaming()
rkisp_stream_start()
pipe.set_stream
rkisp_pipeline_set_stream()
s_stream(1)
rkisp_mi_v21_isr()
mi_frame_end()
vb2_buffer_done(DONE)
```

- [ ] **Step 4: 运行测试确认 RED**

Run:

```powershell
node --test tools/tests/rkisp-stage07-topic-pages.test.mjs
```

Expected: 因 27–29 尚不存在而失败；测试辅助函数自身的正反例通过。

### Task 2: 实现专题 27 双 Platform Driver 与对象桥

**Files:**
- Create: `04-项目/27-RKISP双Platform驱动与对象桥.html`
- Test: `tools/tests/rkisp-stage07-topic-pages.test.mjs`

- [ ] **Step 1: 建立统一页面壳**

页面头部按以下顺序加载：

```html
<link rel="stylesheet" href="../00-首页/学习驾驶舱/site.css">
<link rel="stylesheet" href="assets/v4l2-callgraph.css">
<script defer src="../00-首页/学习驾驶舱/generated/vault-data.js"></script>
<script defer src="../00-首页/学习驾驶舱/site.js"></script>
```

导航节点使用 `<nav class="site-nav" data-site-nav>`，hero 标题说明“两个 driver 注册不等于两个 probe 互调”。

- [ ] **Step 2: 添加三张桌面 SVG 与三组 mobile-flow**

三张图固定为：

```text
module_init → rkisp_hw_drv_init → 两个 platform_driver_register
两个 of_match_table → Platform 总线分别回调两个 probe
rkisp_plat_probe → rkisp_attach_hw → phandle → HW pdev → drvdata → 同一 hw_dev 指针
```

每张图至少出现 `edge direct`、`edge callback`、`edge data` 中与该关系匹配的线；整页三种类型必须齐全。

- [ ] **Step 3: 添加白话解释、证据边界和 Source Insight 三入口**

仅列：

```text
hw.c: rkisp_hw_drv_init / rkisp_hw_probe
dev.c: rkisp_plat_probe
common.c: rkisp_attach_hw
```

结论明确：driver 注册、probe 成功、对象桥成功分别是三档证据，都不能直接证明 `/dev/videoX` 或真实出帧。

- [ ] **Step 4: 运行专题测试**

Run:

```powershell
node --test tools/tests/rkisp-stage07-topic-pages.test.mjs
```

Expected: 专题 27 函数链通过，28/29 文件缺失仍失败。

### Task 3: 实现专题 28 内部节点注册与外部 Async 建链

**Files:**
- Create: `04-项目/28-RKISP内部节点注册与外部Async建链.html`
- Test: `tools/tests/rkisp-stage07-topic-pages.test.mjs`

- [ ] **Step 1: 添加内部对象注册图**

固定直接调用链：

```text
rkisp_plat_probe()
→ rkisp_register_platform_subdevs()
├→ rkisp_register_isp_subdev()
├→ rkisp_register_csi_subdev()
└→ rkisp_register_stream_vdevs()
```

- [ ] **Step 2: 添加 Video Node 生成图**

固定调用与字段关系：

```text
rkisp_register_stream_vdevs()
→ rkisp_register_stream_v21()
→ rkisp_register_stream_vdev()
⇢ vdev->fops / ioctl_ops / queue
→ video_register_device()
→ /dev/videoX
```

字段赋值使用 callback/relationship 紫色虚线；`video_register_device()` 使用 direct 实线。

- [ ] **Step 3: 添加外部 Async 汇合图**

```text
notifier waiting list ⇢ 外部 subdev 注册
⇢ bound()：逐个匹配
⇢ subdev_notifier_complete()：全部到齐
→ rkisp_create_links()
→ 完整外部 Media Graph
```

必须并排解释：内部 `rkisp_register_platform_subdevs()` 与外部 `subdev_notifier_complete()` 是不同汇合点。

- [ ] **Step 4: 运行专题测试**

Expected: 专题 27、28 通过，仅 29 文件缺失相关测试失败。

### Task 4: 实现专题 29 RKISP 开流与帧完成中断

**Files:**
- Create: `04-项目/29-RKISP开流与帧完成中断.html`
- Test: `tools/tests/rkisp-stage07-topic-pages.test.mjs`

- [ ] **Step 1: 添加 VB2 回调进入 RKISP 的图**

```text
VIDIOC_STREAMON → V4L2/VB2 Core
⇢ q->ops->start_streaming
⇢ rkisp_start_streaming()
```

链接到 `25-V4L2-QBUF到DQBUF取流闭环.html` 查看通用分发，不在本页重复所有 VB2 中间层。

- [ ] **Step 2: 添加本地启动与上游启动顺序图**

```text
rkisp_start_streaming()
→ rkisp_stream_start()
⇢ pipe.set_stream(..., true)
⇢ rkisp_pipeline_set_stream()
⇢ ISP / CSI / D-PHY / Sensor s_stream(1)
```

图中必须表现“先本地 MI/DMA，再上游 s_stream”，不能画成两个无序并行分支。

- [ ] **Step 3: 添加 frame-end 回帧图**

```text
RAW → MI/DMA ACTIVE Buffer
→ rkisp_mi_v21_isr()
→ mi_frame_end()
→ vb2_buffer_done(DONE)
→ VB2 done_list / wake_up
→ 阶段 08 VIDIOC_DQBUF
```

证据边界必须区分 STREAMON、IRQ、DONE、持续 DQBUF 四档。

- [ ] **Step 4: 运行专题测试确认 GREEN**

Expected: `rkisp-stage07-topic-pages.test.mjs` 全部通过。

### Task 5: 接入 22 总览并完成全站验收

**Files:**
- Modify: `04-项目/22-RKISP-从RAW到VideoNode.html`
- Test: `tools/tests/rkisp-stage07-topic-pages.test.mjs`
- Test: `tools/tests/media-rkisp-page-diagram.test.mjs`

- [ ] **Step 1: 在 22 增加三个真实专题入口**

入口文案：

```text
专题 1 · 双 Platform Driver 与对象桥
专题 2 · 内部节点注册与外部 Async 建链
专题 3 · RKISP 开流与帧完成中断
```

- [ ] **Step 2: 修改底部推荐阅读导航**

保留阶段 06 返回和阶段 08 出口，同时新增“开始专题 1”。专题内部按 27→28→29→23 串联。

- [ ] **Step 3: 运行专项测试**

```powershell
node --test tools/tests/media-rkisp-page-diagram.test.mjs tools/tests/rkisp-stage07-topic-pages.test.mjs
```

Expected: 全部通过。

- [ ] **Step 4: 运行全站构建与验收**

```powershell
node tools/build-dashboard.mjs
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
git diff --check
```

Expected:

```text
所有测试通过
Broken wikilinks: 0
Broken relative links: 0
Active-to-archive links: 0
git diff --check 无错误
```

- [ ] **Step 5: 静态响应式检查**

确认 27–29 均包含桌面 `.diagram`、窄屏 `.mobile-flow`，共享 CSS 在 768px 隐藏 SVG 并显示纵向链；扫描不得出现 `overflow:auto` 或 `overflow:scroll`。

本计划不包含 commit/push 步骤，遵循用户现有工作流限制。
