---
id: course-01-linux-driver-model
doc-type: course
title: Linux Driver Model
course-stage: "01"
learning-status: review-needed
evidence-status: partial
publish-status: published
updated: 2026-08-10
---

# Linux Driver Model

## 为什么学习

Camera 链路同时使用 I2C 与 Platform 两类设备。理解 bus、device、driver 和 probe，才能准确回答“谁创建设备、谁注册驱动、谁完成匹配、谁调用 probe”。

## 在整条链路中的位置

本章位于系统总览与具体 DTS 之间，负责解释静态设备描述如何变成内核运行时对象，并把 IMX415、D-PHY、CSI 和 RKISP 交给各自驱动。

## 输入 / 输出 / 软件身份 / 硬件身份

| 对象 | 输入 | 输出 | 软件身份 | 硬件身份 |
|---|---|---|---|---|
| I2C Core | I2C adapter、DTS 子节点、I2C driver | 匹配后的 `i2c_client` 与 probe 回调 | bus/core | I2C 控制器与从设备 |
| Platform Core | OF 节点、platform driver | `platform_device` 与 probe 回调 | platform bus | SoC 内部 MMIO 模块 |
| IMX415 | `sony,imx415`、地址 `0x1a` | `imx415_probe()` | I2C device/driver | 外部 Sensor |
| D-PHY | compatible、寄存器和时钟资源 | Rockchip D-PHY probe | Platform device/driver | SoC D-PHY 硬件 |

## RK3568 当前对应

IMX415 位于 I2C4，运行时 client 为 `4-001a-1`；D-PHY、CSI 与 RKISP 是 SoC 内部模块，主要通过 OF/Platform 路径形成 platform device。两条路径最终都遵循“设备出现 + 驱动注册 → bus match → probe”的共同模型。

## DTS / 源码入口

- 板级 DTS：`kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10-linux.dts`
- 板级 DTSI：`kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi`
- Sensor 驱动：`kernel/drivers/media/i2c/imx415.c`
- D-PHY 驱动：`kernel/drivers/phy/rockchip/phy-rockchip-csi2-dphy*.c`
- 具体设备发现路径见 [[02-DTS与设备发现]]。

## 实板验证

`/sys/bus/i2c/devices/4-001a-1` 和 driver 绑定可证明 I2C client 已创建并匹配驱动；`Detected imx415 id 0000e0` 进一步证明 probe 已经访问真实硬件。它们不能证明 MIPI、ISP 或抓帧链路正常。

## 常见故障

- 没有 device：先检查控制器状态、DTS 节点和地址。
- 有 device 无绑定：检查 compatible、驱动是否编译/加载及 match table。
- 已进入 probe 但失败：按时钟、GPIO、regulator、I2C 访问顺序检查资源。
- 不要把 `module_*_driver()` 注册动作误认为 probe 已执行。

## 面试表达

Linux 驱动模型把 device 与 driver 分离，由 bus 根据 match 规则配对；IMX415 走 I2C Core，RK3568 D-PHY 等片上模块走 Platform Core，匹配后由框架通过函数指针调用各自 probe。

## 验收题

1. `sensor_mod_init()` 是否直接调用 `imx415_probe()`？
2. `i2c_client` 与 `i2c_driver` 分别从哪里来？
3. 为什么 compatible 匹配成功仍不能证明硬件型号正确？
4. D-PHY 为什么通常是 platform device，而 IMX415 是 I2C device？

## 下一阶段接口

下一阶段进入 [[02-DTS与设备发现]]，把驱动模型中的 device 来源落到当前板子的 DTS 节点、资源与 endpoint。
