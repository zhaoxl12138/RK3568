# RK3568 D-PHY 源码陪读笔记设计

## 目标

为当前第 2 章增加一份独立的源码陪读笔记，帮助学习者从流程图进入真实内核代码，能够回答“谁调用谁、参数从哪里来、这一行改变了什么、运行时如何验证”。

这份笔记不是新的课程阶段，也不替代现有的 `Camera驱动第2章-MIPI-DPHY与CSI2.md`。现有文件继续负责协议、硬件和整体概念；新文件只负责 D-PHY 从 DTS 到 Media Graph 的代码追踪。

## 输出文件

```text
06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md
```

文件保持：

```yaml
web-publish: false
learning-status: in-progress
chapter: 2
```

学习完成并经过问答验收前，不生成 HTML。

## 源码依据

以实际 RK3568 Linux SDK 为唯一源码依据：

```text
\\wsl.localhost\Ubuntu-20.04\home\rk3568\work\rk3568_linux_sdk\kernel
```

主要驱动文件：

```text
drivers/phy/rockchip/phy-rockchip-csi2-dphy.c
```

需要有限展开的公共框架文件：

```text
drivers/media/v4l2-core/v4l2-subdev.c
drivers/media/v4l2-core/v4l2-fwnode.c
drivers/media/v4l2-core/v4l2-async.c
drivers/media/mc/mc-entity.c
drivers/base/platform.c
drivers/base/dd.c
```

`E:\sourceInsight\rk3568_linux_4.19_kernel\kernel` 当前没有复制 `drivers/phy/rockchip` 中的 D-PHY 主驱动，因此不能把这个不完整副本作为本章的源码事实来源。后续可以把所需文件补入 Source Insight 工程，方便跳转。

## 范围

本笔记只追踪：

```text
DTS 中的 csi2_dphy0
→ platform_device
→ compatible 匹配
→ rockchip_csi2_dphy_probe()
→ rockchip_csi2_dphy_attach_hw()
→ v4l2_subdev_init()
→ rockchip_csi2dphy_media_init()
→ media_entity_pads_init()
→ 解析 port@0 endpoint
→ 注册 async notifier
→ Sensor 与 D-PHY 异步绑定
→ media-ctl 可见 entity / pad / link
```

本轮不展开：

- IMX415 驱动内部寄存器、曝光和开流实现。
- RKISP 内部处理与 video node 创建。
- MIPI D-PHY 硬件寄存器每一位的含义。
- STREAMON 后完整数据中断和 buffer 流程。

## 文档结构

### 1. 先建立完整调用地图

用一张纯文本调用链区分三种关系：

- 实线：真实 C 函数调用。
- 虚线：设备模型回调，不是源码中的直接函数调用。
- 数据关系：DTS 属性被保存到哪个结构体字段。

### 2. DTS 到 probe

解释节点为何产生 `platform_device`，以及：

```text
platform_driver_register()
→ platform_match()
→ rockchip_csi2_dphy_probe(pdev)
```

这里重点解释 `pdev`、`pdev->dev`、`dev.of_node` 和 `compatible` 的来源。

### 3. probe 主函数逐行陪读

逐行解释 `rockchip_csi2_dphy_probe()`，包含：

- 每个局部变量是什么对象。
- 内存分配后得到什么。
- `platform_set_drvdata()` 保存了什么。
- attach、subdev、Media 初始化为什么按这个顺序执行。
- 每个 `goto` 错误标签会清理什么。

### 4. 关键子函数卡片

依次解释：

```text
rockchip_csi2_dphy_attach_hw()
v4l2_subdev_init()
rockchip_csi2dphy_media_init()
media_entity_pads_init()
v4l2_async_notifier_parse_fwnode_endpoints_by_port()
v4l2_async_subdev_notifier_register()
```

每张函数卡片固定包含：

1. 流程位置。
2. 调用者和下一层函数。
3. 参数来源。
4. 原始代码片段。
5. 逐行解释。
6. 关键结构体字段变化。
7. DTS 对应关系。
8. 运行时证据。
9. 调试价值。
10. 面试表达。

### 5. 异步绑定结果

把代码结果映射到板端证据：

```text
dmesg: csi2 dphy0 probe successfully
media-ctl: rockchip-csi2-dphy0
pad0 Sink  <- IMX415
pad1 Source -> rkisp-csi-subdev
[ENABLED] link
```

明确“DTS 静态连接描述”和“运行时 entity / pad / link”之间的对应关系。

### 6. 学习与验收

每一节后保留：

```text
我的回答：

> [!success] 正确答案
```

最终要求学习者能够脱离笔记解释：

- `probe()` 为什么会被调用。
- 两个 pad 在哪里声明并注册。
- endpoint 在哪里被解析。
- Sensor 为什么要异步绑定。
- `media-ctl -p` 中 D-PHY entity 的来源。

## 逐行解释粒度

关键函数中的声明、赋值、条件判断、函数调用、返回值和错误跳转都解释。对于公共框架函数，只展开与当前 D-PHY 链路直接相关的代码；不无限追踪锁、链表和 kobject 底层实现。

每行解释必须回答至少一个问题：

```text
输入是什么？
输出是什么？
改了哪个对象？
失败会怎样？
为什么在这里执行？
```

## 成功标准

- 所有函数名和代码均能在当前 SDK 中定位。
- 源码行号只作为当前位置提示，同时写函数名，避免 SDK 变动后笔记失效。
- 不把“注册”“匹配”“绑定”“调用”混为一谈。
- 不把 endpoint 描述误写成直接 C 函数调用。
- 笔记能同时服务源码阅读、板端排错和面试复述。
