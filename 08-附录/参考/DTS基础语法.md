---
id: reference-dts-syntax
doc-type: reference
title: DTS 基础语法
learning-status: understood
evidence-status: none
publish-status: draft
updated: 2026-08-10
---

# DTS 基础语法

本页保存通用 DTS 语法；RK3568 + IMX415 的实际课程主线见 [[02-DTS与设备发现]]。

### 一、DTS 本质上是什么

DTS 是 **Device Tree Source，设备树源码**。

它不负责实现驱动算法，而是告诉 Linux：

```text
板子上有什么硬件
硬件挂在哪条总线上
使用什么地址
时钟、GPIO、电源是什么
设备之间如何连接
哪些控制器需要启用
应该由哪个驱动匹配
```

对于你的 IMX415，可以先概括成：

```text
DTS 描述板级连接
Sensor Driver 控制 IMX415
DPHY/CSI/ISP 驱动控制 RK3568 内部硬件
V4L2/Media Controller 把它们组织成 Camera 链路
```

---

### 二、先看文件头：这份 DTS 从哪里继承东西

开头：

```dts
/dts-v1/;

#include <dt-bindings/gpio/gpio.h>
#include <dt-bindings/pinctrl/rockchip.h>
#include <dt-bindings/display/media-bus-format.h>
#include "rk3568.dtsi"
#include "rk3568-evb.dtsi"
```

你要这样理解。

#### 1. `/dts-v1/;`

说明这是 DTS version 1 格式。

不用深入，它类似文件格式声明。

#### 2. `#include`

这份板级 DTS 没有重新定义整个 RK3568，而是包含了：

```text
rk3568.dtsi
    RK3568 SoC 内部硬件模块的基础定义

rk3568-evb.dtsi
    RK3568 EVB 板的一些公共配置

当前这个 DTS
    对具体正点原子板卡做启用、关闭和修改
```

因此你看到：

```dts
&rkisp {
    status = "okay";
};
```

不是在这里创建 `rkisp`，而是在修改其他 `.dtsi` 中已经定义好的 `rkisp` 节点。

关系类似：

```text
rk3568.dtsi：
先定义“RK3568 有一个 ISP”

当前板级 DTS：
再声明“这块板要启用这个 ISP”
```

---

### 三、看懂 DTS 最重要的四种语法

#### 1. 普通节点

例如：

```dts
imx415: imx415@1a {
    ...
};
```

它表示定义一个设备节点。

拆开：

```text
imx415:
    label，标签，供其他节点使用 &imx415 引用

imx415@1a
    节点名称和 unit address

@1a
    这里对应 I2C 地址 0x1a
```

注意：

```text
imx415: 是标签
imx415@1a 是节点名
```

两者可以相同，也可以不同。

---

#### 2. `&xxx`

例如：

```dts
&i2c4 {
    status = "okay";
};
```

这里的 `&i2c4` 表示：

> 引用其他 `.dtsi` 中已经有标签 `i2c4:` 的节点，然后补充或修改它。

所以：

```dts
&i2c4 {
    imx415: imx415@1a {
        ...
    };
};
```

意思是：

```text
在 RK3568 的 I2C4 控制器下面
挂载一个地址为 0x1a 的 IMX415
```

---

#### 3. `<&xxx ...>`

例如：

```dts
clocks = <&cru CLK_CIF_OUT>;
```

表示引用另一个设备或控制器。

这里：

```text
&cru
    引用 RK3568 的 Clock & Reset Unit

CLK_CIF_OUT
    使用其中一个 Camera/CIF 输出时钟
```

再如：

```dts
reset-gpios = <&gpio3 RK_PB6 GPIO_ACTIVE_LOW>;
```

拆解：

```text
&gpio3
    GPIO bank 3

RK_PB6
    B 组第 6 号引脚

GPIO_ACTIVE_LOW
    低电平表示有效
```

---

#### 4. `status`

常见：

```dts
status = "okay";
status = "disabled";
```

含义：

```text
okay
    设备启用，内核可以为它创建 platform/I2C 设备并匹配驱动

disabled
    设备禁用，正常情况下不会参与初始化
```

但要注意：

> `status = "okay"` 只代表“允许初始化”，不代表驱动一定 probe 成功，更不代表一定出图。

还需要：

```text
驱动存在
compatible 匹配
供电正确
时钟正确
GPIO正确
I2C通信成功
endpoint正确
MIPI配置正确
```

---
