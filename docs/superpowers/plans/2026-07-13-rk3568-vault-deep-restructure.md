# RK3568 Vault Deep Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 RK3568 Obsidian 学习库重构为“唯一状态源 + 分层主线 + 专项知识 + 实验证据 + 输出沉淀”的知识库，并补齐系统原理、验收标准和排障知识。

**Architecture:** 入口层只负责导航和当前状态；主线层只负责阶段目标、依赖和验收；专项层负责可复用技术知识；实验层保存时间线和证据；输出层负责面向读者的表达。重复内容先合并后移入 `99-归档`，不删除历史。

**Tech Stack:** Markdown、Obsidian Wikilinks、相对 Markdown/HTML/PNG 链接、PowerShell/rg 用于只读索引和断链检查、Git。

---

## 文件责任地图

- Modify: `README.md` — GitHub 级简介和最短阅读路径。
- Modify: `00-首页/00-RK3568学习主入口.md` — 日常唯一入口，不维护重复状态。
- Modify: `06-任务/01-下一步任务看板.md` — 唯一当前状态源、阶段验收勾选项和复盘动作。
- Archive: `02-资料/02-当前阅读位置和下一步文档.md` — 内容并入任务看板后归档。
- Modify: `01-主线/01-AI视觉系统主线.md` — 系统级阶段地图和边界。
- Modify: `01-主线/02-从零到Python MVP学习路线.md` — 只保留阶段路线和验收标准，细节链接下沉。
- Modify: `01-主线/03-Camera-OpenCV-RKNN汇合路线.md` — 统一跨模块链路，删除过时状态。
- Create: `07-专项笔记/系统/AI Camera系统数据流与模块边界.md` — 全景数据流、控制流、模块输入输出。
- Create: `07-专项笔记/系统/AI Camera分阶段验收标准.md` — 每阶段的证据和成功标准。
- Create: `07-专项笔记/系统/AI Camera故障排查索引.md` — 分层排障树和入口链接。
- Modify: `07-专项笔记/01-概念索引.md` — 增加知识状态标记和新增术语入口。
- Modify: `07-专项笔记/Camera-V4L2/V4L2命令行抓帧记录.md` — 补齐 video node、Media Controller、NV12/stride 和验证标准。
- Modify: `07-专项笔记/OpenCV/OpenCV读取Camera记录.md` — 补齐 backend、caps、appsink 和分层定位。
- Modify: `07-专项笔记/AI-RKNN/YOLOv5 Python最小推理记录.md` — 补齐输入布局、量化、前后处理、坐标映射和指标。
- Modify: `07-专项笔记/Streaming/RTMP-HLS推流记录.md` — 补齐编码、封装、协议和延迟组成。
- Modify: `07-专项笔记/Display-MIPI/MIPI屏显示链路.md` — 明确 Camera MIPI 与 Display MIPI 的边界。
- Modify: `05-实验记录/02-每日进度记录.md` — 仅重排日期标题和归属，不改写事实。
- Modify: `08-附录/实验产物/01-实验产物索引.md` — 增加证据状态、复测日期和主线阶段映射。
- Modify: `04-项目/01-RK3568 YOLOv8n AI Camera项目.md` — 以当前实测 YOLOv5 Python MVP 为基线，明确 YOLOv8n 是目标。
- Modify: `04-项目/02-AI Camera项目讲解稿.md` and `09-输出沉淀/06-AI-Camera项目五分钟讲解.md` — 合并独有内容并保留一个工程稿、一个表达稿。
- Archive: replaced duplicates under `99-归档/重构前/` — 保留原文和归档说明。

### Task 1: 建立基线与入口唯一状态源

**Files:** `README.md`, `00-首页/00-RK3568学习主入口.md`, `06-任务/01-下一步任务看板.md`, `02-资料/02-当前阅读位置和下一步文档.md`

- [ ] **Step 1: 建立只读基线**

  Run `rg --files -g '*.md'`、`rg -n '\[\[|\]\(' -g '*.md'` 和 `git status --short`，把未提交改动记录在任务日志中；不暂存或覆盖已有修改。

- [ ] **Step 2: 把当前状态收敛到任务看板**

  在任务看板保留“当前阶段、唯一任务、阶段验收、暂不做、最近一次复盘日期”五个区块；所有“现在该做什么”的描述改为链接到该看板。

- [ ] **Step 3: 精简 README 与首页**

  README 只保留仓库用途、已验证成果链、代码仓库边界和最短阅读路径；首页只保留当前状态摘要、唯一下一步、主线/专项/实验/输出入口。

- [ ] **Step 4: 归档旧的阅读位置文档**

  将其仍有价值的资料优先级和阅读规则并入任务看板，再移动到 `99-归档/重构前/02-当前阅读位置和下一步文档.md`，并在归档目录增加来源说明。

- [ ] **Step 5: 验证入口一致性**

  Run `rg -n '当前阅读|下一步|当前阶段|唯一任务' -g '*.md'`，确认其他文档只提供摘要或链接，不维护第二份状态。

### Task 2: 压缩主线并加入阶段验收

**Files:** `01-主线/01-AI视觉系统主线.md`, `01-主线/02-从零到Python MVP学习路线.md`, `01-主线/03-Camera-OpenCV-RKNN汇合路线.md`, `07-专项笔记/系统/AI Camera分阶段验收标准.md`

- [ ] **Step 1: 为每个阶段统一模板**

  使用“目标 / 前置 / 必懂概念 / 操作入口 / 输出证据 / 完成标准 / 失败先查什么 / 下一阶段接口”八段结构覆盖阶段 0–10。

- [ ] **Step 2: 下沉重复细节**

  主线保留命令入口和结论，不重复复制 V4L2、GStreamer、RKNN、MIPI、RTMP 的长解释；每段改为指向对应专项笔记和实验记录。

- [ ] **Step 3: 编写阶段验收标准**

  为每阶段写出可观察证据，例如设备节点、帧格式、帧数、推理结果、显示结果、播放地址和复测日志；禁止以“命令无报错”作为唯一标准。

- [ ] **Step 4: 重写汇合路线**

  将跨模块链路固定为 `Camera -> V4L2 -> GStreamer -> OpenCV -> 前处理 -> RKNN/NPU -> 后处理 -> 显示/编码 -> RTMP/HLS`，区分数据流和控制流，删除历史下一步计划。

- [ ] **Step 5: 验证阶段链接**

  Run `rg -n '\[\[' '01-主线' '07-专项笔记/系统/AI Camera分阶段验收标准.md'`，确认每阶段至少有一个知识入口和一个证据入口。

### Task 3: 新增系统全景与排障知识

**Files:** `07-专项笔记/系统/AI Camera系统数据流与模块边界.md`, `07-专项笔记/系统/AI Camera故障排查索引.md`, `07-专项笔记/01-概念索引.md`

- [ ] **Step 1: 写系统全景笔记**

  解释 IMX415、MIPI CSI-2/D-PHY、CIF/ISP、V4L2 node、GStreamer、OpenCV、前处理、RKNN Runtime/NPU、后处理、显示和网络输出的输入/输出/边界。

- [ ] **Step 2: 写分层排障树**

  按“无设备节点 -> 无帧 -> OpenCV 失败 -> 推理异常 -> 框偏移 -> 网络播放失败”的顺序提供第一检查点、命令入口和证据要求。

- [ ] **Step 3: 增加知识状态规则**

  在概念索引中定义 `已验证`、`通用原理`、`待验证`，并为现有概念补上状态，避免把推测写成板端事实。

- [ ] **Step 4: 内容自检**

  检查是否明确说明 `/dev/video0`、Media Controller、NV12、MIPI Camera/Display 不同链路、RTMP/HLS 不同层次，以及端到端延迟来源。

### Task 4: 完善专项技术正文

**Files:** `07-专项笔记/Camera-V4L2/V4L2命令行抓帧记录.md`, `07-专项笔记/OpenCV/OpenCV读取Camera记录.md`, `07-专项笔记/AI-RKNN/YOLOv5 Python最小推理记录.md`, `07-专项笔记/Display-MIPI/MIPI屏显示链路.md`, `07-专项笔记/Streaming/RTMP-HLS推流记录.md`

- [ ] **Step 1: 统一每篇笔记骨架**

  增加一句话结论、系统位置、输入输出、已验证事实、通用原理、验证命令、常见失败和关联入口。

- [ ] **Step 2: 完善 Camera/V4L2**

  补充 video node 与 Camera 的区别、Media Controller 拓扑、NV12 平面和 stride、单帧/连续帧成功标准。

- [ ] **Step 3: 完善 GStreamer/OpenCV**

  补充 backend、caps 协商、颜色转换、appsink 和“底层抓帧成功但 OpenCV 失败”的定位顺序。

- [ ] **Step 4: 完善 RKNN/YOLO**

  补充 Toolkit/Runtime/RKNNLite/NPU 边界、RGB/BGR、NHWC/NCHW、量化、resize/letterbox、解码、置信度、NMS 和坐标回映；实测数字必须引用实验产物。

- [ ] **Step 5: 完善显示与推流**

  解释 MIPI Display 与 Camera 输入链路的独立性；区分编码器、封装、RTMP、HLS、服务端和播放器，并记录延迟组成。

- [ ] **Step 6: 专项笔记逐篇检查**

  Run `rg -n '已验证|通用原理|待验证|验证命令|常见失败' '07-专项笔记'`，确认每个核心技术域都有这些字段或明确说明不适用原因。

### Task 5: 整理实验证据与项目输出

**Files:** `05-实验记录/02-每日进度记录.md`, `08-附录/实验产物/01-实验产物索引.md`, `04-项目/01-RK3568 YOLOv8n AI Camera项目.md`, `04-项目/02-AI Camera项目讲解稿.md`, `09-输出沉淀/06-AI-Camera项目五分钟讲解.md`

- [ ] **Step 1: 整理每日记录结构**

  按日期升序排列同一日期的内容，合并重复一级日期标题；不删除命令、失败原因、修正过程或结论。

- [ ] **Step 2: 增加证据状态**

  在实验产物索引中标注产物所属阶段、首次验证日期、最近复测日期、证据类型和对应知识笔记。

- [ ] **Step 3: 对齐项目版本叙述**

  项目文档明确“当前已完成：YOLOv5 RKNN Python MVP；最终目标：YOLOv8n 工程化升级”，避免标题与正文混淆。

- [ ] **Step 4: 合并讲解内容**

  项目讲解稿保留工程结构、关键问题和局限；五分钟讲解稿保留面向听众的叙事。两者的事实、版本和数据只从项目基线引用。

- [ ] **Step 5: 归档被替代输出**

  把不再作为入口的旧讲解稿移动到 `99-归档/重构前/`，在新文档末尾保留“来源与历史版本”链接。

### Task 6: 全库验证与交付

**Files:** 全部 Markdown、HTML/PNG 入口、`99-归档/重构前/`

- [ ] **Step 1: 检查断链**

  收集所有 `[[...]]` 和 Markdown 相对链接，逐个确认目标文件存在；对已归档文件更新链接，不保留指向旧路径的入口链接。

- [ ] **Step 2: 检查重复状态**

  Run `rg -n '当前阶段|唯一任务|当前成果|下一步' -g '*.md'`，确认只有任务看板维护完整状态，其余位置为摘要。

- [ ] **Step 3: 检查内容标记**

  Run `rg -n '已验证|通用原理|待验证' '01-主线' '07-专项笔记' '08-附录'`，确认核心结论有可追溯状态。

- [ ] **Step 4: 检查归档完整性**

  对比归档前后的文件清单和关键段落标题，确认历史实验事实没有丢失。

- [ ] **Step 5: 查看最终差异并分批提交**

  Run `git diff --check` 和 `git status --short`；只提交本次重构文件，保留用户原有未提交改动，按入口、主线、专项、证据/输出四个逻辑批次提交。

