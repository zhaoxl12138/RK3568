---
id: course-06-media-controller
doc-type: course
title: Media Controller
course-stage: "06"
learning-status: not-started
evidence-status: partial
publish-status: draft
updated: 2026-08-12
---

# Media Controller

> 学习状态：未开始。这里先作为正式入口和学习边界，结论将在源码陪读过程中逐项校正。

## 为什么学习

DTS endpoint 只描述“应该连接”；Media Controller 才把 Sensor、D-PHY、CSI、ISP 和 video node 组织成运行时可查询的 `entity / pad / link` 图。

## 本阶段只解决三个问题

1. `entity`、`pad`、`link` 分别是什么对象，由谁创建。
2. `v4l2_async` 如何在上下游 probe 顺序不固定时完成绑定。
3. 怎样用 `media-ctl -p` 找到最早缺失的节点、端口或连接。

## RK3568 当前链路

```text
m00_b_imx415 4-001a-1:pad0 Source
  -> rockchip-csi2-dphy0:pad0 Sink
  -> rkisp-csi-subdev
  -> rkisp-isp-subdev
  -> rkisp_mainpath
  -> /dev/video0
```

## 源码与实验入口

- 源码陪读：[[02-源码陪读/06-Media-Controller/00-源码陪读索引|06 Media Controller 源码陪读]]
- 关键源码：`drivers/media/media-entity.c`、`drivers/media/v4l2-core/v4l2-async.c`
- 板端命令：`media-ctl -p`

## 验收边界

`[ENABLED]` 能证明软件拓扑连接已建立，不能单独证明 MIPI 电气信号、帧数据或 ISP 输出正常。

## 面试表达

Media Controller 用 entity 表示模块、pad 表示数据端口、link 表示端口连接；V4L2 Async 让异步注册的 subdev 在双方都出现后执行 `bound()` 并建立运行时链路。

## 下一阶段

完成本阶段后进入 [[07-RKISP]]，追 RAW 数据怎样从 CSI 接收进入 ISP 和 video node。
