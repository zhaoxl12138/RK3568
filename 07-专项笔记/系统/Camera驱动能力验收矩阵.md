# Camera 驱动能力验收矩阵

这份表只回答“具备什么能力才算过关”。能力编号独立于课程顺序，每项显式映射到一个或多个 `course-stage`。

## 验收规则

- **已验证**：能在当前 RK3568 + IMX415 板子上给出命令输出、日志、Media Graph 或抓帧结果。
- **源码对照**：能指出 DTS 属性进入哪个内核结构，最终由哪个函数消费。
- **面试复述**：先说结论，再按数据流或调用链解释，最后补充常见故障与验证方法。
- **未通过**：只会背名词、只会执行命令，或者无法解释“为什么查这一层”。

## 能力总表

| 能力 ID | 能力 | course-stage | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|---|---|
| C01 | 原理图与 DTS 映射 | 00, 02, 03 | Sensor 的供电、I2C、MCLK、RESET、PDN 和 MIPI Lane 怎样映射进 DTS | 原理图位置、实际 DTS 路径和节点逐行解释 | 能从新模组原理图列出必须确认的 DTS 资源 | [[03-IMX415-Sensor-Bring-up]] |
| C02 | Sensor 驱动与 probe | 01, 02, 03 | DTS 节点怎样变成 I2C client，并调用 `imx415_probe()` | `4-001a-1`、driver 绑定、Sensor ID 日志和函数调用链 | 能解释设备与驱动最终在哪里匹配 | [[03-IMX415-Sensor-Bring-up]] |
| C03 | MIPI D-PHY 与 CSI-2 | 04 | RAW10 怎样通过差分 Lane 进入 SoC | endpoint、Lane 配置、D-PHY entity 和 CSI entity | 能区分 D-PHY、CSI-2 与 I2C 控制通道 | [[04-MIPI-CSI2-DPHY]] |
| C04 | endpoint 与 Media Graph | 04, 06 | 两端 endpoint 怎样形成 entity、pad、link | `media-ctl -p` 完整拓扑 | 能沿 ENABLED link 从 Sensor 追到 RKISP | [[2026-07-28-直连板端读取IMX415配置]] |
| C05 | RKISP 数据处理 | 07 | RKISP 接收什么、处理什么、输出什么 | ISP sink/source 格式与 crop 信息 | 能解释 RAW Bayer 如何形成 YUV/NV12 | [[AI Camera系统数据流与模块边界]] |
| C06 | V4L2、VB2 与取流 | 05, 08 | video 节点怎样创建，应用怎样取得帧 | 格式列表、queue 状态和成功抓帧 | 能解释 video_device、vb2 queue 与缓冲区流转 | [[V4L2命令行抓帧记录]] |
| C07 | controls 与 stream | 03, 05 | 曝光、增益、格式和开流怎样进入 Sensor 寄存器 | control、`set fmt`、`set exposure` 或寄存器日志 | 能区分 probe 成功与真正 stream on | [[03-IMX415-Sensor-Bring-up]] |
| C08 | 分层故障定位 | 11 | 无节点、有节点无图、Sensor ID 失败和帧异常分别从哪里查 | 一份按层次排列的排查记录 | 能根据现象选择第一检查层 | [[AI Camera故障排查索引]] |
| C09 | 新 Sensor 移植与证据 | 02, 03, 04, 06, 07, 08, 11 | 换 Sensor 要改哪些硬件、DTS、驱动和 mode 表，怎样证明链路工作 | 移植清单及 DTS、I2C、probe、Media Graph、抓帧证据 | 每项结论都能回到当前板卡原始输出 | [[2026-07-28-Camera驱动Day1验收]] |
| C10 | 应用衔接与面试复述 | 09, 10, 11 | 怎样在 3～5 分钟讲清 Camera 初始化、出图与扩展链路 | 口述稿、追问回答和一次模拟面试 | 不看笔记讲清主线并回答至少三个故障追问 | [[Camera驱动求职第1周执行计划]] |

## 每项能力复盘模板

```markdown
### 本项能力结论

- 我能先说出的结论：
- 对应的硬件 / DTS / 源码位置：
- 当前板端证据：
- 面试官继续追问时我能解释：
- 仍不确定：
- 关联 course-stage：
```

## 最容易混淆的边界

- I2C client 创建成功，不等于 Sensor 已经上电并读到 ID。
- Sensor ID 正常，不等于 MIPI Lane、频率、时序和 endpoint 正确。
- Media Graph 完整，不等于已经成功排队缓冲区并收到帧。
- `/dev/video0` 存在，不等于格式、分辨率和应用协商正确。
- 能出图，不等于能独立移植一颗新 Sensor；移植还要回到原理图、数据手册、DTS 和驱动 mode 表。
