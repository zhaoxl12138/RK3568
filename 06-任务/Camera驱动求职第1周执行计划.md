---
id: task-week1-camera-driver
doc-type: task
title: Camera 驱动求职第 1 周执行计划
course-stage: "05"
learning-status: in-progress
evidence-status: partial
publish-status: published
week: 1
updated: 2026-08-10
---

# RK3568 IMX415 Camera 驱动｜第 1 周执行计划

> 本页只保存执行信息。技术正文和问答已迁入课程章节。

## 执行

- [x] Day 1：DTS、I2C client、驱动匹配与 `imx415_probe()`。
- [x] Day 2：资源获取、上电时序和 Sensor ID。
- [x] Day 3：endpoint、MIPI CSI-2 与 D-PHY。
- [ ] Day 4：Media Controller、RKISP 与 `/dev/video0`。
- [ ] Day 5：新 Sensor 接入清单。
- [ ] Day 6：分层排障。
- [ ] Day 7：项目讲解和模拟面试。

## 状态

- 当前课程：05 V4L2 Subdev。
- 当前动作：从 V4L2 Subdev 源码陪读索引进入生命周期、对象与数据链、调试与面试验收。
- 已完成：阶段 00–04；阶段 05 学习中。

## 验收链接

- [[02-源码陪读/05-V4L2-Subdev/00-源码陪读索引|阶段 05 源码陪读索引]]
- [[05-V4L2-Subdev]]
- [[01-下一步任务看板]]
- [[05-实验与证据/环境基线/RK3568-IMX415当前基线]]
- [[Camera驱动能力验收矩阵]]

## 复盘链接

- Sensor 与 probe 问答：[[03-IMX415-Sensor-Bring-up#学习问答与订正]]
- 当前任务看板：[[01-下一步任务看板]]
- 后续面试输出：[[09-输出沉淀/00-输出沉淀入口]]
- 项目复述主稿：[[09-输出沉淀/00-项目三分钟讲解]]
