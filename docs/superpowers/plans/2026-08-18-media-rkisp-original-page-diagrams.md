# Media Controller 与 RKISP 原页面流程图深化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有第 06、07 章 HTML 页面内，把概览流程图深化为可对应源码陪读、对象关系和板端证据的阅读图。

**Architecture:** 保留现有深色 SVG 泳道视觉、课程导航和阶段跳转。每页仍以一张页面为学习入口，但将主 SVG 扩为三段：初始化/回调控制流、对象或数据关系、板端证据边界；节点附中文职责、文件与搜索符号。实线只表示直接调用/流程，虚线只表示对象关联或异步等待。

**Tech Stack:** 静态 HTML、内嵌 SVG、既有 `site.css` / `site.js`。

---

### Task 1: 整理可维护的原页面结构

**Files:**
- Modify: `E:/obsidian_github/RK3568/04-项目/21-MediaController-Entity-Pad-Link.html`
- Modify: `E:/obsidian_github/RK3568/04-项目/22-RKISP-从RAW到VideoNode.html`

- [ ] **Step 1: 格式化两份单行 HTML，保留语义和链接不变。**

Run: `npx prettier --write "04-项目/21-MediaController-Entity-Pad-Link.html" "04-项目/22-RKISP-从RAW到VideoNode.html"`

Expected: 两份 HTML 变为可按 section/SVG 层次维护的格式，不改变现有页面结构和链接目标。

- [ ] **Step 2: 检查格式化后导航、Obsidian 链接与阶段前后跳转仍存在。**

Run: `rg -n "stage-nav|00-源码陪读|21-MediaController|22-RKISP" "04-项目/21-MediaController-Entity-Pad-Link.html" "04-项目/22-RKISP-从RAW到VideoNode.html"`

Expected: 两页均保留原有阶段导航和源码陪读入口。

### Task 2: 深化第 06 章 Media Controller 原页面

**Files:**
- Modify: `E:/obsidian_github/RK3568/04-项目/21-MediaController-Entity-Pad-Link.html`
- Test: `E:/obsidian_github/RK3568/tools/tests/dphy-course-page.test.mjs`

- [ ] **Step 1: 在原 SVG 内补入三段阅读区。**

新增内容必须包含：

```text
区 1：DTS remote-endpoint → parse_fwnode → waiting asd → Async match
区 2：v4l2_device_register_subdev → .bound() → media_entity_pads_init / media_create_pad_link
区 3：entity/pad/link 与 media-ctl [ENABLED] 的“能证明 / 不能证明”
```

节点必须标出以下源码定位：

```text
drivers/phy/rockchip/phy-rockchip-csi2-dphy.c
rockchip_csi2dphy_media_init()
rockchip_csi2_dphy_notifier_bound()
drivers/media/v4l2-core/v4l2-async.c
v4l2_async_match_notify()
drivers/media/media-entity.c
media_entity_pads_init()
media_create_pad_link()
```

- [ ] **Step 2: 追加一段页面内“怎样按图追代码”的短说明。**

必须区分：实线为直接调用/控制流；虚线为 fwnode、对象关联或 Async 等待；`[ENABLED]` 只是软件图证据。

- [ ] **Step 3: 增加页面文本断言。**

在 `tools/tests/dphy-course-page.test.mjs` 增加断言，确认 HTML 包含 `v4l2_async_match_notify`、`media_entity_pads_init`、`media_create_pad_link`、`[ENABLED]` 和源码陪读入口。

- [ ] **Step 4: 运行针对性测试。**

Run: `node --test tools/tests/dphy-course-page.test.mjs`

Expected: PASS。

### Task 3: 深化第 07 章 RKISP 原页面

**Files:**
- Modify: `E:/obsidian_github/RK3568/04-项目/22-RKISP-从RAW到VideoNode.html`
- Test: `E:/obsidian_github/RK3568/tools/tests/stage07-source-comment-coverage.test.mjs`

- [ ] **Step 1: 在原 SVG 内补入三个明确区段。**

```text
区 1：rkisp_hw_drv_init → 两个 platform driver → 两个 Platform probe
区 2：dev_set_drvdata(HW) / rockchip,hw / platform_get_drvdata / rkisp_attach_hw 对象桥
区 3：CSI subdev → ISP subdev → mainpath stream → video_register_device → /dev/videoX
```

节点必须标出：

```text
hw.c / rkisp_hw_probe()
dev.c / rkisp_plat_probe()
common.c / rkisp_attach_hw()
capture.c 或 capture_v21.c / rkisp_register_stream_vdev()
video_register_device()
```

图区需同时区分：两支 probe 是 Platform 框架回调，不是 HW probe 直接调用逻辑 probe；`drvdata` 是对象指针桥，不是拷贝；`/dev/videoX` 出现不等于能 DQBUF。

- [ ] **Step 2: 追加 RAW/processed/内存格式和证据边界短区。**

必须出现：`SGBRG10_1X10`、`YUYV8_2X8`、`NV12`、`video_register_device()`、`STREAMON`、`DQBUF`，并明确三种格式不在同一层。

- [ ] **Step 3: 运行第 07 章源码注释覆盖检查。**

Run: `node --test tools/tests/stage07-source-comment-coverage.test.mjs`

Expected: PASS。

### Task 4: 静态页面与链接验收

**Files:**
- Modify: `E:/obsidian_github/RK3568/04-项目/21-MediaController-Entity-Pad-Link.html`
- Modify: `E:/obsidian_github/RK3568/04-项目/22-RKISP-从RAW到VideoNode.html`

- [ ] **Step 1: 构建数据并检查链接。**

Run:

```powershell
node tools/build-dashboard.mjs
node tools/check-vault-links.mjs
git diff --check
```

Expected: 构建成功、0 个 Markdown 死链、无空白错误。

- [ ] **Step 2: 用本地浏览器整体缩放检查。**

检查 1024px 和 1440px 宽度：SVG 允许浏览器整体缩放，不使用内部滚动框；文字与箭头不互相遮挡；所有阶段导航可见。

- [ ] **Step 3: 不提交、不 push。**

当前工作区已有用户改动；仅保留本轮涉及的两页和测试文件修改，不执行 git commit 或 push。
