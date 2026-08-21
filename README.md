# RK3568 + IMX415 Camera 驱动学习库

这是一个面向 Camera 驱动岗位的 Obsidian 学习库。目标不是继续扩展 AI Camera 演示项目，而是基于真实 RK3568 开发板、IMX415 模组、原理图、DTS、Linux 内核源码和板端日志，重新建立可操作、可调试、可面试表达的驱动能力。

## 最短入口

1. [[00-RK3568学习主入口|Obsidian 主入口]]
2. [[02-源码陪读/05-V4L2-Subdev/00-源码陪读索引|当前源码陪读：V4L2 Subdev]]
3. [[01-下一步任务看板|当前任务看板]]
4. [[Camera驱动求职第1周执行计划|第 1 周执行计划]]
5. [[05-V4L2-Subdev|当前课程：V4L2 Subdev]]

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
- `01-课程主线`：00–11 的唯一课程知识源；05–11 在学到之前只保留占位页。
- `02-源码陪读`：按生命周期拆分的真实内核源码阅读辅助。
- `04-项目`：Phase0 与 IMX415 驱动链路可视化网页。
- `05-实验与证据`：带 evidence ID、时间和环境基线的板端原始事实。
- `06-任务`：任务看板、周计划和复盘链接，不保存课程标准答案。
- `07-专项笔记`：Camera/V4L2 原理、命令和排障记录。
- `08-附录`：原理图、资料包、参考知识和模板。
- `09-输出沉淀`：每阶段一张面试卡与项目讲解，不复制课程全文。
- `99-归档`：仅用于追溯历史，不作为学习入口。

## 学习规则

- 先在 Obsidian 中完成一个章节的问答和实板验证，再把该阶段从占位升级为正式正文。
- 每个结论至少能回到原理图、DTS、源码或板端输出中的一种证据。
- 当前阶段只维护在 `00-首页/course-map.json` 的 `currentStage`；网页导航和驾驶舱从这里取得状态。
- 网页是只读课程展示层；知识编辑回到 Markdown，流程图只作为可视化参考。

## 维护检查

```powershell
node tools/build-dashboard.mjs
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs
git diff --check
```

目标：课程恰好 00–11；没有断链、活动页指向归档、孤立正文或重复生成漂移。

#RK3568 #IMX415 #Camera驱动 #V4L2 #Linux
