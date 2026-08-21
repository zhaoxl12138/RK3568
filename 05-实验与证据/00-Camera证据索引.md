---
doc-type: reference
title: Camera 实板证据索引
publish-status: published
updated: 2026-08-10
---

# Camera 实板证据索引

本目录保存可追溯到采集环境、命令、原始输出和适用边界的 RK3568 + IMX415 记录。网页结论引用 evidence ID，日期相同或标题相似时也不会用“当前格式”互相覆盖。

## 审计入口

- [[环境基线/RK3568-IMX415当前基线]]：版本、IP、格式层级、节点映射和分辨率状态的统一边界。
- [[assets/manifest]]：正式图片副本的来源、SHA-256、页面/裁剪状态和用途。

## 已登记证据

| Evidence ID | 主 course-stage | 状态 | 记录 | 主要能证明 | 明确不能证明 |
|---|---:|---|---|---|---|
| `EVID-20260728-IMX415-RUNTIME` | 02 | verified | [[2026-07-28-直连板端读取IMX415配置]] | 运行时 DTS、I2C client、driver binding、endpoint | 唯一 DTB/SDK commit、出帧 |
| `EVID-20260728-CAMERA-DAY1` | 04 | verified | [[2026-07-28-Camera驱动Day1验收]] | probe、Sensor ID、异步绑定、Media Graph 与查询时格式 | 带哈希抓帧、帧内容正确 |

## 待补项

- course-stage `00`、`01`、`05`–`11` 暂无符合本目录元数据契约的独立证据记录；网页会显示“暂无证据，待补充”。
- 2026-05-28 的 1280×720 / 1920×1080 抓帧叙述目前位于 [[V4L2命令行抓帧记录]]，但没有迁入原始 `.yuv` 文件和哈希，因此只在环境基线中作为“历史记录”引用，不升级为本目录 verified 证据。
- Media API `4.19.255` 缺少原始输出与采集日期，保持未核实，不与 2026-07-28 的运行内核 `4.19.232` 合并。

## 新增规则

每份记录必须有唯一 `id`、`doc-type: evidence`、两位 `course-stage` 和 `evidence-status: verified | superseded`，并固定包含：环境快照、操作目的、原始命令、原始输出、可以证明、不能证明、关联课程阶段、状态。

设备 IP 只能描述采集当时的连接环境。Buildroot 板端命令默认使用 `grep`；只有现场确认安装后才能写 `rg`。
