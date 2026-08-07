# RK3568 + IMX415 Camera 驱动学习库

这是一个面向 Camera 驱动岗位的 Obsidian 学习库。目标不是继续扩展 AI Camera 演示项目，而是基于真实 RK3568 开发板、IMX415 模组、原理图、DTS、Linux 内核源码和板端日志，重新建立可操作、可调试、可面试表达的驱动能力。

## 最短入口

1. [[00-RK3568学习主入口|Obsidian 主入口]]
2. [[Camera驱动求职第1周执行计划|第 1 周执行计划]]
3. [[Camera驱动第1章-IMX415-Sensor与驱动|第 1 章：IMX415 Sensor 与驱动]]
4. [[Camera驱动第2章-MIPI-DPHY与CSI2|第 2 章：MIPI D-PHY 与 CSI-2]]
5. [Phase0 驱动链路可视化](04-项目/10-Phase0-可视化总入口.html)

也可以打开 [Camera 驱动网页学习站](00-首页/学习驾驶舱/index.html) 浏览可视化和已经发布的章节。

## 当前主线

```text
原理图与 Sensor 数据手册
→ BoardConfig / DTS
→ I2C client 与驱动匹配
→ imx415_probe()、上电和 Sensor ID
→ MIPI D-PHY / CSI-2
→ Media Controller
→ RKISP
→ V4L2 / VB2 / /dev/video0
→ 故障定位、Sensor 移植与面试复述
```

## 目录职责

- `00-首页`：唯一总入口和网页学习站。
- `04-项目`：Phase0 与 IMX415 驱动链路可视化网页。
- `05-实验与证据`：真实板端 DTS、I2C、probe、Media Graph 和抓帧证据。
- `06-任务`：周计划、当前状态和分章节学习文档。
- `07-专项笔记`：Camera/V4L2 原理、命令和排障记录。
- `08-附录`：原理图资料、资料包说明和绘图规范。
- `09-输出沉淀`：面试回答与专题输出。
- `99-归档`：仅用于追溯历史，不作为学习入口。

## 学习规则

- 先在 Obsidian 中完成一个章节的问答和实板验证，再生成对应 HTML。
- 每个结论至少能回到原理图、DTS、源码或板端输出中的一种证据。
- 当前任务只看 `06-任务/01-下一步任务看板.md`，避免多个入口重复维护进度。

#RK3568 #IMX415 #Camera驱动 #V4L2 #Linux
