# 删除 Camera 重复入口文档 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 迁移两个 Camera 重复入口文档中的唯一信息，删除源文件和网页，并清理所有活动引用。

**Architecture:** 第 1 周执行计划成为 Camera 学习唯一执行入口；第一章保存新 Sensor 前置检查表；技术学习继续由章节文档承担。网页目录机械移除两个旧条目，不运行完整生成器，以免提前发布第一章尚未作答的面试复盘。

**Tech Stack:** Obsidian Markdown、Node.js、静态 HTML、Git。

---

### Task 1: 迁移仍有价值的信息

**Files:**
- Modify: `06-任务/Camera驱动求职第1周执行计划.md`
- Modify: `06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md`

- [x] **Step 1: 把周计划改成唯一执行入口**

删除周计划顶部的 `RK3568-Camera驱动学习总入口` 链接，增加：

```text
第 1 章：技术内容完成 / 面试复盘待答
第 2 章：MIPI D-PHY 与 CSI-2 学习中
```

同时记录每轮四类问题：概念解释、当前项目证据、故障定位、60～90 秒表达。

- [x] **Step 2: 清理周计划末尾的旧固定入口**

保留第一章和第二章链接，删除 `RK3568-Camera-Sensor从零点亮路线` 链接。

- [x] **Step 3: 将新 Sensor 前置检查表并入第一章**

在第一章第 8 节加入：

```text
Sensor 型号、模组原理图、AVDD/DVDD/DOVDD、MCLK、RESET/PWDN、
I2C 地址、MIPI Lane/极性、分辨率/帧率/RAW 位宽、EEPROM/VCM/Flash
```

并核对板端接口电压、Lane 数、I2C、MCLK、GPIO 和供电来源。

- [x] **Step 4: 删除第一章顶部的旧总入口链接**

第一章直接从目标和主线开始，不再反向跳转到入口文件。

### Task 2: 删除源文件和旧网页

**Files:**
- Delete: `06-任务/RK3568-Camera-Sensor从零点亮路线.md`
- Delete: `06-任务/RK3568-Camera驱动学习总入口.md`
- Delete: `00-首页/学习驾驶舱/pages/notes/06-任务--RK3568-Camera-Sensor从零点亮路线.html`
- Delete: `00-首页/学习驾驶舱/pages/notes/06-任务--RK3568-Camera驱动学习总入口.html`

- [x] **Step 1: 删除两个 Markdown**

使用受控文件补丁删除，不能递归删除目录。

- [x] **Step 2: 删除两个对应 HTML**

只删除与两个 Markdown 同名的生成页，不删除 `pages/notes` 目录中的其他网页。

- [x] **Step 3: 检查活动源码引用**

Run:

```powershell
rg -n --glob '!00-首页/学习驾驶舱/**' --glob '!99-归档/**' --glob '!docs/superpowers/**' `
  'RK3568-Camera驱动学习总入口|RK3568-Camera-Sensor从零点亮路线' .
```

Expected: 无输出。

### Task 3: 清理网页目录和数据索引

**Files:**
- Modify: `00-首页/学习驾驶舱/generated/vault-data.js`
- Modify: `00-首页/学习驾驶舱/pages/notes.html`

- [x] **Step 1: 从数据索引删除两个 note**

读取 `window.RK3568_VAULT_DATA` JSON，过滤以下 `filePath`：

```text
06-任务/RK3568-Camera-Sensor从零点亮路线.md
06-任务/RK3568-Camera驱动学习总入口.md
```

执行前后断言正好删除 2 条，并按两空格 JSON 格式写回。

- [x] **Step 2: 从网页目录删除两个 article**

按 `data-note-search-text` 精确删除两个 `<article>`，并断言删除数为 2。

同时更新：

```text
62 / 62 篇网页内容 → 60 / 60 篇网页内容
06-任务 · 5 → 06-任务 · 3
```

- [x] **Step 3: 确认网页索引无残留**

Run:

```powershell
rg -n 'RK3568-Camera驱动学习总入口|RK3568-Camera-Sensor从零点亮路线' `
  '00-首页/学习驾驶舱/generated/vault-data.js' `
  '00-首页/学习驾驶舱/pages/notes.html'
```

Expected: 无输出。

### Task 4: 验证和提交

**Files:**
- Verify: `06-任务`
- Verify: `00-首页/学习驾驶舱`

- [x] **Step 1: 检查 Markdown 链接**

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

- [x] **Step 2: 运行网页测试**

Run:

```powershell
node --test tools/tests/*.mjs
```

Expected: 失败数为 0。

- [x] **Step 3: 检查删除结果**

Run:

```powershell
Test-Path '06-任务/RK3568-Camera-Sensor从零点亮路线.md'
Test-Path '06-任务/RK3568-Camera驱动学习总入口.md'
Test-Path '00-首页/学习驾驶舱/pages/notes/06-任务--RK3568-Camera-Sensor从零点亮路线.html'
Test-Path '00-首页/学习驾驶舱/pages/notes/06-任务--RK3568-Camera驱动学习总入口.html'
```

Expected: 四行均为 `False`。

- [x] **Step 4: 提交源文档结构调整**

只提交本次明确修改的源文档和计划，不把工作区中其他未提交网页重构一起纳入：

```powershell
git add -- `
  '06-任务/Camera驱动求职第1周执行计划.md' `
  '06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md' `
  '06-任务/RK3568-Camera驱动学习总入口.md' `
  'docs/superpowers/plans/2026-07-30-remove-redundant-camera-entry-docs.md'
git commit -m 'docs: remove redundant Camera learning entries'
```
