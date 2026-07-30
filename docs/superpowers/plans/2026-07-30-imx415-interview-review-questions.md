# IMX415 第一章岗位化复盘题 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在第一章末尾增加 8 道不与第二章重复的 Camera Sensor 驱动岗位化复盘题，并保持已发布 HTML 不变。

**Architecture:** 复盘题直接保存在第一章 Markdown，不创建独立题库。题目分为“核心原理”和“场景与表达”两轮，覆盖双线初始化、信息来源、probe、控制流/数据流、三类故障和新 Sensor bring-up；用户作答并批改完成后才重新生成 HTML。

**Tech Stack:** Obsidian Markdown、RK3568 Linux 4.19 BSP、Device Tree、I2C Core、V4L2 Sensor subdev。

---

### Task 1: 增加第一章复盘题

**Files:**
- Modify: `06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md`

- [ ] **Step 1: 在第 8 节后增加复盘说明**

增加 `## 9. 岗位化面试复盘`，明确复盘不阻塞第二章，用户先写原始答案，系统不提前给标准答案。

- [ ] **Step 2: 增加四道核心原理题**

题目覆盖：

```text
DTS 创建设备与驱动注册的两条独立起点
i2c_client 和 IMX415 驱动的信息来源
imx415_probe 的有效执行顺序与 Sensor ID 证据边界
I2C 控制流与 endpoint 图像数据流
```

- [ ] **Step 3: 增加四道场景与表达题**

题目覆盖：

```text
没有 4-001a I2C client
已有 client 和 DRIVER=imx415 但读不到 Sensor ID
拿到新板子和新 Sensor 时的 bring-up 顺序
90 秒项目讲解
```

- [ ] **Step 4: 为每道题保留原始回答位置**

每道题只加入：

```markdown
**我的回答：**
```

正确答案、证据和追问等待用户作答后再补充。

### Task 2: 更新学习状态并验证

**Files:**
- Modify: `06-任务/RK3568-Camera驱动学习总入口.md`
- Verify: `00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第1章-IMX415-Sensor与驱动.html`

- [ ] **Step 1: 更新第一章状态**

将第一章状态写为：

```text
第 1 章：IMX415 Sensor 与驱动        ✅ 技术内容完成 / 📝 面试复盘待答
```

- [ ] **Step 2: 验证 Markdown 链接**

Run:

```powershell
node tools/check-vault-links.mjs .
```

Expected:

```text
Broken wikilinks: 0
Broken relative links: 0
Active-to-archive links: 0
```

- [ ] **Step 3: 验证已发布 HTML 未被重新生成**

修改前后运行：

```powershell
Get-FileHash "00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第1章-IMX415-Sensor与驱动.html" -Algorithm SHA256
```

Expected: 两次 SHA256 相同。

- [ ] **Step 4: 提交复盘题**

```powershell
git add -- `
  "06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md" `
  "06-任务/RK3568-Camera驱动学习总入口.md" `
  "docs/superpowers/specs/2026-07-30-camera-driver-node-learning-workflow-design.md" `
  "docs/superpowers/plans/2026-07-30-imx415-interview-review-questions.md"
git commit -m "docs: add IMX415 interview review questions"
```
