# RK3568 Camera 驱动学习总入口

> 当前唯一目标：基于 RK3568 + IMX415，恢复并形成 Camera Sensor 驱动开发能力，能够完成点亮、调试、定位和面试表达。

## 学习主线

```text
周计划
  → 从零点亮路线
  → 原理图与设备树
  → SDK 源码与驱动
  → 面试复盘
```

## 当前推荐阅读顺序

### 1. 当前执行计划

先看今天要做什么，以及本周需要达到什么结果。

[[Camera驱动求职第1周执行计划]]

### 2. 完整点亮路线

用于建立全局框架，回答“拿到一个新板子和新 Sensor 后应该怎么做”。

[[RK3568-Camera-Sensor从零点亮路线]]

### 3. 节点式驱动章节

每次只学习一个节点。章节通过原理、DTS、源码、板端证据和面试表达验收后，才发布为 HTML。

```text
第 1 章：IMX415 Sensor 与驱动                 ✅ 已完成
第 2 章：MIPI D-PHY 与 CSI-2                 ⏳ 学习中
第 3 章：RKISP                               ⬜ 未开始
第 4 章：Media Controller                    ⬜ 未开始
第 5 章：V4L2、VB2 与 /dev/video0           ⬜ 未开始
```

- [[Camera驱动第1章-IMX415-Sensor与驱动]]
- [[Camera驱动第2章-MIPI-DPHY与CSI2]]

## 岗位导向的提问规则

岗位样本来自：

```text
C:\Users\Administrator\Desktop\camera驱动开发岗位要求.txt
```

多份岗位反复要求的核心能力是：

```text
Sensor 驱动移植与 bring-up
→ 原理图、DTS、I2C、MIPI CSI-2/D-PHY
→ Linux V4L2、数据流和控制流
→ ISP/3A 与图像格式基础
→ 使用日志、Media Graph 和仪器划分故障层
→ 能独立说明问题、证据和排查顺序
```

因此后续每轮不再只问定义，而是固定包含：

1. **概念解释**：这个模块是什么，与上下游有什么区别。
2. **项目证据**：在当前 RK3568 + IMX415 的哪里能看到。
3. **故障定位**：给出一个现象，先判断哪一层，再说检查顺序。
4. **面试表达**：用 60～90 秒讲清结论、项目、证据和排障。

当前优先完成 Sensor → MIPI → RKISP → V4L2。Camera HAL、SERDES/C-PHY、多路并发、性能功耗和量产标定放到主链路之后，不把“了解”写成“做过”。

## 当前项目边界

### 驱动主线

```text
原理图
  → BoardConfig
  → DTS/DTSI
  → I2C Sensor 节点
  → compatible 匹配
  → probe
  → CSI-2 D-PHY
  → RKISP
  → V4L2
  → /dev/video0
```

### 应用层项目

```text
/dev/video0
  → GStreamer
  → OpenCV
  → RKNN/NPU
  → 显示/推流
```

应用层工程位于：

```text
\\wsl.localhost\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera
```

它用于验证 Camera 已经能够被应用使用，不代替内核驱动学习。

## 当前真实源码

```text
SDK：/home/rk3568/work/rk3568_linux_sdk

板级配置：
device/rockchip/rk356x/BoardConfig-rk3568-atk-evb1-ddr4-v10.mk

最终 DTS：
kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10-linux.dts

IMX415 节点：
kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi:650

IMX415 驱动：
kernel/drivers/media/i2c/imx415.c
```

## 学习规则

1. 先用当前板子验证，不先背概念。
2. 每个结论都要有命令输出、源码行号或原理图证据。
3. 当前实验只读不改，确认链路后再进入编译和修改。
4. 每一轮回答后，保留原答案，再补充高亮正确答案、当前板子证据和一个面试追问。

## 最终验收

- 能解释当前 IMX415 为什么挂在 I2C4、地址为什么是 `0x1a`。
- 能从设备树找到 Sensor、MCLK、GPIO 和 endpoint。
- 能从 `compatible` 找到 `imx415.c` 的匹配表和 `probe`。
- 能解释 Sensor → CSI-2 → RKISP → `/dev/video0`。
- 能独立制定一个新 Camera 的点亮和排障步骤。
