# RK3568 D-PHY Source Reading Note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一份可在 Obsidian 中边追边回答的 D-PHY 源码陪读笔记，逐行讲清 DTS 到 Media Graph 的真实代码链路。

**Architecture:** WSL 中的 RK3568 Linux SDK 是源码事实来源；新 Markdown 负责源码陪读，现有第 2 章继续负责概念学习。一个轻量 Node 测试锁定函数覆盖、章节结构、发布状态和第 2 章反向链接，避免笔记遗漏关键调用或过早发布成 HTML。

**Tech Stack:** Markdown、Obsidian、Linux 4.19 Rockchip BSP C source、Node.js `node:test`、`rg`。

---

## File Structure

- Create: `06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md` — 逐行源码陪读正文。
- Modify: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md` — 在概念章开头增加源码陪读入口。
- Create: `tools/tests/dphy-source-reading-note.test.mjs` — 验证笔记结构、关键函数、源码路径和发布状态。
- Read only: `\\wsl.localhost\Ubuntu-20.04\home\rk3568\work\rk3568_linux_sdk\kernel\drivers\phy\rockchip\phy-rockchip-csi2-dphy.c` — Rockchip D-PHY 主驱动。
- Read only: `\\wsl.localhost\Ubuntu-20.04\home\rk3568\work\rk3568_linux_sdk\kernel\drivers\media\v4l2-core\v4l2-subdev.c` — subdev 初始化实现。
- Read only: `\\wsl.localhost\Ubuntu-20.04\home\rk3568\work\rk3568_linux_sdk\kernel\drivers\media\v4l2-core\v4l2-fwnode.c` — endpoint 解析入口。
- Read only: `\\wsl.localhost\Ubuntu-20.04\home\rk3568\work\rk3568_linux_sdk\kernel\drivers\media\v4l2-core\v4l2-async.c` — notifier 注册与异步匹配。

### Task 1: Lock the source-reading contract

**Files:**
- Create: `tools/tests/dphy-source-reading-note.test.mjs`
- Test: `tools/tests/dphy-source-reading-note.test.mjs`

- [ ] **Step 1: Write the failing document-contract test**

创建测试，要求：

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const notePath = path.join(repoRoot, '06-任务', 'Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md');
const chapterPath = path.join(repoRoot, '06-任务', 'Camera驱动第2章-MIPI-DPHY与CSI2.md');

test('D-PHY source-reading note stays private and follows the real call chain', () => {
  const note = fs.readFileSync(notePath, 'utf8');
  assert.match(note, /web-publish:\s*false/u);
  for (const name of [
    'rockchip_csi2_dphy_probe',
    'rockchip_csi2_dphy_attach_hw',
    'v4l2_subdev_init',
    'rockchip_csi2dphy_media_init',
    'media_entity_pads_init',
    'v4l2_async_notifier_parse_fwnode_endpoints_by_port',
    'v4l2_async_subdev_notifier_register',
  ]) assert.match(note, new RegExp(name, 'u'));
});

test('the concept chapter links to the source-reading companion', () => {
  const chapter = fs.readFileSync(chapterPath, 'utf8');
  assert.match(chapter, /\[\[Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读\]\]/u);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test tools/tests/dphy-source-reading-note.test.mjs
```

Expected: FAIL because the source-reading note does not exist and the concept chapter has no companion link.

- [ ] **Step 3: Commit the failing contract**

```powershell
git add -- tools/tests/dphy-source-reading-note.test.mjs
git commit -m "测试 D-PHY 源码陪读笔记契约"
```

### Task 2: Extract the exact SDK call chain

**Files:**
- Read only: WSL SDK source files listed above.
- Create: `06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md`

- [ ] **Step 1: Capture exact function ranges**

Run:

```powershell
rg -n "rockchip_csi2dphy_media_init|rockchip_csi2_dphy_attach_hw|rockchip_csi2_dphy_probe|rockchip_csi2_dphy_driver" "\\wsl.localhost\Ubuntu-20.04\home\rk3568\work\rk3568_linux_sdk\kernel\drivers\phy\rockchip\phy-rockchip-csi2-dphy.c"
```

Expected: locate `media_init` near line 427, `attach_hw` near 464, `probe` near 558, and the platform driver near 660.

- [ ] **Step 2: Extract complete functions with numbered lines**

Use WSL `nl -ba` for these ranges:

```bash
nl -ba drivers/phy/rockchip/phy-rockchip-csi2-dphy.c | sed -n '400,690p'
nl -ba drivers/media/v4l2-core/v4l2-subdev.c | sed -n '680,720p'
nl -ba drivers/media/v4l2-core/v4l2-fwnode.c | sed -n '470,520p'
nl -ba drivers/media/v4l2-core/v4l2-async.c | sed -n '490,535p'
```

Expected: obtain complete code without truncating error labels or notifier operations.

- [ ] **Step 3: Create the note skeleton and source identity section**

The note must start with:

```markdown
---
web-publish: false
learning-status: in-progress
chapter: 2
note-type: source-reading
---

# Camera 驱动第 2 章：D-PHY 从 DTS 到 Media Graph 源码陪读

> 源码版本：RK3568 Linux SDK / Linux 4.19
> 主文件：`drivers/phy/rockchip/phy-rockchip-csi2-dphy.c`
> 阅读边界：DTS → Platform probe → V4L2 subdev → endpoint → async notifier → Media Graph
```

Add the initial call map using `直接调用`、`驱动模型回调`、`数据关系` labels so the arrows are not misleading.

- [ ] **Step 4: Run the contract test**

Run: `node --test tools/tests/dphy-source-reading-note.test.mjs`

Expected: the file-existence failure is resolved; missing function/link assertions may still fail until later tasks.

### Task 3: Explain DTS, matching, probe, and hardware attachment

**Files:**
- Modify: `06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md`

- [ ] **Step 1: Add the DTS-to-probe section**

Include the exact RK3568 `csi2_dphy0` base node, board `status = "okay"` override, input/output endpoint roles, `compatible = "rockchip,rk3568-csi2-dphy"`, and this callback boundary:

```text
DTS 节点被创建为 platform_device
→ platform bus 比较 compatible
→ Linux 驱动模型调用 .probe
→ rockchip_csi2_dphy_probe(pdev)
```

Explicitly state that DTS does not directly call C functions.

- [ ] **Step 2: Add a line-by-line `rockchip_csi2_dphy_probe()` card**

Explain every declaration, allocation, pointer assignment, attach call, subdev initialization, name generation, media initialization, success log, return value, and error label. Every line explanation must identify the affected object (`pdev`、`csi2dphy`、`sd`、`entity`、`notifier`) and failure behavior.

- [ ] **Step 3: Add a line-by-line `rockchip_csi2_dphy_attach_hw()` card**

Explain how `dev->of_node` identifies the runtime DTS node, how the code finds/attaches D-PHY hardware resources, and why this step precedes V4L2/Media registration. Include only helper branches reachable on RK3568.

- [ ] **Step 4: Add debugger anchors**

For each function add:

```text
Source Insight 搜索词
建议断点
成功日志
典型返回值
失败时下一条检查命令
```

- [ ] **Step 5: Commit the probe section**

```powershell
git add -- '06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md'
git commit -m "讲解 D-PHY 匹配与 probe 源码"
```

### Task 4: Explain V4L2 subdev and Media entity initialization

**Files:**
- Modify: `06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md`

- [ ] **Step 1: Add the `v4l2_subdev_init()` card**

Explain `sd` and `ops`, zeroing/initialization, owner/list/name fields, and the distinction between registering callback addresses and executing callbacks.

- [ ] **Step 2: Add the `rockchip_csi2dphy_media_init()` card**

Explain pad flag assignment, entity function, pad registration, endpoint parsing, notifier ops, notifier registration, success path, and every cleanup label.

- [ ] **Step 3: Add the `media_entity_pads_init()` card**

Explain why D-PHY has `pad0 Sink` and `pad1 Source`, how pad indices are assigned, and why `media-ctl -p` can later display them.

- [ ] **Step 4: Add a structure-state table**

The table must show state after each operation:

```text
devm_kzalloc                 → csi2dphy exists
v4l2_subdev_init             → sd.ops available
media_entity_pads_init       → entity owns two pads
parse_fwnode_endpoints       → notifier has remote Sensor descriptor
notifier_register            → waits for or binds IMX415 subdev
```

- [ ] **Step 5: Commit the Media initialization section**

```powershell
git add -- '06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md'
git commit -m "讲解 D-PHY subdev 与 Media 初始化"
```

### Task 5: Explain endpoint parsing and asynchronous binding

**Files:**
- Modify: `06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md`

- [ ] **Step 1: Add the endpoint parsing card**

Explain the actual wrapper `v4l2_async_notifier_parse_fwnode_endpoints_by_port()` and only the directly relevant generic helper behavior: selecting local `port@0`, walking the remote endpoint, creating an async subdev descriptor, and attaching it to the notifier.

- [ ] **Step 2: Add the notifier registration card**

Explain what `v4l2_async_subdev_notifier_register(&dphy->sd, &dphy->notifier)` registers, what remains pending, and which event later invokes notifier bound/complete callbacks.

- [ ] **Step 3: Distinguish four verbs**

Add a compact table:

```text
注册：把对象交给框架管理
匹配：框架比较设备与驱动/异步描述符
绑定：把匹配成功的两个运行时对象建立关系
调用：执行某个函数体
```

- [ ] **Step 4: Map code to runtime evidence**

Use the user's real board output to map:

```text
dmesg: csi2 dphy0 probe successfully!
entity 67: rockchip-csi2-dphy0
pad0 Sink <- m00_b_imx415 4-001a-1
pad1 Source -> rkisp-csi-subdev
[ENABLED]
```

State what each item proves and does not prove.

- [ ] **Step 5: Commit the async binding section**

```powershell
git add -- '06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md'
git commit -m "讲解 D-PHY endpoint 与异步绑定"
```

### Task 6: Add exercises, link the concept chapter, and verify

**Files:**
- Modify: `06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md`
- Modify: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`
- Test: `tools/tests/dphy-source-reading-note.test.mjs`

- [ ] **Step 1: Add learning checkpoints**

After each major function add 2–4 questions followed by an empty `我的回答` area and a collapsed/admonition-style correct answer. Questions must prioritize interviews: callback source, parameter source, structure changes, failure boundary, and runtime proof.

- [ ] **Step 2: Add the concept-chapter link**

Near the top of `Camera驱动第2章-MIPI-DPHY与CSI2.md`, add:

```markdown
> 源码陪读：[[Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读]]
```

- [ ] **Step 3: Run focused tests**

Run:

```powershell
node --test tools/tests/dphy-source-reading-note.test.mjs
```

Expected: all source-reading note tests PASS.

- [ ] **Step 4: Run full repository verification**

Run:

```powershell
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
git diff --check
```

Expected: all Node tests pass; broken wikilinks 0; broken relative links 0; active-to-archive links 0; no whitespace errors.

- [ ] **Step 5: Open in Obsidian-compatible Markdown view**

Verify headings, C code fences, call-chain text, tables, admonitions and internal links render clearly. Confirm `web-publish: false` prevents HTML generation.

- [ ] **Step 6: Commit the completed source-reading chapter**

```powershell
git add -- '06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md' '06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md' tools/tests/dphy-source-reading-note.test.mjs
git commit -m "完成 D-PHY 源码逐行陪读笔记"
```
