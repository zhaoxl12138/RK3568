# RK3568 IMX415 Camera 驱动｜第 1 周执行计划

> 本周唯一主线：基于你已经点亮的 **RK3568 + IMX415**，从原理图、设备树、I2C 驱动到 `/dev/video0`，完整吃透一次真实的 Linux Camera Sensor 初始化和数据链路。

> 本文件是当前 Camera 求职学习的唯一执行入口；技术内容、回答和正确答案保存在对应章节。

## 零、当前学习位置

```text
第 1 章：IMX415 Sensor 与驱动                 ✅ 技术内容完成 / 📝 面试复盘待答
第 2 章：MIPI D-PHY 与 CSI-2                 ⏳ 学习中
第 3 章：RKISP                               ⬜ 未开始
第 4 章：Media Controller                    ⬜ 未开始
第 5 章：V4L2、VB2 与 /dev/video0           ⬜ 未开始
```

每轮固定训练四种面试能力：

1. **概念解释**：能区分当前模块和上下游职责。
2. **当前项目证据**：能在 RK3568 + IMX415 的原理图、DTS、源码或板端输出中举证。
3. **故障定位**：能先判断故障层，再给检查顺序和判断条件。
4. **面试表达**：能在 60～90 秒内按“结论 → 项目 → 证据 → 排障”回答。

## 一、本周不再做什么

三年前的手机 Camera 项目与当前板载 IMX415 的软件栈不同，不能作为每日任务或验收门槛：

```text
手机 Camera：Android / HAL / 供应商框架 / AF、Flash、EEPROM 等模组协作
当前主线：Linux DTS / I2C Sensor 驱动 / MIPI CSI-2 / RKISP / V4L2
```

旧手机项目经验只在本周结束后，作为“面试经历迁移”单独整理；本周不要求回忆完整项目，也不因遗忘旧项目而卡住学习。

## 二、本周最终结果

到本周结束，能够基于当前实板，不看资料讲清楚：

```text
主板与 IMX415 模组怎么连接
  → DTS 为什么把 imx415@1a 放在 I2C4
  → I2C Core 如何创建 4-001a-1 并匹配 imx415 驱动
  → imx415_probe() 如何获取资源、上电并读取 ID
  → endpoint 如何把 Sensor 接到 CSI-2 D-PHY / RKISP
  → Media Graph 如何最终产生 /dev/video0
```

每一天只认可三类证据：实板命令输出、实际源码/DTS行号、原理图位置。没有证据就标记为“未确认”。

## 三、7 天安排

### Day 1｜已完成：设备树到 `imx415_probe()`

完成事实：

- [x] 从运行时 DTS 找到 `/i2c@fe5d0000/imx415@1a`。
- [x] 确认 `compatible = "sony,imx415"`、`reg = <0x1a>`、`status = "okay"`。
- [x] 确认 I2C client 为 `4-001a-1`，已经绑定 `imx415` 驱动。
- [x] 理解 `sensor_mod_init()` 注册驱动，I2C Core 通过匹配后回调 `imx415_probe()`。
- [x] 用日志确认真实硬件 I2C 读 ID 成功：`Detected imx415 id 0000e0`。

当天结论：`compatible` 是软件匹配标识；Sensor ID 是 probe 后经真实 I2C 读寄存器得到的硬件确认。

函数调用图：[[Camera驱动第1章-IMX415-Sensor与驱动#4.1 函数调用流程图]]

#### Day 1 回顾题｜2026-07-29

> 先用自己的话回答。回答完成后，把内容发给我；我会逐题判断，并将 `<mark>正确答案：</mark>` 写在你的答案下面。

1. `imx415@1a` 中的 `1a` 是什么意思？

   **我的回答：**1a表示设备的地址

   <mark>判断：正确。</mark>

   <mark>正确答案：</mark> `1a` 是该节点的 unit-address，对应 `reg = <0x1a>`，表示 IMX415 在当前 I2C 总线上的 7 位从设备地址 `0x1a`。

2. `4-001a-1` 中，`4` 和 `001a` 分别表示什么？

   **我的回答：**4代表的第四个I2C 001a表示设备的地址

   <mark>判断：基本正确，表述需要精确。</mark>

   <mark>正确答案：</mark> `4` 表示 Linux 中编号为 4 的 I2C adapter，也就是当前板子的 I2C4；`001a` 表示从设备地址 `0x1a`。不要机械理解成“发现的第四个 I2C 设备”。末尾的 `-1` 是当前 Rockchip 厂商驱动生成的实例命名部分，本阶段不依靠它判断总线或地址。

3. `sensor_mod_init()` 是否直接调用 `imx415_probe()`？如果不是，真正是谁调用的？

   **我的回答：**不是直接调用的 是I2C总线调用的

   <mark>判断：方向正确，但“I2C 总线调用”不够准确。</mark>

   <mark>正确答案：</mark> `sensor_mod_init()` 只通过 `i2c_add_driver()` 注册 `imx415_i2c_driver`。设备与驱动匹配成功后，由 Linux 驱动模型和 I2C Core 通过驱动的 `.probe` 回调调用 `imx415_probe(client, id)`。

4. `compatible` 匹配成功，能否证明板子上真的连接了 IMX415？为什么？

   **我的回答：**不能 不知道

   <mark>判断：结论正确，原因没有回答。</mark>

   <mark>正确答案：</mark> 不能。`compatible` 只是 DTS 与驱动 `of_match_table` 之间的软件字符串匹配，即使 DTS 写错了型号也可能完成匹配。必须在 `probe()` 中完成上电、退出复位，并通过真实 I2C 读取正确的 Sensor ID，才能确认硬件通信和型号。

5. 哪一条日志可以证明 Sensor 已经完成基本上电、退出复位，并能够通过 I2C 返回芯片 ID？

   **我的回答：**imx415_check_sensor_id

   <mark>判断：不正确。你写的是执行检查的函数名，题目问的是板端日志证据。</mark>

   <mark>正确答案：</mark>

   ```text
   imx415 4-001a-1: Detected imx415 id 0000e0
   ```

   这条日志来自 `imx415_check_sensor_id()` 成功读取并校验芯片 ID 之后。

### Day 2｜读懂 `imx415_probe()` 的初始化资源与上电

目标：将 `imx415_probe()` 的关键代码与 DTS 属性、原理图控制线一一对应。

必须回答：

- `xvclk`、`reset-gpios`、`power-gpios`、`pinctrl`、`dvdd/dovdd/avdd` 分别从哪里来。
- `__imx415_power_on()` 的执行顺序，以及每一步对应的硬件作用。
- 为什么当前板子出现 `using dummy regulator` 仍能成功读取 ID。
- `imx415_check_sensor_id()` 做了什么，为什么它是 I2C 通信的关键证据。

实板/源码证据：

```text
drivers/media/i2c/imx415.c
__imx415_power_on()
imx415_check_sensor_id()
dmesg 中 imx415 的供电、时钟、ID 日志
```

#### Day 2 第 1 轮回答与订正｜2026-07-30

1. `imx415_probe()` 从哪里取得 DTS 节点？

   **我的回答：**不太确定，`i2c_client` 里面的吧。

   <mark>判断：方向正确。</mark>

   <mark>正确答案：</mark> I2C Core 调用 `imx415_probe(client, id)` 时把已经关联 DTS 节点的 `i2c_client` 传进来。驱动通过下面两行取得节点：

   ```c
   struct device *dev = &client->dev;
   struct device_node *node = dev->of_node;
   ```

   因此入口是 `client->dev.of_node`，它指向运行时的 `/i2c@fe5d0000/imx415@1a`。

2. 时钟、RESET、PDN 分别怎么从 DTS 进入驱动？

   **我的回答：**不是一开始就注册了么？

   <mark>判断：不正确。这里混淆了“注册驱动”和“获取当前设备资源”。</mark>

   <mark>正确答案：</mark> `sensor_mod_init()` 注册 `imx415_i2c_driver` 时，只登记匹配表和回调函数，不会取得某一块板子的 GPIO、时钟。匹配成功进入 `imx415_probe()` 后，驱动才以 `client->dev` 为入口向内核资源框架申请资源：

   ```text
   devm_clk_get(dev, "xvclk")
   ↔ clock-names = "xvclk" + clocks

   devm_gpiod_get(dev, "reset", ...)
   ↔ reset-gpios

   devm_gpiod_get(dev, "power", ...)
   ↔ power-gpios（当前原理图中的 PDN/使能控制线）
   ```

   这些 API 根据 `dev->of_node` 找到同一个 `imx415@1a` 节点，再把 DTS 描述转换成驱动可使用的 clock/GPIO descriptor。

3. `__imx415_power_on()` 的上电顺序是什么？

   **我的回答：**`power_gpio, 1 → usleep_range → reset_gpio, 0 → usleep_range → clk_set_rate → clk_prepare_enable → usleep_range`。

   <mark>判断：后半段顺序基本正确，但漏掉了 pinctrl 和 regulator。</mark>

   <mark>正确答案：</mark>

   ```text
   pinctrl_select_state(pins_default)
   → regulator_bulk_enable(dvdd/dovdd/avdd)
   → power_gpio = 1
   → 等待 10～20 ms
   → reset_gpio = 0（ACTIVE_LOW 下表示解除复位，物理引脚拉高）
   → 等待 10～20 ms
   → clk_set_rate(xvclk, IMX415_XVCLK_FREQ_37M)
   → clk_prepare_enable(xvclk)
   → 等待 20～30 ms
   → 允许开始 I2C 通信
   ```

4. 为什么当前板子出现 dummy regulator，但仍能正常工作？

   **我的回答：**有板子供电。我没找到函数具体判断位置。

   <mark>判断：硬件原因方向正确，需要把具体代码路径补完整。</mark>

   <mark>正确答案：</mark> IMX415 驱动先在 `imx415_configure_regulators()` 中调用：

   ```text
   devm_regulator_bulk_get()
   → regulator_bulk_get()
   → _regulator_get()
   ```

   当前 DTS 没有 `dvdd-supply`、`dovdd-supply`、`avdd-supply`，`_regulator_get()` 查找失败后使用 `dummy_regulator_rdev`，并打印 `using dummy regulator`。dummy regulator 只让软件供电接口继续工作，不会产生真实电压。真实硬件由模组输入的 VCC3.3 经过板载 LDO 生成 AVDD≈2.8V、DOVDD≈1.8V、DVDD≈1.2V，所以仍能读取 ID。

   > [!important] 供电时序补充
   > `power-gpios` 只对应一根 `CSI_PDN` 控制线，不能分别控制三路 LDO，也不等于 Sony 时序图中的三条电源曲线。Sony 原图、`XCLR` 映射、最低时间参数及当前驱动的实际控制边界，统一整理在 [[Camera驱动第1章-IMX415-Sensor与驱动#2.4 Sony 芯片上电时序与 ATK 模组控制]]。

5. `Detected imx415 id 0000e0` 是哪段代码产生的？

   **我的回答：**`imx415_check_sensor_id`。

   <mark>判断：正确，补充到具体语句。</mark>

   <mark>正确答案：</mark> `imx415_check_sensor_id()` 先调用 `imx415_read_reg()` 读取 `IMX415_REG_CHIP_ID`，比较结果与 `CHIP_ID`；匹配后执行：

   ```c
   dev_info(dev, "Detected imx415 id %06x\n", CHIP_ID);
   ```

6. 读取 Sensor ID 成功能证明什么，不能证明什么？

   **我的回答：**说明物理识别到 415。不能说明就能出图。

   <mark>判断：正确。</mark>

   <mark>正确答案：</mark> 它证明 Sensor 已具备基本供电、时钟和退出复位条件，I2C4 能访问 `0x1a`，读取值与 IMX415 的预期 ID 一致。它不能证明 endpoint/Media Graph 已绑定、MIPI CSI-2 已有数据、RKISP 已完成处理、应用已经 stream on，也不能证明图像内容和质量正常。

通过标准：能按顺序讲出“资源获取 → 上电 → 读 ID”，并明确哪些是 DTS 描述、哪些是驱动实际动作。

### Day 3｜endpoint 到 CSI-2 D-PHY 的绑定

目标：搞清 `port/endpoint/remote-endpoint/data-lanes` 不是 I2C 配置，而是图像数据路径描述。

必须回答：

- IMX415 为什么同时需要 I2C 和 MIPI CSI-2。
- `imx415_out` 的另一端 `mipi_in_ucam1` 在哪个 DTSI 文件。
- 4 条 data lane 如何对应原理图中的 `CSI_D0~D3`。
- `rockchip-csi2-dphy ... matches m00_b_imx415` 日志证明了什么。

通过标准：能在源码与运行时 `media-ctl -p` 中指出 Sensor → D-PHY 的同一条连接。

### Day 4｜RKISP、Media Graph 与 `/dev/video0`

目标：从 Media Graph 解释“为什么成功 probe 后最终会出现视频节点”。

必须回答：

- `v4l2_subdev`、CSI D-PHY、RKISP、`rkisp_mainpath` 的职责。
- `SGBRG10_1X10` 在哪里出现，代表什么。
- `/dev/video0` 为什么输出 NV12，而不是 Sensor 原始 RAW10。
- `Async subdev notifier completed` 在链路中的位置。

通过标准：能画并讲清：

```text
IMX415 RAW10 → CSI-2 D-PHY → RKISP → rkisp_mainpath → /dev/video0 NV12
```

### Day 5｜从零接入新 Sensor 时改什么

目标：将当前成功案例抽象成可迁移的 bring-up 清单。

必须整理：

- 内核已有 Sensor 驱动时，DTS 必须新增/核对哪些属性。
- 内核没有驱动时，驱动侧必须增加哪些内容：源码、Kconfig、Makefile、`of_match_table`。
- 原理图中必须先确认的项目：电源、MCLK、RESET、PWDN、I2C、MIPI lanes。
- 什么情况下改 DTS，什么情况下改 Sensor 模式表/驱动寄存器。

通过标准：面对“新板子 + 新 Camera 模组”，能给出从原理图到 `/dev/videoX` 的正确操作顺序。

### Day 6｜四类故障的固定排查法

目标：不制造故障，只用当前成功链路建立排障顺序。

| 故障现象 | 第一检查点 | 最小证据 |
|---|---|---|
| 没有 I2C client | DTS 的 I2C 节点、`reg`、I2C 控制器 | `/sys/bus/i2c/devices` |
| 没有 probe / ID | `compatible`、时钟、GPIO、电源、I2C 波形 | `dmesg`、Chip ID |
| 有 ID、无 MIPI 图像 | RESET/PWDN/MCLK、lane、格式、链路频率 | D-PHY/CSI 日志、Media Graph |
| 有 Sensor、无 `/dev/video0` | endpoint、异步 notifier、RKISP | `media-ctl -p`、`/dev/video*` |

通过标准：能给出每一类问题的第一条命令、判断条件和下一步。

### Day 7｜实板证据包与面试表达

目标：只复盘，不扩展新主题。

必须产出：

- 一张“IMX415 初始化函数调用图”。
- 一张“原理图 → DTS → 驱动 → Media Graph”证据表。
- 3 分钟讲解稿：当前板子如何把 IMX415 变成 `/dev/video0`。
- 10 个围绕本板子的高频面试问答。
- 一份仍未理解的最小问题清单，作为下周入口。

通过标准：不依赖旧手机项目，也能以当前实板证据完成一次 Camera Sensor bring-up 讲解。

## 四、学习规则

1. 一次只追一条链路；不因为遇到陌生函数就跳到新主题。
2. 所有“已经理解”都必须能对应到实板输出、源码行号或原理图位置。
3. 当前阶段只读、只验证；没有明确实验目的时不修改 DTS、不写 Sensor 寄存器、不解绑驱动。
4. 每次回答后保留原答案，再补充高亮正确答案、当前板子证据和一个面试追问。

## 五、固定资料入口

- [[Camera驱动第1章-IMX415-Sensor与驱动]]：原理图、DTS、I2C Core、probe 与 Sensor subdev。
- [[Camera驱动第2章-MIPI-DPHY与CSI2]]：Lane、D-PHY、CSI-2、endpoint 与运行时数据链路。
