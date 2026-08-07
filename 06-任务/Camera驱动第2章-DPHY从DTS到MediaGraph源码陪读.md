---
web-publish: false
learning-status: in-progress
chapter: 2
note-type: source-reading
---

# Camera 驱动第 2 章：D-PHY 从 DTS 到 Media Graph 源码陪读

> 配套概念章：[[Camera驱动第2章-MIPI-DPHY与CSI2]]
>
> 本笔记暂不生成 HTML。先用于 Source Insight 追代码、回答问题和纠错；本节真正学完后，再整理成网页。

## 0. 这份笔记解决什么问题

你当前不是缺少一张更大的框架图，而是看到下面这些代码时，不知道：

```text
谁调用它？
参数从哪里来？
这一行改了哪个结构体？
这一行与 DTS 哪个字段对应？
执行成功后，在 dmesg 或 media-ctl 中怎样看出来？
```

所以本笔记不按“文件从第一行读到最后一行”，而按真实启动顺序读：

```text
DTS 声明两个 D-PHY 对象
        ↓
D-PHY HW 驱动先 probe
        ↓
HW probe 注册逻辑 D-PHY platform_driver
        ↓
Platform Core 匹配 csi2_dphy0，回调逻辑 D-PHY probe
        ↓
逻辑 D-PHY 关联物理 HW
        ↓
初始化 v4l2_subdev 和两个 pad
        ↓
解析 port@0，建立“等待 Sensor”的 notifier
        ↓
异步匹配到 IMX415 subdev
        ↓
.bound() 创建 IMX415 Source → D-PHY Sink 的 Media link
```

### 0.1 本章源码基线

本章只以你 WSL 中实际使用的 Rockchip Linux 4.19 SDK 为准：

```text
/home/rk3568/work/rk3568_linux_sdk/kernel
```

本次逐行核对对应的 SDK Git 提交：

```text
1abab5d60db72241ccdb732f4b4b762fbc338902
```

主要源码：

```text
drivers/phy/rockchip/phy-rockchip-csi2-dphy-hw.c
drivers/phy/rockchip/phy-rockchip-csi2-dphy.c
drivers/phy/rockchip/phy-rockchip-csi2-dphy-common.h
drivers/media/v4l2-core/v4l2-subdev.c
drivers/media/v4l2-core/v4l2-fwnode.c
drivers/media/v4l2-core/v4l2-async.c
drivers/media/media-entity.c
arch/arm64/boot/dts/rockchip/rk3568.dtsi
arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi
```

> 注意：`E:\sourceInsight\rk3568_linux_4.19_kernel\kernel` 当前不是完整源码基线，缺少本章主要 D-PHY 文件。Source Insight 工程应以 WSL SDK 的同步副本为准。

## 1. 先认识三个对象：不要把它们混成一个 D-PHY

| 对象 | 类型 | DTS 节点 | C 结构体 | 作用 |
|---|---|---|---|---|
| D-PHY 物理硬件 | Platform device/driver | `csi2-dphy-hw@fe870000` | `struct csi2_dphy_hw` | 管寄存器、时钟和真正的 stream_on/off |
| D-PHY 逻辑接口 | Platform device/driver + V4L2 subdev | `csi2-dphy0` | `struct csi2_dphy` | 管 pad、endpoint、Sensor 绑定和 V4L2 接口 |
| IMX415 | I2C driver + V4L2 subdev | `imx415@1a` | `struct imx415` | 产生 RAW10，并作为 D-PHY 上游 Sensor |

一句话记忆：

> `csi2_dphy_hw` 是“真正操作 RK3568 D-PHY 寄存器的硬件对象”，`csi2_dphy0` 是“放进 V4L2/Media Graph 的逻辑对象”。

## 2. 完整调用地图：从哪里开始，哪些是直接调用

```text
module_platform_driver(rockchip_csi2_dphy_hw_driver)
        │ 模块/内核初始化时注册 HW platform_driver
        ▼
Platform Core 根据 compatible 匹配 HW 节点
        │ 驱动模型回调，不是源码中的普通直接调用
        ▼
rockchip_csi2_dphy_hw_probe(pdev)
        │
        ├─ 映射寄存器、保存 stream_on/stream_off
        ├─ platform_set_drvdata(pdev, dphy_hw)
        └─ platform_driver_register(&rockchip_csi2_dphy_driver)
                    │ 注册逻辑 D-PHY driver
                    ▼
          Platform Core 匹配 csi2_dphy0
                    │ 驱动模型回调
                    ▼
          rockchip_csi2_dphy_probe(pdev)
                    │
                    ├─ rockchip_csi2_dphy_attach_hw()
                    │      └─ 从 rockchip,hw 找到 dphy_hw
                    ├─ v4l2_subdev_init()
                    └─ rockchip_csi2dphy_media_init()
                           ├─ media_entity_pads_init()
                           ├─ v4l2_async_notifier_parse_fwnode_endpoints_by_port()
                           ├─ v4l2_async_subdev_notifier_register()
                           └─ v4l2_async_register_subdev()
                                      │
                                      ▼
                         异步框架找到 IMX415 subdev
                                      │ 回调 notifier.ops->bound
                                      ▼
                         rockchip_csi2_dphy_notifier_bound()
                                      │
                                      └─ media_create_pad_link()
```

### 2.1 直接调用与回调必须分开

| 关系 | 类型 | 谁决定执行时机 |
|---|---|---|
| `hw_probe()` → `platform_driver_register()` | 直接调用 | D-PHY HW 驱动代码 |
| `Platform Core` → `rockchip_csi2_dphy_probe()` | 驱动模型回调 | Linux Platform 总线匹配结果 |
| `probe()` → `attach_hw()` | 直接调用 | 逻辑 D-PHY 驱动代码 |
| `probe()` → `media_init()` | 直接调用 | 逻辑 D-PHY 驱动代码 |
| 异步框架 → `notifier_bound()` | V4L2 异步回调 | Sensor subdev 与 fwnode 匹配结果 |
| 用户开流 → `csi2_dphy_s_stream()` | V4L2 ops 回调 | 上层管线发出的 STREAMON 请求 |

这也是读 Linux 驱动最容易迷路的地方：

> 代码上下相邻，不等于串行调用；函数指针被保存后，通常要等框架在未来某个时刻回调。

### 2.2 “注册、匹配、绑定、调用”不是一回事

| 动词 | 在本章中的准确含义 | 例子 |
|---|---|---|
| 注册 | 把一个对象和它的能力交给框架管理 | `platform_driver_register(&rockchip_csi2_dphy_driver)` |
| 匹配 | 框架比较双方标识，判断能否配对 | Platform 比较 `compatible`；Async 比较 fwnode 指针 |
| 绑定 | 匹配成功后建立运行时关系 | Platform 把 device 绑定 driver；`.bound()` 记录 Sensor 并建 link |
| 调用 | CPU 真正进入某个函数体执行 | `probe()` 直接调用 `attach_hw()` |

最容易说错的一句是“注册就是调用 probe”。正确说法是：

```text
注册 driver
→ 框架获得 driver 对象
→ 框架寻找匹配 device
→ 匹配成功并准备绑定
→ 框架才回调 driver->probe()
```

## 3. 第一步：DTS 创建了哪两个 D-PHY 节点

### 3.1 SoC 公共 DTSI：默认只声明，尚未启用

文件：`rk3568.dtsi:3436-3460`

```dts
csi2_dphy_hw: csi2-dphy-hw@fe870000 {
    compatible = "rockchip,rk3568-csi2-dphy-hw";
    reg = <0x0 0xfe870000 0x0 0x1000>;
    clocks = <&cru PCLK_MIPICSIPHY>;
    clock-names = "pclk";
    rockchip,grf = <&grf>;
    status = "disabled";
};

csi2_dphy0: csi2-dphy0 {
    compatible = "rockchip,rk3568-csi2-dphy";
    rockchip,hw = <&csi2_dphy_hw>;
    status = "disabled";
};
```

逐行看：

| DTS 行 | 大白话 | 后面由谁使用 |
|---|---|---|
| `csi2_dphy_hw:` | 给节点起标签，其他节点可用 `&csi2_dphy_hw` 引用 | 板级 DTSI、`rockchip,hw` |
| `csi2-dphy-hw@fe870000` | 物理硬件节点，名字中的地址与寄存器基址对应 | Platform device |
| `compatible = ...-hw` | 让它匹配 `rockchip_csi2_dphy_hw_driver` | Platform Core |
| `reg = ...fe870000...` | D-PHY 硬件寄存器范围 | `platform_get_resource()` |
| `clocks` / `clock-names` | D-PHY 寄存器访问所需时钟 | HW probe / runtime PM |
| `rockchip,grf` | 引用 RK3568 GRF 系统寄存器节点 | HW 驱动 |
| `csi2_dphy0:` | 逻辑 D-PHY0；它没有自己的 MMIO 地址 | 逻辑 D-PHY driver |
| `compatible = ...-dphy` | 匹配 `rockchip_csi2_dphy_driver` | Platform Core |
| `rockchip,hw = <&csi2_dphy_hw>` | 把逻辑 D-PHY0 指向共享物理硬件 | `attach_hw()` |
| `status = "disabled"` | SoC 只提供能力，具体板子默认不用 | 板级 DTSI 覆盖 |

### 3.2 板级 DTSI：启用硬件和逻辑接口

文件：`rk3568-atk-evb1-ddr4-v10.dtsi:227-268`

```dts
&csi2_dphy_hw {
    status = "okay";
};

&csi2_dphy0 {
    status = "okay";

    ports {
        #address-cells = <1>;
        #size-cells = <0>;
        port@0 {
            reg = <0>;
            #address-cells = <1>;
            #size-cells = <0>;

            mipi_in_ucam1: endpoint@2 {
                reg = <2>;
                remote-endpoint = <&imx415_out>;
                data-lanes = <1 2 3 4>;
            };
        };
        port@1 {
            reg = <1>;
            csidphy_out: endpoint@0 {
                reg = <0>;
                remote-endpoint = <&isp0_in>;
            };
        };
    };
};
```

这里最重要的不是背语法，而是看方向：

```text
port@0 = D-PHY 输入侧
endpoint@2 ↔ imx415_out

port@1 = D-PHY 输出侧
csidphy_out ↔ isp0_in
```

`remote-endpoint` 是静态连接声明，不等于此时已经创建 Media link。真正的 Sensor link 要等 `.bound()`。

### 3.3 `data-lanes = <1 2 3 4>` 最终保存到哪里

```text
DTS data-lanes
  ↓ v4l2_fwnode_endpoint_alloc_parse()
vep->bus.mipi_csi2.num_data_lanes = 4
  ↓ rockchip_csi2_dphy_fwnode_parse()
s_asd->lanes = 4
  ↓ Sensor 异步绑定成功
dphy->sensors[n].lanes = 4
```

所以它不是“解析后直接写硬件寄存器”。它先成为软件结构体里的链路描述；真正开流时，驱动再根据 Sensor 数据率和 Lane 数配置硬件。

## 4. 真正起点：为什么先执行 HW probe

文件：`phy-rockchip-csi2-dphy-hw.c:647-655`

```c
static struct platform_driver rockchip_csi2_dphy_hw_driver = {
    .probe = rockchip_csi2_dphy_hw_probe,
    .remove = rockchip_csi2_dphy_hw_remove,
    .driver = {
        .name = "rockchip-csi2-dphy-hw",
        .of_match_table = rockchip_csi2_dphy_hw_match_id,
    },
};
module_platform_driver(rockchip_csi2_dphy_hw_driver);
```

逐行理解：

| 代码 | 意义 |
|---|---|
| `struct platform_driver` | 声明它使用 Linux Platform 驱动模型 |
| `.probe = ...hw_probe` | 匹配成功后由 Platform Core 回调的入口 |
| `.remove = ...hw_remove` | 设备解绑或模块卸载时的清理入口，不是开机紧跟 probe 执行 |
| `.of_match_table` | 保存该驱动支持的 DTS `compatible` 表 |
| `module_platform_driver(...)` | 生成模块 init/exit，模块加载或内建初始化时注册该 HW driver |

HW probe 的尾部是本章真正容易漏掉的调用：

```c
dphy_hw->stream_on = csi2_dphy_hw_stream_on;
dphy_hw->stream_off = csi2_dphy_hw_stream_off;
platform_set_drvdata(pdev, dphy_hw);
pm_runtime_enable(&pdev->dev);
platform_driver_register(&rockchip_csi2_dphy_driver);
```

| 行 | 结构体变化 | 意义 |
|---|---|---|
| `stream_on = ...` | `dphy_hw->stream_on` 保存函数地址 | 以后逻辑 D-PHY 开流时可以调用真正硬件函数 |
| `stream_off = ...` | 保存停流函数地址 | 同上 |
| `platform_set_drvdata` | `pdev` 私有数据指向 `dphy_hw` | `attach_hw()` 后续可用 `platform_get_drvdata()` 取回 |
| `pm_runtime_enable` | 启用该硬件的 runtime PM | 电源/时钟可按使用状态管理 |
| `platform_driver_register` | 把逻辑 D-PHY driver 注册给 Platform Core | 这一步之后才可能回调逻辑 `rockchip_csi2_dphy_probe()` |

### 4.1 面试表达

> RK3568 Rockchip BSP 把 CSI2 D-PHY 拆成物理 HW driver 和逻辑 D-PHY driver。HW driver 先映射寄存器并保存硬件开停流回调，再注册逻辑 driver；逻辑 driver 负责 V4L2 subdev、Media pad 和 Sensor endpoint 绑定。

## 5. `rockchip_csi2_dphy_probe()`：逻辑 D-PHY 初始化总入口

文件：`phy-rockchip-csi2-dphy.c:558-612`

### 5.1 谁调用它，参数从哪里来

```text
调用者：Linux Platform Core
调用原因：csi2_dphy0 的 compatible 与 of_match_table 匹配
参数 pdev：由 DTS 的 csi2_dphy0 节点创建的 struct platform_device
pdev->dev.of_node：运行时 csi2_dphy0 设备树节点
```

它不是 HW probe 直接写 `rockchip_csi2_dphy_probe(pdev)` 调用。HW probe 只是注册 driver，真正调用 probe 的仍然是 Platform Core。

### 5.2 原代码

```c
static int rockchip_csi2_dphy_probe(struct platform_device *pdev)
{
    struct device *dev = &pdev->dev;
    const struct of_device_id *of_id;
    struct csi2_dphy *csi2dphy;
    struct v4l2_subdev *sd;
    int ret;

    csi2dphy = devm_kzalloc(dev, sizeof(*csi2dphy), GFP_KERNEL);
    if (!csi2dphy)
        return -ENOMEM;
    csi2dphy->dev = dev;

    of_id = of_match_device(rockchip_csi2_dphy_match_id, dev);
    if (!of_id)
        return -EINVAL;

    csi2dphy->phy_index = of_alias_get_id(dev->of_node, "csi2dphy");
    if (csi2dphy->phy_index < 0 || csi2dphy->phy_index > 2)
        csi2dphy->phy_index = 0;

    ret = rockchip_csi2_dphy_attach_hw(csi2dphy);
    if (ret) {
        dev_err(dev, "csi2 dphy hw can't be attached, register dphy%d failed!\n",
                csi2dphy->phy_index);
        return -ENODEV;
    }

    sd = &csi2dphy->sd;
    mutex_init(&csi2dphy->mutex);
    v4l2_subdev_init(sd, &csi2_dphy_subdev_ops);
    sd->flags |= V4L2_SUBDEV_FL_HAS_DEVNODE;
    snprintf(sd->name, sizeof(sd->name),
             "rockchip-csi2-dphy%d", csi2dphy->phy_index);
    sd->dev = dev;

    platform_set_drvdata(pdev, &sd->entity);

    ret = rockchip_csi2dphy_media_init(csi2dphy);
    if (ret < 0)
        goto detach_hw;

    pm_runtime_enable(&pdev->dev);
    dev_info(dev, "csi2 dphy%d probe successfully!\n", csi2dphy->phy_index);
    return 0;

detach_hw:
    mutex_destroy(&csi2dphy->mutex);
    rockchip_csi2_dphy_detach_hw(csi2dphy);
    return 0;
}
```

### 5.3 逐行陪读

| 代码 | 类型 | 这一行做什么 | 结果保存在哪里 |
|---|---|---|---|
| `dev = &pdev->dev` | 取地址 | 从 Platform 设备取通用 `device` | 局部变量 `dev` |
| `of_id` | 声明 | 准备保存匹配表项 | 栈变量，尚未赋值 |
| `csi2dphy` | 声明 | 准备指向本设备私有结构体 | 栈变量 |
| `sd` | 声明 | 准备指向内嵌的 V4L2 subdev | 栈变量 |
| `devm_kzalloc(...)` | 分配 | 分配并清零 `struct csi2_dphy` | `csi2dphy` 指向新内存 |
| `if (!csi2dphy)` | 错误判断 | 内存不足就停止 probe | 返回 `-ENOMEM` |
| `csi2dphy->dev = dev` | 赋值 | 保存通用 device，后面读 DTS/日志/PM 都用它 | `struct csi2_dphy.dev` |
| `of_match_device(...)` | 再确认匹配 | 在逻辑 D-PHY 匹配表中找当前 device | `of_id` |
| `if (!of_id)` | 错误判断 | 找不到 compatible 就退出 | 返回 `-EINVAL` |
| `of_alias_get_id(...)` | 读 DTS alias | 从 `csi2dphy0 = &csi2_dphy0` 得到索引 0 | `phy_index = 0` |
| 索引范围判断 | 容错 | 非 0~2 时回退到 0 | `phy_index` |
| `attach_hw(...)` | 直接调用 | 把逻辑 D-PHY 接到物理 HW 对象 | `csi2dphy->dphy_hw` |
| `sd = &csi2dphy->sd` | 取内嵌成员地址 | 不再单独分配 subdev | `sd` 指向内嵌成员 |
| `mutex_init(...)` | 初始化 | 保护开流/停流状态 | `csi2dphy->mutex` |
| `v4l2_subdev_init(...)` | 直接调用 | 初始化 subdev 并保存 ops 表 | `sd->ops` 等 |
| `sd->flags |= HAS_DEVNODE` | 设置位 | 允许该 subdev 拥有 `/dev/v4l-subdevX` | `sd->flags` |
| `snprintf(sd->name...)` | 命名 | 生成 media-ctl 中的 entity 名 | `sd->name` |
| `sd->dev = dev` | 建关联 | subdev 回指底层 Platform device | `sd->dev` |
| `platform_set_drvdata(...)` | 保存私有数据 | remove/runtime PM 可从 `pdev` 取回 entity | `pdev` 的 driver_data |
| `media_init(...)` | 直接调用 | 创建 pad、解析 endpoint、注册 notifier/subdev | 多个 Media/V4L2 结构体 |
| `goto detach_hw` | 错误跳转 | 统一释放 mutex、解除 HW 关联 | 进入错误标签 |
| `pm_runtime_enable` | 启用 PM | 逻辑 D-PHY 支持运行时电源管理 | device PM 状态 |
| `dev_info(...)` | 成功证据 | 产生启动日志 | `dmesg` |

### 5.4 一个必须看出来的 vendor 代码问题

错误路径最后写的是：

```c
return 0;
```

这意味着 `rockchip_csi2dphy_media_init()` 失败后，代码清理了资源，却仍向 Platform Core 报告 probe 成功。严格来说更合理的是返回 `ret`。调试时不能只看“设备是否绑定”，还要结合成功日志与 Media Graph。

## 6. `rockchip_csi2_dphy_attach_hw()`：逻辑对象怎样找到物理硬件

文件：`phy-rockchip-csi2-dphy.c:464-529`

### 6.1 主线代码

```c
if (dphy->phy_index == 0)
    target_mode = LANE_MODE_FULL;
else
    target_mode = LANE_MODE_SPLIT;

np = of_parse_phandle(dev->of_node, "rockchip,hw", 0);
if (!np || !of_device_is_available(np))
    return -ENODEV;

plat_dev = of_find_device_by_node(np);
of_node_put(np);
if (!plat_dev)
    return -ENODEV;

dphy_hw = platform_get_drvdata(plat_dev);
if (!dphy_hw)
    return -EINVAL;

dphy_hw->dphy_dev[dphy_hw->dphy_dev_num] = dphy;
dphy_hw->dphy_dev_num++;
dphy->dphy_hw = dphy_hw;
```

完整函数中间还有共享 Lane 模式检查：

```c
if (dphy_hw->lane_mode == LANE_MODE_UNDEF) {
    dphy_hw->lane_mode = target_mode;
} else {
    struct csi2_dphy *phy = dphy_hw->dphy_dev[0];

    for (i = 0; i < dphy_hw->dphy_dev_num; i++) {
        if (dphy_hw->dphy_dev[i]->lane_mode == dphy_hw->lane_mode) {
            phy = dphy_hw->dphy_dev[i];
            break;
        }
    }

    if (target_mode != dphy_hw->lane_mode)
        return -ENODEV;
}
```

| 分支 | 含义 | 失败结果 |
|---|---|---|
| HW 模式还是 `UNDEF` | 第一个逻辑 D-PHY 决定共享硬件使用 full 或 split | 写入 `dphy_hw->lane_mode` |
| HW 已确定模式 | 后续逻辑 D-PHY 只能使用相同模式 | 不一致返回 `-ENODEV` |
| `phy_index == 0` | 选择 `LANE_MODE_FULL` | 与 dphy1/2 split 配置互斥 |
| `phy_index == 1/2` | 选择 `LANE_MODE_SPLIT` | 与 dphy0 full 配置互斥 |

源码观察：循环比较使用了 `dphy_hw->dphy_dev[i]->lane_mode`，但当前主文件没有给逻辑 `dphy->lane_mode` 赋值；真正控制共享硬件模式的是 `dphy_hw->lane_mode`。这属于阅读 vendor BSP 时应能识别的实现细节，不影响你当前正常的 dphy0 full-mode 路径。

### 6.2 每一步对应什么

| 代码 | DTS/前序来源 | 作用 |
|---|---|---|
| `phy_index == 0` | `aliases { csi2dphy0 = ... }` | D-PHY0 使用四 Lane FULL 模式 |
| `of_parse_phandle(..., "rockchip,hw", 0)` | `rockchip,hw = <&csi2_dphy_hw>` | 得到物理 HW 的 device_node |
| `of_device_is_available(np)` | HW 节点 `status = "okay"` | 检查硬件节点已启用 |
| `of_find_device_by_node(np)` | Platform Core 已创建设备 | 从 device_node 找到 `platform_device` |
| `of_node_put(np)` | 引用计数 | 释放前面取得的 node 引用 |
| `platform_get_drvdata(plat_dev)` | HW probe 的 `platform_set_drvdata` | 取回 `struct csi2_dphy_hw *` |
| `dphy_hw->dphy_dev[...] = dphy` | 当前逻辑 D-PHY | 让 HW 知道有哪些逻辑接口在使用它 |
| `dphy->dphy_hw = dphy_hw` | 物理对象 | 让逻辑 D-PHY 能调用 HW 的 stream_on/off |

### 6.3 为什么 HW probe 必须先成功

如果 HW probe 尚未执行：

```text
platform_device 可能存在
但 platform_get_drvdata(plat_dev) 得到 NULL
→ attach_hw 失败
```

Rockchip 通过“HW probe 中再注册逻辑 driver”保证依赖顺序，而不是靠猜测 probe 先后。更精确地说：HW probe 先完成寄存器映射、函数指针和 `drvdata` 保存，然后在 **HW probe 尚未返回时** 调用 `platform_driver_register()`；注册过程会由 Platform Core 同步匹配现有逻辑设备并回调逻辑 probe。因此常见日志顺序反而是：

```text
csi2 dphy0 probe successfully!
csi2 dphy hw probe successfully!
```

这不表示逻辑 D-PHY 比 HW 更早初始化，只表示 HW 的成功日志写在注册逻辑 driver 之后。

## 7. `struct csi2_dphy`：前面每一步到底在填什么

文件：`phy-rockchip-csi2-dphy-common.h:50-64`

```c
struct csi2_dphy {
    struct device *dev;
    struct list_head list;
    struct csi2_dphy_hw *dphy_hw;
    struct v4l2_async_notifier notifier;
    struct v4l2_subdev sd;
    struct mutex mutex;
    struct media_pad pads[CSI2_DPHY_RX_PADS_NUM];
    struct csi2_sensor sensors[MAX_DPHY_SENSORS];
    u64 data_rate_mbps;
    int num_sensors;
    int phy_index;
    bool is_streaming;
    enum csi2_dphy_lane_mode lane_mode;
};
```

结构体变化总览：

| 阶段 | 被填写的成员 |
|---|---|
| probe 开始 | `dev`、`phy_index` |
| attach_hw | `dphy_hw`，同时加入 `dphy_hw->dphy_dev[]` |
| v4l2_subdev_init | `sd.ops`、`sd.entity` 基本属性 |
| media_init | `pads[]`、`sd.entity.function`、`notifier` |
| Sensor bound | `sensors[]`、`num_sensors`，并创建 link |
| STREAMON | `data_rate_mbps`、`is_streaming`，调用 HW ops |

## 8. `v4l2_subdev_init()`：不是注册设备，只是初始化并挂 ops

调用位置：`phy-rockchip-csi2-dphy.c:589`

```c
v4l2_subdev_init(sd, &csi2_dphy_subdev_ops);
```

第二个参数是：

```c
static const struct v4l2_subdev_ops csi2_dphy_subdev_ops = {
    .core = &csi2_dphy_core_ops,
    .video = &csi2_dphy_video_ops,
    .pad = &csi2_dphy_subdev_pad_ops,
};
```

它下面还分成三组能力：

| ops 分组 | 回调 | 当前阶段怎么理解 |
|---|---|---|
| `core_ops` | `.s_power = csi2_dphy_s_power` | 上层要求 D-PHY 上电/下电时，经 runtime PM 控制硬件时钟 |
| `video_ops` | `.g_frame_interval`、`.g_mbus_config`、`.s_stream` | 查询 Sensor 帧率/总线配置，以及真正开停 D-PHY 数据流 |
| `pad_ops` | `.set_fmt`、`.get_fmt`、`.get_selection` | 处理 pad 格式和裁剪查询；本驱动主要把格式请求转发给 Sensor |

这里仍然只是保存函数指针。`probe()` 不会顺序执行这些回调；以后 V4L2 管线需要某项能力时才通过 `sd->ops` 调用。

实际实现：`drivers/media/v4l2-core/v4l2-subdev.c:694-710`

```c
void v4l2_subdev_init(struct v4l2_subdev *sd,
                      const struct v4l2_subdev_ops *ops)
{
    INIT_LIST_HEAD(&sd->list);
    BUG_ON(!ops);
    sd->ops = ops;
    sd->v4l2_dev = NULL;
    sd->flags = 0;
    sd->name[0] = '\0';
    sd->grp_id = 0;
    sd->dev_priv = NULL;
    sd->host_priv = NULL;
#if defined(CONFIG_MEDIA_CONTROLLER)
    sd->entity.name = sd->name;
    sd->entity.obj_type = MEDIA_ENTITY_TYPE_V4L2_SUBDEV;
    sd->entity.function = MEDIA_ENT_F_V4L2_SUBDEV_UNKNOWN;
#endif
}
```

逐行看：

| 行 | 作用 |
|---|---|
| `INIT_LIST_HEAD` | 初始化 subdev 用于挂链表的节点 |
| `BUG_ON(!ops)` | ops 为空属于严重编程错误 |
| `sd->ops = ops` | **真正把 D-PHY 的 power/video/pad 操作函数入口交给 V4L2** |
| `v4l2_dev = NULL` | 此时还没有绑定到上层 V4L2 device |
| `flags = 0` | 清空功能标志，probe 后面再加入 `HAS_DEVNODE` |
| `name[0] = '\0'` | 名字先清空，probe 后面用 `snprintf` 命名 |
| `grp_id/dev_priv/host_priv` | 清空分组和私有指针 |
| `entity.name = sd->name` | Media entity 与 subdev 共用名称 |
| `obj_type = V4L2_SUBDEV` | 告诉 Media Controller 这是 V4L2 subdev 对象 |
| `function = UNKNOWN` | 先给默认类型，media_init 再改成 bridge |

关键结论：

> `v4l2_subdev_init()` 只初始化对象并保存 `ops`，并没有完成异步注册，也没有创建 Sensor link。

## 9. `rockchip_csi2dphy_media_init()`：Media Graph 初始化总入口

文件：`phy-rockchip-csi2-dphy.c:427-462`

```c
static int rockchip_csi2dphy_media_init(struct csi2_dphy *dphy)
{
    int ret;

    dphy->pads[CSI2_DPHY_RX_PAD_SOURCE].flags =
        MEDIA_PAD_FL_SOURCE | MEDIA_PAD_FL_MUST_CONNECT;
    dphy->pads[CSI2_DPHY_RX_PAD_SINK].flags =
        MEDIA_PAD_FL_SINK | MEDIA_PAD_FL_MUST_CONNECT;
    dphy->sd.entity.function = MEDIA_ENT_F_VID_IF_BRIDGE;

    ret = media_entity_pads_init(&dphy->sd.entity,
                                 CSI2_DPHY_RX_PADS_NUM, dphy->pads);
    if (ret < 0)
        return ret;

    ret = v4l2_async_notifier_parse_fwnode_endpoints_by_port(
        dphy->dev, &dphy->notifier,
        sizeof(struct sensor_async_subdev), 0,
        rockchip_csi2_dphy_fwnode_parse);
    if (ret < 0)
        return ret;

    if (!dphy->notifier.num_subdevs)
        return -ENODEV;

    dphy->sd.subdev_notifier = &dphy->notifier;
    dphy->notifier.ops = &rockchip_csi2_dphy_async_ops;
    ret = v4l2_async_subdev_notifier_register(&dphy->sd, &dphy->notifier);
    if (ret) {
        v4l2_async_notifier_cleanup(&dphy->notifier);
        return ret;
    }

    return v4l2_async_register_subdev(&dphy->sd);
}
```

### 9.1 逐行作用与结构体变化

| 代码 | 结构体变化 | 大白话 |
|---|---|---|
| Source pad flags | `pads[1].flags` | D-PHY 的 pad1 是输出，必须连接下游 |
| Sink pad flags | `pads[0].flags` | D-PHY 的 pad0 是输入，必须连接 Sensor |
| `entity.function = BRIDGE` | `sd.entity.function` | D-PHY 是视频接口桥，不是 Sensor/ISP |
| `media_entity_pads_init` | `entity.num_pads/pads`，每个 pad 的 entity/index | 把两个 pad 正式挂到 D-PHY entity |
| `parse...by_port(..., 0, ...)` | `notifier.subdevs[]` | 只扫描 DTS 的 **port@0 输入端**，建立等待 Sensor 的匹配条件 |
| `!num_subdevs` | 无变化 | 一个输入 endpoint 都没有就失败 |
| `sd.subdev_notifier = ...` | subdev 回指 notifier | 声明这个 notifier 属于 D-PHY subdev |
| `notifier.ops = ...` | 保存 bound/unbind 回调 | 以后匹配成功由框架调用 `.bound()` |
| `subdev_notifier_register` | waiting 列表等 | 注册“D-PHY 正在等待哪些 Sensor” |
| `v4l2_async_register_subdev` | D-PHY 加入异步体系 | 让 D-PHY 自己也能被图像数据方向下游的 RKISP 根 notifier 匹配 |

### 9.2 这里没有解析 `port@1`

调用明确传了：

```c
..., 0, rockchip_csi2_dphy_fwnode_parse
```

这个 `0` 是 **port 编号**，所以本函数只解析 D-PHY 的 `port@0`，用于等待 IMX415 等 Sensor。

```text
port@0 → 本驱动解析，建立 Sensor notifier
port@1 → 描述输出到 isp0_in，通常由 RKISP 上层图构建逻辑处理
```

因此不要把流程图画成“D-PHY 的这个函数同时创建上下游两条 link”。

## 10. `media_entity_pads_init()`：两个 pad 怎样真正属于 entity

文件：`drivers/media/media-entity.c:206-233`

```c
int media_entity_pads_init(struct media_entity *entity, u16 num_pads,
                           struct media_pad *pads)
{
    struct media_device *mdev = entity->graph_obj.mdev;
    unsigned int i;

    if (num_pads >= MEDIA_ENTITY_MAX_PADS)
        return -E2BIG;

    entity->num_pads = num_pads;
    entity->pads = pads;

    if (mdev)
        mutex_lock(&mdev->graph_mutex);

    for (i = 0; i < num_pads; i++) {
        pads[i].entity = entity;
        pads[i].index = i;
        if (mdev)
            media_gobj_create(mdev, MEDIA_GRAPH_PAD,
                              &entity->pads[i].graph_obj);
    }

    if (mdev)
        mutex_unlock(&mdev->graph_mutex);
    return 0;
}
```

关键变化：

```text
dphy->sd.entity.num_pads = 2
dphy->sd.entity.pads = dphy->pads
dphy->pads[0].entity = &dphy->sd.entity
dphy->pads[0].index = 0
dphy->pads[1].entity = &dphy->sd.entity
dphy->pads[1].index = 1
```

所以 `media-ctl -p` 才能显示：

```text
rockchip-csi2-dphy0 (2 pads, 2 links)
pad0: Sink
pad1: Source
```

注意：pads 初始化只建立 entity 与 pad 的内存关系，不创建 link。

而且在 D-PHY probe 执行到这里时，`entity->graph_obj.mdev` 通常还是 `NULL`，所以函数内部的 `media_gobj_create()` 此时不会运行。后续 D-PHY 被 RKISP 的父 notifier 匹配后，路径才是：

```text
v4l2_async_match_notify()
→ v4l2_device_register_subdev()
→ media_device_register_entity()
→ entity 和两个 pad 真正加入 media_device
→ media-ctl 才能枚举它们
```

所以更精确的说法是：

```text
media_entity_pads_init()
= 准备好两个 pad

v4l2_device_register_subdev()
= 把 subdev/entity/pad 接入根 media_device

media_create_pad_link()
= 创建两个 pad 之间的边
```

## 11. endpoint 解析：怎样从 `remote-endpoint` 得到“等待 IMX415”

### 11.1 驱动传给框架的五个参数

```c
v4l2_async_notifier_parse_fwnode_endpoints_by_port(
    dphy->dev,                         // 从哪个设备节点开始
    &dphy->notifier,                   // 结果放到哪个 notifier
    sizeof(struct sensor_async_subdev),// 每个等待项分配多大
    0,                                 // 只解析 port@0
    rockchip_csi2_dphy_fwnode_parse);  // 驱动自己的补充解析回调
```

框架内部的核心动作：

```text
遍历 D-PHY 的 endpoint
→ 只保留 port == 0
→ 为每个 endpoint 分配 sensor_async_subdev
→ 通过 remote-endpoint 找到远端设备 fwnode
→ asd->match_type = V4L2_ASYNC_MATCH_FWNODE
→ asd->match.fwnode = 远端 Sensor 的 fwnode
→ 调用 Rockchip 的 fwnode_parse() 保存 Lane 信息
→ 放进 notifier->subdevs[]
```

对应通用代码：

```c
asd->match_type = V4L2_ASYNC_MATCH_FWNODE;
asd->match.fwnode = fwnode_graph_get_remote_port_parent(endpoint);
vep = v4l2_fwnode_endpoint_alloc_parse(endpoint);
ret = parse_endpoint ? parse_endpoint(dev, vep, asd) : 0;
notifier->subdevs[notifier->num_subdevs] = asd;
notifier->num_subdevs++;
```

这时仍未创建 link。此时只是形成：

```text
等待条件：某个已注册 v4l2_subdev 的 fwnode
          == imx415_out 远端所属的 IMX415 设备 fwnode
```

### 11.2 Rockchip 回调怎样保存四 Lane

文件：`phy-rockchip-csi2-dphy.c:385-425`

```c
if (vep->base.port != 0)
    return -EINVAL;

if (vep->bus_type == V4L2_MBUS_CSI2) {
    config->type = V4L2_MBUS_CSI2;
    config->flags = vep->bus.mipi_csi2.flags;
    s_asd->lanes = vep->bus.mipi_csi2.num_data_lanes;
} else {
    return -EINVAL;
}

switch (s_asd->lanes) {
case 1: config->flags |= V4L2_MBUS_CSI2_1_LANE; break;
case 2: config->flags |= V4L2_MBUS_CSI2_2_LANE; break;
case 3: config->flags |= V4L2_MBUS_CSI2_3_LANE; break;
case 4: config->flags |= V4L2_MBUS_CSI2_4_LANE; break;
default: return -EINVAL;
}
```

| 判断 | 为什么需要 |
|---|---|
| `port != 0` | 此回调只接受 Sensor 输入端 |
| `bus_type == CSI2` | 该驱动不支持并口等其他 bus 类型 |
| `num_data_lanes` | 从 DTS `data-lanes` 得到 Lane 数 |
| `switch` | 把整数 Lane 数转换成 V4L2 mbus flag |

你的板级 DTS 在 port@0 还列了 IMX335 和 OV13850。D-PHY 会为三个 endpoint 建立等待项，但当前只有 IMX415 真正注册。你看到的日志是：

```text
rkisp rkisp-vir0: clear unready subdev num: 2
```

前缀明确是 `rkisp`：它表示 RKISP 根 notifier 最后清除了整棵异步树里未就绪的两个 Sensor 等待项，让实际存在的 IMX415 管线能够完成。不能说成“D-PHY 驱动自己的 clear 函数成功清了两个”；当前 D-PHY 文件里的全局 device list 没有看到加入节点的代码。

## 12. notifier 注册：注册的是“等待关系”，不是立即执行 bound

### 12.1 保存回调表

```c
static const struct v4l2_async_notifier_operations
rockchip_csi2_dphy_async_ops = {
    .bound = rockchip_csi2_dphy_notifier_bound,
    .unbind = rockchip_csi2_dphy_notifier_unbind,
};
```

```c
dphy->notifier.ops = &rockchip_csi2_dphy_async_ops;
```

这里只是把函数地址保存进 ops：

```text
匹配成功时 → 调 bound
解除绑定时 → 调 unbind
```

### 12.2 `v4l2_async_subdev_notifier_register()` 做什么

```c
int v4l2_async_subdev_notifier_register(struct v4l2_subdev *sd,
                                        struct v4l2_async_notifier *notifier)
{
    int ret;

    if (WARN_ON(!sd || notifier->v4l2_dev))
        return -EINVAL;
    notifier->sd = sd;
    ret = __v4l2_async_notifier_register(notifier);
    if (ret)
        notifier->sd = NULL;
    return ret;
}
```

逐行理解：

| 行 | 意义 |
|---|---|
| 检查 `sd` 和 `v4l2_dev` | 子设备 notifier 必须属于一个 subdev，不能同时作为根 notifier |
| `notifier->sd = sd` | 记录“这个等待 Sensor 的 notifier 属于 D-PHY subdev” |
| `__...register()` | 把 subdevs 条目加入 waiting，并尝试匹配已存在 subdev |
| 出错恢复 `NULL` | 注册失败不留下半成品关系 |

### 12.3 为什么还要 `v4l2_async_register_subdev(&dphy->sd)`

D-PHY 自己也是 RKISP 上游等待的 subdev。因此它同时有两个身份：

```text
对下游 RKISP：D-PHY 是“等待被匹配的 subdev”
对上游 IMX415：D-PHY 是“拿着 notifier 等 Sensor 的管理者”
```

`v4l2_async_register_subdev()` 会：

```text
给 sd 设置 fwnode
→ 遍历已注册 notifier，尝试找匹配者
→ 若找到，执行 match_notify
→ 若暂时找不到，把 D-PHY 放入全局 subdev_list 等待
```

异步的含义就在这里：

> 无论 IMX415、D-PHY、RKISP 谁先 probe，都先注册自己的对象或等待条件；双方都出现后再匹配，不依赖固定 probe 顺序。

### 12.4 实际是嵌套 notifier 树，不是 D-PHY 独立完成匹配

D-PHY 的 Sensor notifier 刚注册时没有根 `v4l2_device`，通常只会把 Sensor 描述符放进 `waiting`。等 D-PHY 自己先被 RKISP 的父 notifier 匹配后，V4L2 Async 才把 D-PHY notifier 接到父节点，再继续匹配 IMX415：

```text
RKISP 根 notifier（拥有 v4l2_device）
        ↓ 匹配 D-PHY subdev
D-PHY 子 notifier（等待 Sensor）
        ↓ 匹配 IMX415 subdev
IMX415
```

匹配 fwnode 的核心条件非常直接：

```c
sensor_sd->fwnode == asd->match.fwnode
```

左边来自 IMX415 subdev 对应设备节点；右边来自 D-PHY endpoint 的 `remote-endpoint` 所指远端 Sensor 设备节点。

## 13. `.bound()`：真正创建 IMX415 → D-PHY link 的地方

文件：`phy-rockchip-csi2-dphy.c:314-363`

### 13.1 谁调用

不是 `media_init()` 直接调用，而是 V4L2 Async 框架在 fwnode 匹配成功后通过：

```text
v4l2_async_find_match()
→ v4l2_async_match_notify()
→ v4l2_async_notifier_call_bound()
→ notifier->ops->bound()
→ rockchip_csi2_dphy_notifier_bound()
```

框架进入 D-PHY `.bound()` 之前，会先执行：

```text
v4l2_device_register_subdev(sensor_sd)
→ 把 Sensor entity/pad 注册到根 media_device
→ 再调用 D-PHY notifier.ops->bound
```

这样 `.bound()` 里创建 link 时，Sensor 和 D-PHY 两边的 entity/pad 已经属于同一个 Media Graph。

### 13.2 关键代码逐段看

```c
dphy = container_of(notifier, struct csi2_dphy, notifier);
s_asd = container_of(asd, struct sensor_async_subdev, asd);
```

`container_of` 的意义：已知内嵌成员地址，反推出外层结构体地址。

```text
notifier 地址 → 找回整个 csi2_dphy
asd 地址      → 找回带 lanes/mbus 的 sensor_async_subdev
```

```c
sensor = &dphy->sensors[dphy->num_sensors++];
sensor->lanes = s_asd->lanes;
sensor->mbus = s_asd->mbus;
sensor->sd = sd;
```

这里把“等待时解析的 DTS 信息”和“现在真正匹配到的 Sensor subdev”合并成一个运行时 Sensor 记录。

```c
dev_info(dphy->dev, "dphy%d matches %s:bus type %d\n",
         dphy->phy_index, sd->name, s_asd->mbus.type);
```

对应你的运行时证据：

```text
rockchip-csi2-dphy csi2-dphy0:
dphy0 matches m00_b_imx415 4-001a-1:bus type 4
```

接着寻找 IMX415 的 Source pad：

```c
for (pad = 0; pad < sensor->sd->entity.num_pads; pad++)
    if (sensor->sd->entity.pads[pad].flags & MEDIA_PAD_FL_SOURCE)
        break;
```

IMX415 只有一个 `pad0 Source`，所以最后 `pad == 0`。

真正创建 link 的代码：

```c
ret = media_create_pad_link(
    &sensor->sd->entity, pad,
    &dphy->sd.entity, CSI2_DPHY_RX_PAD_SINK,
    dphy->num_sensors != 1 ? 0 : MEDIA_LNK_FL_ENABLED);
```

参数翻译：

```text
Source entity = IMX415 entity
Source pad    = IMX415 pad0
Sink entity   = rockchip-csi2-dphy0 entity
Sink pad      = D-PHY pad0
flags         = 第一个绑定的 Sensor 默认 ENABLED
```

这才得到：

```text
"m00_b_imx415 4-001a-1":0
        → "rockchip-csi2-dphy0":0 [ENABLED]
```

## 14. 静态 DTS、运行时结构体与证据一一映射

| 静态配置/代码 | 运行时证据 | 能证明什么 | 不能证明什么 |
|---|---|---|---|
| HW compatible | `csi2 dphy hw probe successfully!` | HW 节点匹配并执行到 HW probe 成功日志 | 不能证明逻辑 D-PHY、Sensor 或图像流正常 |
| 逻辑 D-PHY compatible | `csi2 dphy0 probe successfully!` | `attach_hw`、subdev/media_init 已走到成功路径 | 不能单独证明 IMX415 已异步绑定，更不能证明已出帧 |
| alias `csi2dphy0` | entity 名 `rockchip-csi2-dphy0` | `phy_index` 为 0，命名正确 | 不能证明四条物理 Lane 信号质量正常 |
| `remote-endpoint = <&imx415_out>` | `dphy0 matches m00_b_imx415...` | fwnode 匹配成功并进入 D-PHY `.bound()` | 不能证明 MIPI 包已经到达 RK3568 |
| pad flags + entity 注册 | `pad0: Sink`、`pad1: Source` | D-PHY entity 和两个 pad 已进入 Media Graph | 不能证明两个方向的 link 都已创建 |
| `.bound()` 的 `media_create_pad_link` | IMX415 → D-PHY `[ENABLED]` | Sensor Source 到 D-PHY Sink 的软件 link 存在且已启用 | 不能证明 Sensor 正在 streaming，也不能证明无 CRC/ECC 错误 |
| D-PHY 上游/下游均有 `[ENABLED]` | `media-ctl -p` 完整链路 | 软件 link 已创建并启用 | 不能证明格式一定协商成功；还需核对各 pad 的 media-bus format，并通过 `STREAMON`、抓帧和帧计数验证 |
| `data-lanes = <1 2 3 4>` | 运行时结构体 `s_asd->lanes = 4`（需断点/动态日志观察） | 软件解析得到 4 Lane | 普通 `media-ctl -p` 输出不能直接证明四条物理 Lane 都有有效信号 |

## 15. 调试时应该按什么顺序看

### 15.1 第一层：DTS 是否进入运行时

```bash
ls /sys/firmware/devicetree/base/csi2-dphy0
tr -d '\0' < /sys/firmware/devicetree/base/csi2-dphy0/status
```

实际节点路径可能随父节点不同，先用 `find` 定位。目标是确认 `status=okay`、`compatible`、`rockchip,hw`、ports 存在。

### 15.2 第二层：两个 Platform probe 是否成功

```bash
dmesg | grep -Ei 'csi2.*dphy|dphy.*probe'
```

应看到：

```text
csi2 dphy hw probe successfully!
csi2 dphy0 probe successfully!
```

如果只有第一条：重点看逻辑 driver 注册、compatible、attach_hw 和 endpoint。

### 15.3 第三层：是否异步匹配 IMX415

```bash
dmesg | grep -E 'dphy0 matches|imx415|unready subdev'
```

应看到：

```text
dphy0 matches m00_b_imx415 4-001a-1:bus type 4
```

看不到这条时，不要先怀疑 ISP 算法，应检查：

```text
IMX415 是否成功注册 v4l2_subdev
双方 remote-endpoint 是否互指
D-PHY 是否解析了正确 port@0
Sensor fwnode 是否与 notifier 条件一致
```

### 15.4 第四层：Media Graph 是否生成 link

```bash
media-ctl -p
```

目标：

```text
entity: rockchip-csi2-dphy0
pad0: Sink
  <- "m00_b_imx415 4-001a-1":0 [ENABLED]
pad1: Source
  -> "rkisp-csi-subdev":0 [ENABLED]
```

## 16. Source Insight 追踪锚点

按下列顺序搜索，不要从文件第一行漫游：

```text
1. rockchip_csi2_dphy_hw_driver
2. rockchip_csi2_dphy_hw_probe
3. platform_driver_register(&rockchip_csi2_dphy_driver)
4. rockchip_csi2_dphy_driver
5. rockchip_csi2_dphy_probe
6. rockchip_csi2_dphy_attach_hw
7. v4l2_subdev_init
8. rockchip_csi2dphy_media_init
9. media_entity_pads_init
10. v4l2_async_notifier_parse_fwnode_endpoints_by_port
11. rockchip_csi2_dphy_fwnode_parse
12. v4l2_async_subdev_notifier_register
13. v4l2_async_register_subdev
14. rockchip_csi2_dphy_notifier_bound
15. media_create_pad_link
```

每到一个函数，只回答四个问题：

```text
谁调用？
参数从哪来？
修改了哪个结构体？
运行时如何证明？
```

### 16.1 逐函数操作卡：`rockchip_csi2_dphy_probe()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | 逻辑 D-PHY driver 与 `csi2_dphy0` 匹配后进入的初始化总入口 |
| 调用关系 | Platform Core 回调 `.probe`；内部直接调用 `attach_hw()` 和 `media_init()` |
| 参数来源 | `pdev` 是由运行时 `csi2_dphy0` DTS 节点对应的 `platform_device` |
| 原始代码 | 见第 5.2 节完整函数；入口是 `rockchip_csi2_dphy_probe(struct platform_device *pdev)` |
| 逐行解释 | 见第 5.3 节：分配、匹配复核、alias、attach、subdev、Media、PM、错误标签均已拆解 |
| 结构体变化 | 创建 `csi2dphy`；写 `dev/phy_index/dphy_hw/sd`；`pdev` 保存 `sd.entity` |
| DTS 对应 | compatible、aliases 中 `csi2dphy0`、`rockchip,hw`、ports |
| 运行时证据 | `csi2 dphy0 probe successfully!` |
| 调试价值 | 判断故障停在 Platform 匹配、HW attach，还是 Media 初始化 |
| 面试表达 | “Platform Core 传入 pdev，probe 创建私有对象、关联 HW、初始化 V4L2 subdev/entity，并把 D-PHY subdev 加入异步体系；entity 真正进入 media_device 要等后续异步匹配。” |

```text
Source Insight 搜索词：rockchip_csi2_dphy_probe
建议断点：558、575、579、589、597、603 行
成功日志：csi2 dphy0 probe successfully!
典型返回值：0；分配失败 -ENOMEM；不匹配 -EINVAL；attach 失败 -ENODEV
失败时下一条检查：dmesg | grep -Ei 'csi2.*dphy|probe|attach'
```

我的回答：`DTS 是否会直接调用这个 probe？pdev 从哪里来？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> DTS 不直接调用 C 函数。DTS 节点先变成 platform_device；逻辑 D-PHY driver 注册后，Platform Core 比较 compatible，匹配成功才回调 probe。pdev 就是该 platform_device。

</details>

### 16.2 逐函数操作卡：`rockchip_csi2_dphy_attach_hw()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | 逻辑 probe 的第一项核心资源关联，早于 V4L2/Media 初始化 |
| 调用关系 | `rockchip_csi2_dphy_probe()` 直接调用；内部调用 OF 与 Platform helper |
| 参数来源 | `dphy` 是 probe 中 `devm_kzalloc` 创建的 `struct csi2_dphy` |
| 原始代码 | 见第 6.1 节主线及共享 Lane 模式分支 |
| 逐行解释 | 读 alias 决定模式；解析 `rockchip,hw`；node→pdev→drvdata；检查模式；双向保存指针 |
| 结构体变化 | `dphy_hw->lane_mode`、`dphy_hw->dphy_dev[]`、`dphy_hw->dphy_dev_num`、`dphy->dphy_hw` |
| DTS 对应 | `rockchip,hw = <&csi2_dphy_hw>`；HW 节点必须 `status = "okay"` |
| 运行时证据 | 没有独立成功日志；后续逻辑 probe 成功可间接证明 attach 成功 |
| 调试价值 | 区分“逻辑节点存在”与“真正拿到共享 D-PHY HW 对象” |
| 面试表达 | “phandle 先得到 HW device_node，再找 platform_device，最后取 HW probe 保存的 drvdata。” |

```text
Source Insight 搜索词：rockchip_csi2_dphy_attach_hw
建议断点：478、485、494、502、524、526 行
成功日志：无独立日志；观察函数返回 0 和后续 probe success
典型返回值：0；node/pdev 不存在 -ENODEV；drvdata 为空 -EINVAL；模式冲突 -ENODEV
失败时下一条检查：检查运行时 DTS 的 rockchip,hw 与 csi2_dphy_hw/status
```

我的回答：`为什么不能直接从 dphy 节点拿寄存器地址？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> 逻辑 `csi2_dphy0` 节点没有 `reg`，寄存器属于共享的 `csi2_dphy_hw`。因此必须沿 `rockchip,hw` 找到已由 HW probe 初始化的硬件对象。

</details>

### 16.3 逐函数操作卡：`v4l2_subdev_init()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | attach HW 成功后，把逻辑 D-PHY包装成 V4L2 subdev |
| 调用关系 | 逻辑 probe 直接调用；不会在函数内执行 `.s_stream` 等 ops |
| 参数来源 | `sd = &csi2dphy->sd`；`ops = &csi2_dphy_subdev_ops` |
| 原始代码 | 见第 8 节 `v4l2-subdev.c:694-710` 完整实现 |
| 逐行解释 | 初始化 list，检查并保存 ops，清空状态，建立 entity 名称指针和默认类型 |
| 结构体变化 | `sd->ops/list/v4l2_dev/flags/name/.../entity` |
| DTS 对应 | 不直接读 DTS；`sd->dev` 在调用后由 probe 指向对应 Platform device |
| 运行时证据 | 后续 entity 名与 `/dev/v4l-subdevX`；仅此调用没有独立日志 |
| 调试价值 | 确认 V4L2 回调表是否挂对，避免把“保存函数地址”误认为“执行所有函数” |
| 面试表达 | “subdev_init 初始化对象并保存 ops 指针，不创建 pad/link，也不执行 ops。” |

```text
Source Insight 搜索词：v4l2_subdev_init、csi2_dphy_subdev_ops
建议断点：D-PHY 589 行、v4l2-subdev.c 698 行
成功日志：无；断点观察 sd->ops == &csi2_dphy_subdev_ops
典型返回值：void；ops 为空会 BUG_ON
失败时下一条检查：在 Source Insight 核对 sd 和 ops 两个实参及三组子 ops
```

我的回答：`这一行是否把所有 D-PHY 功能函数都执行了一遍？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> 没有。它只把 ops 表地址保存到 `sd->ops`。格式、上电和开流函数要等 V4L2 框架未来通过对应回调入口调用。

</details>

### 16.4 逐函数操作卡：`rockchip_csi2dphy_media_init()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | subdev 基础对象完成后，建立 Media/Async 所需关系 |
| 调用关系 | 逻辑 probe 直接调用；内部调用 pads、endpoint parser、notifier 与 subdev 注册函数 |
| 参数来源 | 同一个 `csi2dphy` 私有对象 |
| 原始代码 | 见第 9 节 `phy-rockchip-csi2-dphy.c:427-462` |
| 逐行解释 | 设置 pad flags/entity function；初始化 pads；解析 port0；检查等待项；保存 ops；注册两个异步身份 |
| 结构体变化 | `pads[]`、`sd.entity`、`notifier.subdevs/waiting/ops/sd`、`sd.async_list` |
| DTS 对应 | `ports/port@0/endpoints`；不会在这里解析 `port@1` 建下游 link |
| 运行时证据 | probe success、D-PHY entity/pads、后续 Sensor match |
| 调试价值 | 是“D-PHY 已 probe 但 Media Graph 缺对象/link”时的首要入口 |
| 面试表达 | “Media init 先准备 entity/pad，再把 endpoint 转为 async 匹配条件，最后注册 notifier 和 D-PHY subdev。” |

```text
Source Insight 搜索词：rockchip_csi2dphy_media_init
建议断点：431、436、441、448、453、461 行
成功日志：无独立日志；返回 0 后 probe 才打印成功
典型返回值：0；pads/parser/notifier/subdev 注册的负错误码；无 endpoint 为 -ENODEV
失败时下一条检查：media-ctl -p；dmesg | grep -Ei 'async|notifier|endpoint|dphy'
```

我的回答：`为什么它既注册 notifier，又注册 D-PHY subdev？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> 因为 D-PHY 对 IMX415 是等待者，需要子 notifier；对 RKISP 又是被等待的 subdev，需要把自己注册进 Async 框架。

</details>

### 16.5 逐函数操作卡：`media_entity_pads_init()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | Media init 的第一项公共框架调用 |
| 调用关系 | `rockchip_csi2dphy_media_init()` 直接调用 |
| 参数来源 | entity=`&dphy->sd.entity`；num=2；pads=`dphy->pads` |
| 原始代码 | 见第 10 节 `drivers/media/media-entity.c:206-233` |
| 逐行解释 | 检查数量，保存数组，逐个写 `pad.entity` 和 `pad.index`；已有 mdev 时创建 graph object |
| 结构体变化 | `entity->num_pads/pads`，`pads[0/1].entity/index` |
| DTS 对应 | pad 数不直接从 DTS 读取，而是由驱动枚举固定为 Sink0/Source1 |
| 运行时证据 | D-PHY 后续注册到 media_device 后，`media-ctl` 显示两个 pad |
| 调试价值 | 区分“pad 内存已准备”与“link 已创建/已经出帧” |
| 面试表达 | “pads_init 建立 entity 对 pad 的所有权和编号，不负责创建 link。” |

```text
Source Insight 搜索词：media_entity_pads_init
建议断点：206、215、221 行
成功日志：无；观察 entity->num_pads == 2
典型返回值：0；pad 数过大 -E2BIG
失败时下一条检查：断点查看 CSI2_DPHY_RX_PADS_NUM、dphy->pads flags 和 entity->graph_obj.mdev
```

我的回答：`调用成功后，为什么仍不能立刻断言 media-ctl 一定能看到 D-PHY？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> 此时 entity 可能还没有根 `media_device`，只是内存关系准备好。要等 Async 匹配后通过 `v4l2_device_register_subdev()` 把 entity/pad 注册到 media_device。

</details>

### 16.6 逐函数操作卡：`v4l2_async_notifier_parse_fwnode_endpoints_by_port()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | Media init 中把静态 DTS endpoint 转成运行时等待描述符 |
| 调用关系 | media_init 直接调用 wrapper；wrapper 调通用 parser；parser 同步回调 Rockchip `fwnode_parse` |
| 参数来源 | D-PHY device、notifier、自定义 asd 大小、port=0、parse 回调 |
| 原始代码 | 见第 11 节和 `v4l2-fwnode.c:350-514` 关键代码 |
| 逐行解释 | 两遍扫描 port0；分配 asd；取 remote port parent；解析 CSI-2；写 notifier 数组 |
| 结构体变化 | `asd.match_type/fwnode`、`s_asd.mbus/lanes`、`notifier.subdevs/num_subdevs` |
| DTS 对应 | `port@0`、`remote-endpoint`、`data-lanes`、clock flags |
| 运行时证据 | 后续 `dphy0 matches ... bus type 4`；解析本身没有独立成功日志 |
| 调试价值 | 排查 endpoint 互指、port 编号和 Lane 配置是否被正确解析 |
| 面试表达 | “parser 不建 link，只把远端 Sensor fwnode 和 Lane 参数做成 async 等待条件。” |

```text
Source Insight 搜索词：v4l2_async_notifier_parse_fwnode_endpoints_by_port、rockchip_csi2_dphy_fwnode_parse
建议断点：v4l2-fwnode.c 504、365、374、382、394；D-PHY 398、401 行
成功日志：无；观察 notifier->num_subdevs 和 s_asd->lanes
典型返回值：0；端口/总线/Lane 无效为 -EINVAL；内存不足 -ENOMEM
失败时下一条检查：media-ctl -p 前先核对运行时 DTS 的 port@0、remote-endpoint、data-lanes
```

我的回答：`remote-endpoint 在这里为什么没有直接变成 Media link？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> parser 只知道“应该等待哪个远端 fwnode”，此时远端 Sensor subdev 可能还没注册。只有异步匹配成功，双方运行时 entity/pad 都存在后，`.bound()` 才创建 link。

</details>

### 16.7 逐函数操作卡：`v4l2_async_subdev_notifier_register()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | endpoint 已解析后，正式登记 D-PHY 等待 Sensor 的关系 |
| 调用关系 | media_init 直接调用；内部进入 `__v4l2_async_notifier_register()` |
| 参数来源 | `sd=&dphy->sd`；`notifier=&dphy->notifier` |
| 原始代码 | 见第 12.2 节 `v4l2-async.c:511-527` |
| 逐行解释 | 参数检查；写 `notifier->sd`；初始化 waiting/done；加入 asd；尝试匹配；加入全局 notifier list |
| 结构体变化 | `notifier.sd/waiting/done/list`，每个 `asd.list` |
| DTS 对应 | 使用前一步由 DTS endpoint 生成的 asd，不再重新解析 DTS |
| 运行时证据 | 后续 `.bound()` 日志和 link；注册动作没有独立成功日志 |
| 调试价值 | 判断等待项是否进入 waiting、为何当前还没执行 bound |
| 面试表达 | “注册 notifier 只是登记等待关系；没有根 v4l2_device 时通常不会立即绑定 Sensor。” |

```text
Source Insight 搜索词：v4l2_async_subdev_notifier_register、__v4l2_async_notifier_register
建议断点：511、519、521；内部 waiting 添加与 try_all_subdevs
成功日志：无；观察 notifier->sd、waiting、parent、v4l2_dev
典型返回值：0；参数/重复 fwnode 等错误为负值
失败时下一条检查：查看 notifier->num_subdevs、waiting，以及 D-PHY 是否已被 RKISP 父 notifier 匹配
```

我的回答：`notifier 注册成功，是否意味着 IMX415 已经 bound？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> 不一定。注册成功只证明等待关系进入框架；只有 fwnode 匹配成功并执行 `.bound()`，才说明 IMX415 真正绑定并开始创建 link。

</details>

### 16.8 逐函数操作卡：`rockchip_csi2_dphy_notifier_bound()`

| 固定字段 | 内容 |
|---|---|
| 流程位置 | Sensor fwnode 匹配成功后的结果处理，是上游 link 的真正创建点 |
| 调用关系 | V4L2 Async 框架经 `notifier->ops->bound` 回调；内部调用 `media_create_pad_link()` |
| 参数来源 | notifier 属于 D-PHY；sd 是匹配到的 IMX415 subdev；asd 是对应 endpoint 描述符 |
| 原始代码 | 见第 13 节 `phy-rockchip-csi2-dphy.c:314-363` |
| 逐行解释 | container_of；容量检查；保存 Sensor/Lane；找 Source pad；创建 enabled link；返回状态 |
| 结构体变化 | `dphy->sensors[]/num_sensors` 和 Media link 图 |
| DTS 对应 | asd 由 `mipi_in_ucam1 ↔ imx415_out` 和 `data-lanes` 产生 |
| 运行时证据 | `dphy0 matches m00_b_imx415...`、IMX415→D-PHY `[ENABLED]` |
| 调试价值 | 区分“notifier 等待中”与“已经找到 Sensor 并建 link” |
| 面试表达 | “bound 合并匹配到的 Sensor subdev 与 endpoint 参数，并显式创建 Sensor Source 到 D-PHY Sink 的 link。” |

```text
Source Insight 搜索词：rockchip_csi2_dphy_notifier_bound、media_create_pad_link
建议断点：320、331、336、339、351 行
成功日志：dphy0 matches m00_b_imx415 4-001a-1:bus type 4
典型返回值：0；Sensor 槽满 -EBUSY；无 Source pad -ENXIO；建 link 失败返回相应错误
失败时下一条检查：media-ctl -p；核对 IMX415 entity 是否有 Source pad，以及两者是否属于同一 media_device
```

我的回答：`哪一行才真正把 DTS 的静态连接变成运行时 link？`

<details>
<summary>完成回答后再展开正确答案</summary>

> [!success] 正确答案
> `.bound()` 中的 `media_create_pad_link(&sensor->sd->entity, pad, &dphy->sd.entity, CSI2_DPHY_RX_PAD_SINK, flags)`。

</details>

## 17. 本节面试优先级

### 必须能说清楚

1. 为什么 D-PHY 是 Platform Driver，而 IMX415 是 I2C Driver？
2. RK3568 BSP 为什么拆成 `csi2_dphy_hw` 和 `csi2_dphy0`？
3. `rockchip,hw` 怎样从 DTS 进入 `dphy->dphy_hw`？
4. `v4l2_subdev_init()` 做了什么，没做什么？
5. `media_entity_pads_init()` 与 `media_create_pad_link()` 有什么区别？
6. `remote-endpoint` 为什么不能理解为“DTS 解析时已经建好 link”？
7. Sensor 和 D-PHY probe 顺序不固定，Linux 怎样最终把它们绑定？
8. 怎样用 dmesg 与 `media-ctl -p` 证明链路到 D-PHY 已建立？

### 暂时只需认识

```text
fwnode 引用计数细节
async 框架所有链表的内部实现
GRF 寄存器位定义
D-PHY hsfreq 表计算
runtime PM 内部状态机
```

## 18. 面试表达模板

> RK3568 的 CSI2 D-PHY 在 Rockchip 4.19 BSP 中分成物理 HW driver 和逻辑 D-PHY driver。HW driver 由 Platform Core 根据 `rockchip,rk3568-csi2-dphy-hw` 匹配，负责映射寄存器并提供硬件 stream_on/off；随后它注册逻辑 D-PHY driver。逻辑 probe 通过 `rockchip,hw` phandle 取得 HW 对象，再初始化 V4L2 subdev 和一对 Sink/Source pad。驱动只解析 port@0 的 Sensor endpoint，建立 fwnode 异步等待条件。IMX415 subdev 注册后，V4L2 Async 框架匹配双方并回调 `.bound()`，最终用 `media_create_pad_link()` 创建 IMX415 Source 到 D-PHY Sink 的 enabled link。运行时可以用 dmesg 的 `dphy0 matches imx415` 和 `media-ctl -p` 验证。

## 19. 学习验收：先用自己的话回答

> 回答时不要复制上面的模板。写出自己的理解后，再让我把正确答案高亮补在你的答案下面。

1. `module_platform_driver(rockchip_csi2_dphy_hw_driver)` 注册的是哪个对象？为什么不是直接注册 IMX415？
2. HW probe 中的 `platform_driver_register(&rockchip_csi2_dphy_driver)` 是不是直接调用逻辑 `probe()`？
3. `pdev` 从哪里来？`pdev->dev.of_node` 指向哪个 DTS 节点？
4. `rockchip,hw = <&csi2_dphy_hw>` 最终经过哪三个函数/对象变成 `dphy->dphy_hw`？
5. `v4l2_subdev_init()` 把什么交给 V4L2？为什么它不等于“Media Graph 已完成”？
6. `media_entity_pads_init()` 做了什么？它有没有创建 IMX415 → D-PHY link？
7. `parse_fwnode_endpoints_by_port(..., 0, ...)` 中的 `0` 是什么？
8. `data-lanes = <1 2 3 4>` 最后保存在哪些结构体成员里？
9. `.bound()` 是谁调用的？什么条件满足时调用？
10. 哪一行代码真正创建了 IMX415 Source → D-PHY Sink link？
11. 为什么你的日志会出现 `rkisp rkisp-vir0: clear unready subdev num: 2`？为什么不能说成 D-PHY 自己清理了两个？
12. `dphy0 probe successfully` 能证明什么，不能证明什么？

### 我的回答

```text
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
```

## 20. 本节边界与下一步

本笔记已经追到：

```text
IMX415 V4L2 subdev
→ 异步匹配
→ D-PHY Sink pad
→ D-PHY Source pad
```

下一步不是立即钻进所有 V4L2 Core，而是继续追：

```text
D-PHY Source
→ rkisp-csi-subdev
→ rkisp-isp-subdev
```

也就是回答：`port@1 ↔ isp0_in` 由谁解析、RKISP 怎样创建下游 link，以及 RAW10 在 CSI/RKISP 各 entity 之间怎样传递。
