# RK3568 + IMX415 Camera 驱动学习库

这是一个面向 Camera 驱动岗位的学习库，记录 RK3568 + IMX415 从设备树、Sensor 驱动和 Media Graph 到 RKISP、V4L2 用户态取流的学习与实板验证。

## 最短入口

- [Obsidian 学习入口](00-首页/00-RK3568学习主入口.md)汇总学习、源码和实验证据的入口。
- [当前任务看板](06-任务/01-下一步任务看板.md)记录最近一次验收和下一步。
- [网页学习站](00-首页/学习驾驶舱/index.html)提供课程导航和流程图，可本地打开。

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
- `01-课程主线`：00–11 课程路线。00–08 是当前 Camera 驱动与取流主线，09–11 是后续学习入口。
- `02-源码陪读`：00–08 源码定位、调用关系和调试回查。
- `04-项目`：课程流程图、调用图和历史可视化参考。
- `05-实验与证据`：带 evidence ID、时间和环境基线的板端原始事实。
- `06-任务`：任务看板、周计划和复盘链接，不保存课程标准答案。
- `07-专项笔记`：Camera/V4L2 原理、命令和排障记录。
- `08-附录`：原理图、资料包、参考知识和模板。
- `09-输出沉淀`：每阶段一张面试卡与项目讲解，不复制课程全文。
- [`99-归档`](99-归档/00-归档说明.md)保存旧路线、历史设计、旧图源和 AI 应用记录。

## 学习规则

- 每次从看板取一项任务，先阅读、复述或实操，再把确实卡住的地方补回原笔记。
- 课程正文和学习记录在 Markdown 中维护。网页阶段编号取自 `00-首页/course-map.json`，具体学习任务取自看板。
- `学习驾驶舱/generated/` 和 `学习驾驶舱/pages/notes/` 是生成产物。改动笔记或课程地图后用构建命令更新。

## 维护检查

```powershell
node tools/build-dashboard.mjs
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
git diff --check
```

内核源码对照测试需要本机的 Source Insight 学习副本与 WSL SDK 基线。Markdown 链接检查可单独运行。

#RK3568 #IMX415 #Camera驱动 #V4L2 #Linux
