---
id: course-05-v4l2-subdev
doc-type: course
title: V4L2 Subdev
course-stage: "05"
learning-status: in-progress
evidence-status: partial
publish-status: published
updated: 2026-08-12
---
# V4L2 Subdev

> 当前阶段入口：[[02-源码陪读/05-V4L2-Subdev/00-源码陪读索引|IMX415 V4L2 Subdev 源码陪读索引]]

## 为什么学习

`imx415_probe()` 能读到 Sensor ID，只证明控制面基本可用。要让 Camera 框架能够设置格式、曝光并开流，IMX415 驱动还必须把自己的能力组织成 `v4l2_subdev`、ops、controls、Media Pad，并注册到 V4L2 Async 框架。

## 本阶段只回答一件事

```text
imx415.c 中已经写好的格式、控制和开流函数，
怎样交给 V4L2 框架，并在未来请求到来时被调用？
```

## 三个注册面

```text
I2C Driver
├─ imx415_probe()
├─ imx415_remove()
└─ runtime PM

V4L2 subdev_ops
├─ imx415_set_fmt()
├─ imx415_get_fmt()
└─ imx415_s_stream()

V4L2 ctrl_ops
└─ imx415_set_ctrl()
```

“驱动文件包含这些函数”不等于“初始化时把所有函数执行一遍”。注册的本质是把对象和函数地址交给框架；真正的格式、控制或开流请求到来时，框架才沿对应 ops 回调。

## RK3568 当前对应

- Sensor 驱动：`drivers/media/i2c/imx415.c`
- V4L2 I2C 适配层：`drivers/media/v4l2-core/v4l2-common.c`
- Sensor Async 注册：`drivers/media/v4l2-core/v4l2-fwnode.c`
- 可视化总览：[[04-项目/19-IMX415-v4l2-subdev注册与开流.html|IMX415 v4l2_subdev：从注册到开流]]

## 当前源码节点

第一轮只追：

```text
device_initcall_sync(sensor_mod_init)
→ sensor_mod_init()
→ i2c_add_driver(&imx415_i2c_driver)
→ I2C 总线框架匹配后回调 imx415_probe()
→ v4l2_i2c_subdev_init(sd, client, &imx415_subdev_ops)
→ media_entity_pads_init(...)
→ v4l2_async_register_subdev_sensor_common(sd)
```

## 通过条件

1. 分清 `.probe = imx415_probe` 是函数指针赋值，不是函数调用。
2. 解释 `sd = &imx415->subdev` 中两个对象的包含关系。
3. 解释 `v4l2_i2c_subdev_init()` 做了什么、没有做什么。
4. 分清“挂接 ops”“创建 Source Pad”“Async 注册”三个动作。
5. 能从用户态 `STREAMON` 口述到 `imx415_s_stream()`，但暂不追 I2C 字节级实现。

## 下一阶段接口

阶段 05 完成后进入 [[06-Media-Controller]]，把 Sensor subdev 放回完整的 entity、pad、link 拓扑中。
