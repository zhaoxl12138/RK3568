# RK3568 Hybrid Dashboard Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 RK3568 Obsidian 仓库重构为“网页学习驾驶舱 + 分层 Markdown 知识库”，并建立稳定的目录职责、单向链接和唯一状态源。

**Architecture:** 网页驾驶舱从任务看板、阶段验收和入口清单生成只读状态，使用 Obsidian 深链接打开 Markdown；Obsidian 继续承担正文和记录。知识流固定为“入口 → 主线 → 专项 → 实验与证据 → 项目输出”，资料与环境作为支撑层，归档不进入日常路径。

**Tech Stack:** Markdown、Obsidian Wikilinks、静态 HTML/CSS/JavaScript、Node.js 标准库、PowerShell、Git。

---

## 文件责任地图

### 新建

- `01-主线/00-主线入口.md`：主线目录唯一 MOC。
- `02-资料/00-资料入口.md`：资料目录唯一 MOC。
- `03-环境/00-环境入口.md`：环境目录唯一 MOC。
- `05-实验与证据/00-实验与证据入口.md`：证据层唯一 MOC。
- `00-首页/学习驾驶舱/index.html`：网页结构。
- `00-首页/学习驾驶舱/styles.css`：视觉样式与响应式布局。
- `00-首页/学习驾驶舱/app.js`：渲染、筛选、跳转和降级提示。
- `00-首页/学习驾驶舱/generated/vault-data.js`：脚本生成的页面数据。
- `tools/build-dashboard.mjs`：从 Markdown 生成驾驶舱数据。
- `tools/check-vault-links.mjs`：检查 Wikilink、相对链接和活跃层归档依赖。
- `tools/tests/build-dashboard.test.mjs`：生成器测试。
- `tools/tests/check-vault-links.test.mjs`：链接检查器测试。

### 移动

- `05-实验记录/` → `05-实验与证据/`
- `08-附录/实验产物/` → `05-实验与证据/实验产物/`
- `Excalidraw/` → `08-附录/图源/Excalidraw/`
- `RK3568学习路线与重点.md` → `99-归档/重构前/RK3568学习路线与重点.md`
- `01-主线/03-Camera-OpenCV-RKNN汇合路线.md` → `99-归档/重构前/03-Camera-OpenCV-RKNN汇合路线-历史版.md`

### 归档副本后重写

- `01-主线/02-从零到Python MVP学习路线.md`：归档完整历史版后，重写为阶段导航。

### 修改

- `README.md`
- `00-首页/00-RK3568学习主入口.md`
- `01-主线/01-AI视觉系统主线.md`
- `04-项目/00-项目可视化入口.md`
- `04-项目/01-RK3568 YOLOv8n AI Camera项目.md`
- `04-项目/03-Python MVP演示手册.md`
- `06-任务/01-下一步任务看板.md`
- `07-专项笔记/00-专项笔记入口.md`
- `07-专项笔记/系统/AI Camera系统数据流与模块边界.md`
- `07-专项笔记/系统/AI Camera分阶段验收标准.md`
- `08-附录/00-附录入口.md`
- `09-输出沉淀/00-输出沉淀入口.md`
- 所有引用迁移路径的 Markdown 文件。

## 工作区保护规则

开始时已有未提交状态：

```text
M 00-首页/00-RK3568学习主入口.md
M 01-主线/01-AI视觉系统主线.md
M 01-主线/02-从零到Python MVP学习路线.md
M 06-任务/01-下一步任务看板.md
?? RK3568学习路线与重点.md
```

其中部分修改可能只是换行符。实施时读取工作区当前内容作为输入；不得使用 `git checkout --`、`git reset --hard` 或覆盖式复制。每次提交只暂存本任务明确列出的文件。

---

### Task 1: 建立可重复的架构与链接检查

**Files:**
- Create: `tools/check-vault-links.mjs`
- Create: `tools/tests/check-vault-links.test.mjs`

- [ ] **Step 1: 写链接检查器测试**

使用 Node `node:test` 创建临时 vault，覆盖以下行为：

```javascript
test('resolves wikilinks by basename', async () => {});
test('resolves embedded image wikilinks', async () => {});
test('reports missing markdown relative links', async () => {});
test('reports active documents linking directly to archive content', async () => {});
test('allows archive index links', async () => {});
```

测试夹具必须包含 `00-首页`、`07-专项笔记`、`08-附录/assets` 和 `99-归档`，以验证中文路径与图片链接。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
node --test tools/tests/check-vault-links.test.mjs
```

Expected: FAIL，原因是 `tools/check-vault-links.mjs` 尚不存在。

- [ ] **Step 3: 实现链接检查器**

导出并实现：

```javascript
export async function scanVault(rootDir) {
  return {
    markdownFiles: [],
    brokenWikiLinks: [],
    brokenRelativeLinks: [],
    activeToArchiveLinks: [],
    orphanActiveDocs: []
  };
}
```

规则：

- Wikilink 支持 `[[标题]]`、`[[标题|别名]]`、`[[标题#章节]]` 和 `![[图片.png]]`。
- Markdown 链接忽略 `http://`、`https://`、`file://`、`obsidian://` 和纯锚点。
- 活跃文档是除 `.obsidian`、`docs`、`99-归档` 外的 Markdown。
- 活跃文档直接链接 `99-归档` 视为错误；`99-归档/00-归档说明.md` 除外。
- `README.md`、各目录 `00-*入口.md`、任务看板和生成数据不计入孤立文档。
- CLI 在存在 broken links 或 active-to-archive links 时返回退出码 1；孤立文档只警告。

- [ ] **Step 4: 运行测试和当前库基线**

Run:

```powershell
node --test tools/tests/check-vault-links.test.mjs
node tools/check-vault-links.mjs . --json
```

Expected: 单元测试 PASS；当前库扫描可以报告迁移前问题，但不能崩溃。

- [ ] **Step 5: 提交检查工具**

```powershell
git add -- tools/check-vault-links.mjs tools/tests/check-vault-links.test.mjs
git commit -m "test: add Obsidian vault link checker"
```

### Task 2: 建立目录入口和迁移证据层

**Files:**
- Create: `01-主线/00-主线入口.md`
- Create: `02-资料/00-资料入口.md`
- Create: `03-环境/00-环境入口.md`
- Create: `05-实验与证据/00-实验与证据入口.md`
- Move: `05-实验记录/*` → `05-实验与证据/*`
- Move: `08-附录/实验产物/*` → `05-实验与证据/实验产物/*`
- Move: `Excalidraw/*` → `08-附录/图源/Excalidraw/*`
- Modify: all incoming links to moved files

- [ ] **Step 1: 记录迁移前引用基线**

Run:

```powershell
rg -n "05-实验记录|08-附录/实验产物|Excalidraw|实验产物索引|每日进度记录|板子到手验机记录" -g "*.md" .
```

保存输出用于逐项核对，不修改任何文件。

- [ ] **Step 2: 验证移动目标**

使用 `Resolve-Path` 确认源目录均位于 `E:\obsidian_github\RK3568` 内；确认目标目录不存在同名冲突。移动二进制图片时使用同一个 PowerShell 进程和 `Move-Item -LiteralPath`。

- [ ] **Step 3: 移动目录和资产**

移动后目标结构必须为：

```text
05-实验与证据/
├── 01-板子到手验机记录.md
├── 02-每日进度记录.md
└── 实验产物/
    ├── 01-实验产物索引.md
    └── assets/

08-附录/图源/Excalidraw/
```

不要改变图片文件内容和 Markdown 正文。

- [ ] **Step 4: 新建四个目录入口**

每个入口使用统一结构：

```markdown
# 目录名称

> 本目录只负责什么；不负责什么。

## 从这里进入

- [[核心文档]]：一句话用途。

## 与其他层的关系

上游入口 → 本目录 → 下游证据或输出。
```

`05-实验与证据入口` 必须分开列出“过程记录”和“可复测证据”。

- [ ] **Step 5: 修复全部迁移路径**

- Wikilink 保持以 basename 为主，避免不必要的绝对目录耦合。
- Markdown 图片和 HTML/PNG 相对链接按新位置重算。
- `README`、首页、主线、项目、专项和输出入口均更新到新证据层。

- [ ] **Step 6: 运行验证**

Run:

```powershell
node tools/check-vault-links.mjs . --json
rg -n "05-实验记录|08-附录/实验产物|^Excalidraw/" -g "*.md" .
```

Expected: 活跃文档不存在旧路径引用；图片嵌入均可解析。

- [ ] **Step 7: 提交目录迁移**

只暂存新入口、移动文件和路径修复：

```powershell
git add -- '01-主线/00-主线入口.md' '02-资料/00-资料入口.md' '03-环境/00-环境入口.md' '05-实验与证据' '08-附录/图源' ':!00-首页/00-RK3568学习主入口.md' ':!01-主线/01-AI视觉系统主线.md' ':!01-主线/02-从零到Python MVP学习路线.md' ':!06-任务/01-下一步任务看板.md'
git add -u -- '05-实验记录' '08-附录/实验产物' 'Excalidraw'
git commit -m "refactor: organize RK3568 evidence and folder indexes"
```

### Task 3: 收敛主线与归档历史路线

**Files:**
- Modify: `01-主线/00-主线入口.md`
- Modify: `01-主线/01-AI视觉系统主线.md`
- Modify: `01-主线/02-从零到Python MVP学习路线.md`
- Modify: `07-专项笔记/系统/AI Camera系统数据流与模块边界.md`
- Move: `01-主线/03-Camera-OpenCV-RKNN汇合路线.md` → `99-归档/重构前/03-Camera-OpenCV-RKNN汇合路线-历史版.md`
- Create: `99-归档/重构前/02-从零到Python MVP学习路线-完整历史版.md`

- [ ] **Step 1: 保存完整历史路线**

把工作区当前版本的 `02-从零到Python MVP学习路线.md` 原文复制为归档历史版；标题改为“从零到 Python MVP 学习路线——完整历史版”，首段注明归档日期和当前活跃入口。

- [ ] **Step 2: 重写活跃阶段路线**

活跃路线按阶段 0–10 使用同一模板，每阶段最多保留：

```markdown
### 阶段 N：名称

- 要回答的问题：
- 专项入口：
- 证据入口：
- 通过标准：
- 下一阶段接口：
```

删除活跃路线中的长命令、历史决策、面试表达和重复原理；这些内容通过链接进入专项、证据和输出层。

- [ ] **Step 3: 收敛系统主线**

`01-AI视觉系统主线` 只保留：当前项目基线、端到端数据流、阶段依赖图、模块职责和入口链接。阶段状态改为引用任务看板与阶段验收，不维护独立勾选状态。

- [ ] **Step 4: 合并汇合路线的有效内容**

把以下有效关系并入 `AI Camera系统数据流与模块边界.md`：

- Camera → OpenCV 的显式 GStreamer 边界。
- OpenCV Mat → 前处理 → RKNN → 后处理的接口。
- 本地显示和网络推流作为两个输出分支。

历史例程选择、当时的“下一步”和策略变化留在归档版。

- [ ] **Step 5: 更新所有链接**

活跃文档中指向 `03-Camera-OpenCV-RKNN汇合路线` 的链接改为系统数据流笔记或阶段路线；归档说明增加来源链接。

- [ ] **Step 6: 验证职责和链接**

Run:

```powershell
node tools/check-vault-links.mjs . --json
rg -n "当前阶段|本轮唯一任务|下一步要做|再下一步" '01-主线' -g '*.md'
```

Expected: 主线中没有第二套任务状态；所有阶段均有专项和证据入口。

- [ ] **Step 7: 提交主线收敛**

```powershell
git add -- '01-主线' '07-专项笔记/系统/AI Camera系统数据流与模块边界.md' '99-归档/重构前'
git commit -m "refactor: clarify RK3568 mainline document roles"
```

### Task 4: 清理跨层状态和建立入口关系

**Files:**
- Modify: `README.md`
- Modify: `00-首页/00-RK3568学习主入口.md`
- Modify: `04-项目/00-项目可视化入口.md`
- Modify: `04-项目/01-RK3568 YOLOv8n AI Camera项目.md`
- Modify: `04-项目/03-Python MVP演示手册.md`
- Modify: `06-任务/01-下一步任务看板.md`
- Modify: `07-专项笔记/00-专项笔记入口.md`
- Modify: `08-附录/00-附录入口.md`
- Modify: `09-输出沉淀/00-输出沉淀入口.md`

- [ ] **Step 1: 统一入口职责说明**

每个入口首屏回答：本层负责什么、不负责什么、从哪里进入、完成后去哪里。首页只显示任务看板摘要与六个区域入口。

- [ ] **Step 2: 保留唯一状态源**

任务看板保留完整的：当前阶段、本轮唯一任务、阶段验收、暂不做、复盘记录。其他活跃文件出现“当前状态”时必须满足以下之一：

- 明确写成“项目版本基线”。
- 明确写成“本页实测状态”。
- 明确写成“历史决策”。
- 仅引用任务看板。

- [ ] **Step 3: 对齐项目和输出层**

项目入口只列架构、演示、可视化和当前稳定版本；输出入口只列文章和讲解用途。二者都引用新证据层，不复制实验日志。

- [ ] **Step 4: 验证状态词和入口覆盖**

Run:

```powershell
rg -n "当前阶段|本轮唯一任务|当前状态|下一步" -g "*.md" .
```

逐条确认任务看板以外的命中属于项目基线、本页事实或历史记录。

- [ ] **Step 5: 提交入口和状态关系**

暂存前先用 `git diff` 核对四个原有工作区修改文件，确认用户内容仍在。然后只提交实际架构改动：

```powershell
git add -- README.md '00-首页/00-RK3568学习主入口.md' '04-项目' '06-任务/01-下一步任务看板.md' '07-专项笔记/00-专项笔记入口.md' '08-附录/00-附录入口.md' '09-输出沉淀/00-输出沉淀入口.md'
git commit -m "docs: enforce RK3568 vault navigation boundaries"
```

### Task 5: 实现驾驶舱数据生成器

**Files:**
- Create: `tools/build-dashboard.mjs`
- Create: `tools/tests/build-dashboard.test.mjs`
- Create: `00-首页/学习驾驶舱/generated/vault-data.js`

- [ ] **Step 1: 写生成器测试**

使用 Node `node:test` 和临时目录，覆盖：

```javascript
test('extracts current stage and unique task from task board', async () => {});
test('extracts stage rows from acceptance table', async () => {});
test('indexes evidence images and their stage labels', async () => {});
test('encodes Chinese Obsidian deep links', async () => {});
test('emits warnings instead of crashing on missing optional sections', async () => {});
```

断言生成文件以 `window.RK3568_VAULT_DATA = ` 开头，并包含 `currentStage`、`currentTasks`、`stages`、`domains`、`evidence`、`quickLinks` 和 `warnings`。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
node --test tools/tests/build-dashboard.test.mjs
```

Expected: FAIL，原因是生成器尚不存在。

- [ ] **Step 3: 实现 Markdown 提取与深链接**

导出：

```javascript
export function parseTaskBoard(markdown) {}
export function parseStageTable(markdown) {}
export function buildObsidianUrl(vault, filePath) {}
export async function buildDashboardData(rootDir) {}
export async function writeDashboardData(rootDir, outputFile) {}
```

要求：

- 当前阶段取任务看板“当前阶段”区块。
- 当前任务取“本轮唯一任务”下的 checkbox。
- 阶段状态由验收表与任务看板合成；无法判断时为 `unknown`，并写入 warnings。
- 技术域使用显式配置映射到 Camera、OpenCV、RKNN、Display、Streaming、System 六组入口。
- 证据图片从迁移后的实验产物索引及 `assets` 目录读取。
- Obsidian URL 使用 `encodeURIComponent` 分别编码 vault 与规范化的 `/` 路径。

- [ ] **Step 4: 运行测试并生成真实数据**

Run:

```powershell
node --test tools/tests/build-dashboard.test.mjs
node tools/build-dashboard.mjs .
```

Expected: 测试 PASS；生成 `00-首页/学习驾驶舱/generated/vault-data.js`，warnings 为空或只包含明确列出的可选字段警告。

- [ ] **Step 5: 提交生成器**

```powershell
git add -- tools/build-dashboard.mjs tools/tests/build-dashboard.test.mjs '00-首页/学习驾驶舱/generated/vault-data.js'
git commit -m "feat: generate RK3568 dashboard data from Markdown"
```

### Task 6: 实现静态网页学习驾驶舱

**Files:**
- Create: `00-首页/学习驾驶舱/index.html`
- Create: `00-首页/学习驾驶舱/styles.css`
- Create: `00-首页/学习驾驶舱/app.js`
- Modify: `00-首页/00-RK3568学习主入口.md`
- Modify: `README.md`

- [ ] **Step 1: 建立语义化页面骨架**

`index.html` 按顺序包含：侧栏、当前阶段、唯一任务、阶段地图、系统数据流、技术域、证据画廊、项目输出和快速记录。加载顺序固定为：

```html
<link rel="stylesheet" href="./styles.css">
<script src="./generated/vault-data.js"></script>
<script type="module" src="./app.js"></script>
```

- [ ] **Step 2: 实现渲染和导航**

`app.js` 必须提供：

```javascript
function renderCurrentState(data) {}
function renderStages(stages) {}
function renderPipeline(domains) {}
function renderDomains(domains) {}
function renderEvidence(items) {}
function openObsidian(url, fallbackPath) {}
```

点击 Markdown 卡片使用 Obsidian URL；点击现有 HTML、PNG 和图片使用相对路径。`openObsidian` 在页面上同步显示目标文件路径，作为协议不可用时的降级提示。

- [ ] **Step 3: 实现视觉和响应式布局**

`styles.css` 使用 CSS 自定义属性统一颜色；桌面为左侧导航 + 主内容，宽度小于 900px 时改为顶部导航，宽度小于 640px 时卡片单列。状态颜色固定为：current=amber、verified=green、planned=blue、unknown=gray。

- [ ] **Step 4: 接入真实资产和入口**

证据画廊至少显示 OpenCV 抓帧、SCRFD、YOLOv5 实时、YOLO HLS 四类已存在图片。项目区链接现有 Phase0 HTML、Python MVP 演示手册和项目讲解稿。

- [ ] **Step 5: 本地浏览器验证**

Run:

```powershell
Start-Process -FilePath 'E:\obsidian_github\RK3568\00-首页\学习驾驶舱\index.html'
```

人工确认：无需服务器即可显示；中文正常；阶段和任务与任务看板一致；图片可见；窗口缩窄后不横向溢出；Obsidian 按钮包含正确目标。

- [ ] **Step 6: 更新双入口**

Obsidian 首页和 README 增加驾驶舱入口，同时明确：网页看全局，Obsidian 写内容，任务看板维护状态。

- [ ] **Step 7: 提交驾驶舱**

```powershell
git add -- '00-首页/学习驾驶舱' '00-首页/00-RK3568学习主入口.md' README.md
git commit -m "feat: add RK3568 learning dashboard"
```

### Task 7: 归档根目录孤立文档并完成全库验证

**Files:**
- Move: `RK3568学习路线与重点.md` → `99-归档/重构前/RK3568学习路线与重点.md`
- Modify: `99-归档/重构前/00-重构归档说明.md`
- Modify: any files reported by final checks

- [ ] **Step 1: 归档被排除的根目录路线文档**

移动后在归档说明中标注：该文档是早期通用路线尝试，已被“网页驾驶舱 + 阶段主线 + 任务看板”架构替代，不作为当前入口。

- [ ] **Step 2: 重新生成页面数据**

Run:

```powershell
node tools/build-dashboard.mjs .
```

Expected: 生成成功，数据中的路径均为迁移后的最终路径。

- [ ] **Step 3: 运行全部自动检查**

Run:

```powershell
node --test tools/tests/*.test.mjs
node tools/check-vault-links.mjs . --json
git diff --check
```

Expected: tests PASS；broken Wiki/relative/archive links 均为 0；`git diff --check` 无输出。

- [ ] **Step 4: 检查架构不变量**

Run:

```powershell
Get-ChildItem -Directory | Select-Object Name
rg -n "本轮唯一任务|当前阶段" -g "*.md" .
rg -n "05-实验记录|08-附录/实验产物|03-Camera-OpenCV-RKNN汇合路线" -g "*.md" .
```

Expected:

- 活跃顶层结构与设计一致。
- 完整任务状态只在任务看板出现。
- 活跃文件没有旧路径和已归档主线引用。

- [ ] **Step 5: 检查工作区保护**

对比实施前记录，确认四个原有未提交文件中的有效用户改动仍在。不得把仅换行符变化误报为内容丢失。

- [ ] **Step 6: 最终提交**

```powershell
git add -- '99-归档/重构前' '00-首页/学习驾驶舱/generated/vault-data.js'
git commit -m "chore: finalize RK3568 vault architecture migration"
```

### Task 8: 最终人工验收与交付

**Files:** 全库只读验收。

- [ ] **Step 1: 从网页走一遍学习路径**

从驾驶舱依次打开：当前任务 → 阶段 0 → 系统数据流 → V4L2 专项 → 抓帧证据 → Python MVP 演示手册。每一步都应能回到上一层或驾驶舱。

- [ ] **Step 2: 从 Obsidian 走一遍学习路径**

从 `00-RK3568学习主入口` 依次进入任务、主线、专项和证据层，确认不需要依赖网页也能完成学习。

- [ ] **Step 3: 验证记录入口**

网页“本轮复盘”打开任务看板；“实验时间线”打开每日进度；“阶段验收”打开分阶段验收标准。网页本身不写文件。

- [ ] **Step 4: 核对最终事实**

确认所有入口统一描述：当前实测基线为 YOLOv5 RKNN Python MVP；YOLOv8n、C++、Linux 5.10 为后续目标。

- [ ] **Step 5: 交付变更摘要**

交付内容包含：驾驶舱路径、日常使用顺序、目录职责、自动检查结果、保留的用户工作区修改，以及后续新增笔记应遵循的链接规则。

