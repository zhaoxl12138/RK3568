---
id: course-07-rkisp
doc-type: course
title: RKISP
course-stage: "07"
learning-status: not-started
evidence-status: partial
publish-status: draft
updated: 2026-08-12
---

# RKISP

> 学习状态：未开始。本页先固定源码边界、数据链与验收目标。

## 为什么学习

Sensor ID 和 Media Graph 正常仍不等于能够出图。RKISP 阶段负责理解 RAW Bayer 如何进入 CSI/ISP、怎样建立 mainpath/selfpath，以及 `/dev/videoX` 为什么会出现。

## 本阶段只解决三个问题

1. `rkisp_hw`、`rkisp`、`rkisp-csi-subdev` 与 `rkisp-isp-subdev` 各是什么。
2. RAW10 在哪里进入 ISP，YUV/NV12 在哪里成为 video node 的输出格式。
3. probe 成功、graph 建立、video node 存在和真正开流成功各能证明什么。

## 控制流与数据流

```text
控制流：DTS -> RKISP platform probe -> subdev/video 注册 -> /dev/videoX
数据流：IMX415 RAW10 -> D-PHY -> CSI -> ISP -> mainpath -> buffer
```

## 源码与实验入口

- 源码陪读：[[02-源码陪读/07-RKISP/00-源码陪读索引|07 RKISP 源码陪读]]
- 关键源码：`drivers/media/platform/rockchip/isp/` 下的 `hw.c`、`dev.c`、`csi.c`、`rkisp.c`、`capture.c`
- 板端证据：`dmesg`、`media-ctl -p`、`v4l2-ctl --list-devices`

## 验收边界

`/dev/video0` 存在只证明 video device 已注册；只有成功分配 buffer、执行 `STREAMON` 并取回有效帧，才证明主数据通路真正工作。

## 面试表达

RKISP 既包含 SoC ISP 硬件，也包含组织 CSI、ISP subdev 和 capture video node 的内核驱动；Media Graph 描述连接，VB2 队列承接最终帧数据。

## 下一阶段

完成本阶段后进入 [[08-V4L2用户态取流]]，从用户态 `open()` 一直追到 VB2 的 `DQBUF`。
