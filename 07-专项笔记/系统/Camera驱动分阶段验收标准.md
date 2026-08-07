# Camera 驱动分阶段验收标准

这份表只回答“学到什么程度才算过关”。每个阶段必须同时有：能观察的板端证据、能指出的源码或 DTS 入口、能脱离笔记说清的面试回答。

## 验收规则

- **已验证**：能在当前 RK3568 + IMX415 板子上给出命令输出、日志、Media Graph 或抓帧结果。
- **源码对照**：能指出 DTS 属性进入哪个内核结构，最终由哪个函数消费。
- **面试复述**：先说结论，再按数据流或调用链解释，最后补充常见故障与验证方法。
- **未通过**：只会背名词、只会执行命令，或者无法解释“为什么查这一层”。

## 阶段总表

| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|
| 0 原理图与 DTS | Sensor 的供电、I2C、MCLK、RESET、PDN 和 MIPI Lane 怎样映射进 DTS | 原理图位置、实际 DTS 路径和节点逐行解释 | 能从一个新模组的原理图列出必须确认的 DTS 资源 | [[Camera驱动第1章-IMX415-Sensor与驱动]] |
| 1 Sensor 驱动与 probe | DTS 节点怎样变成 I2C client，并调用 `imx415_probe()` | `4-001a-1`、driver 绑定、Sensor ID 日志和函数调用链 | 能解释驱动注册与设备创建为何可以先后并行、最终在哪里匹配 | [[Camera驱动第1章-IMX415-Sensor与驱动]] |
| 2 MIPI D-PHY 与 CSI-2 | RAW10 怎样通过差分 Lane 进入 SoC | endpoint、Lane 配置、D-PHY entity 和 CSI entity | 能区分 D-PHY 物理层、CSI-2 协议层与 I2C 控制通道 | [[Camera驱动第2章-MIPI-DPHY与CSI2]] |
| 3 endpoint 与 Media Graph | 两端 endpoint 怎样形成 entity、pad、link | `media-ctl -p` 完整拓扑 | 能从 Sensor 沿 ENABLED link 追到 RKISP，并解释 Sink/Source pad | [[2026-07-28-直连板端读取IMX415配置]] |
| 4 RKISP | RKISP 接收什么、处理什么、输出什么 | ISP sink/source 格式与 crop 信息 | 能解释 RAW Bayer 进入 ISP 后为何可以得到 YUV/NV12 | [[AI Camera系统数据流与模块边界]] |
| 5 V4L2、VB2 与 `/dev/video0` | video 节点怎样创建，应用怎样取得帧 | `v4l2-ctl --all`、格式列表和成功抓帧 | 能解释 video_device、vb2 queue、multiplanar 和缓冲区流转 | [[V4L2命令行抓帧记录]] |
| 6 controls 与 stream | 曝光、增益、格式和开流怎样进入 Sensor 寄存器 | control 输出、`set fmt`、`set exposure` 或寄存器日志 | 能说清 probe 成功与真正 stream on 的区别 | [[Camera驱动第1章-IMX415-Sensor与驱动]] |
| 7 分层故障定位 | 有节点无图、无节点、Sensor ID 失败、帧异常分别从哪里查 | 一份按层次排列的排查记录 | 能根据现象选择电源/I2C/MIPI/ISP/V4L2 中的第一检查点 | [[AI Camera故障排查索引]] |
| 8 新 Sensor 移植 | 换一颗 Sensor 时要改哪些硬件、DTS、驱动和 mode 表 | 移植清单与最小改动范围 | 能说明哪些来自数据手册，哪些来自板级原理图，哪些必须实测 | [[IMX415驱动调试与最小demo路线]] |
| 9 实板证据包 | 如何证明这条链路确实在自己的板子上工作 | DTS、I2C、probe、Media Graph、格式和抓帧证据 | 任一结论都能回到当前板卡的原始输出 | [[2026-07-28-Camera驱动Day1验收]] |
| 10 面试复述 | 怎样在 3～5 分钟讲清 Camera 驱动初始化和出图链路 | 口述稿、追问回答和一次模拟面试 | 不看笔记讲清主线，能回答至少三个故障追问 | [[Camera驱动求职第1周执行计划]] |

## 每阶段复盘模板

```markdown
### 本阶段结论

- 我能先说出的结论：
- 对应的硬件 / DTS / 源码位置：
- 当前板端证据：
- 面试官继续追问时我能解释：
- 仍不确定：
- 下一阶段接口：
```

## 最容易混淆的边界

- I2C client 创建成功，不等于 Sensor 已经上电并读到 ID。
- Sensor ID 正常，不等于 MIPI Lane、频率、时序和 endpoint 正确。
- Media Graph 完整，不等于已经成功排队缓冲区并收到帧。
- `/dev/video0` 存在，不等于格式、分辨率和应用协商正确。
- 能出图，不等于能独立移植一颗新 Sensor；移植还要回到原理图、数据手册、DTS 和驱动 mode 表。
