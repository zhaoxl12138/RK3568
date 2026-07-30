# MIPI D-PHY 与 CSI-2 学习章节 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于当前 RK3568、IMX415 原理图、BSP 4.19 源码和板端输出，完成第二章“MIPI D-PHY 与 CSI-2”的学习、验收和最终 HTML 发布。

**Architecture:** 学习过程只维护一个带 `web-publish: false` 的 Markdown 章节，网页生成器必须跳过该草稿。章节按“电气连接 → DTS endpoint → 运行时 Media Graph → 驱动源码 → 故障排查 → 面试表达”推进；全部验收通过后才开启发布、生成 HTML，并把入口加入 Phase0 驱动层全链路框架图。

**Tech Stack:** Obsidian Markdown、Node.js ESM 网页生成器、Node Test Runner、RK3568 Linux 4.19 BSP、Device Tree、Media Controller、MIPI CSI-2 D-PHY。

---

## 文件边界

- Create: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`
  - 第二章唯一学习记录；学习期间禁止生成 HTML。
- Modify: `tools/build-dashboard.mjs`
  - 识别 Markdown front matter 中的 `web-publish: false` 并跳过该文档。
- Modify: `tools/tests/build-dashboard.test.mjs`
  - 验证草稿不会进入网页目录、数据索引或生成 HTML。
- Modify after chapter acceptance: `04-项目/14-Phase0-驱动层全链路框架图.html`
  - 只在第二章验收完成后增加正式章节按钮。
- Modify after chapter acceptance: `06-任务/RK3568-Camera驱动学习总入口.md`
  - 第二章完成后更新章节状态和下一学习节点。
- Generated after chapter acceptance: `00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第2章-MIPI-DPHY与CSI2.html`
  - 正式发布产物，不在学习过程中手工创建。

### 真实资料和源码

```text
SDK：
/home/rk3568/work/rk3568_linux_sdk

板级 DTS：
kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi

SoC DTS：
kernel/arch/arm64/boot/dts/rockchip/rk3568.dtsi

D-PHY 驱动：
kernel/drivers/phy/rockchip/phy-rockchip-csi2-dphy.c
kernel/drivers/phy/rockchip/phy-rockchip-csi2-dphy-hw.c
kernel/drivers/phy/rockchip/phy-rockchip-csi2-dphy-common.h

CSI/RKISP 接收端：
kernel/drivers/media/platform/rockchip/isp/csi.c
kernel/drivers/media/platform/rockchip/isp/csi.h

原理图图片：
06-任务/assets/主板-MIPI-CSI接口.png
06-任务/assets/IMX415-Sensor引脚.png
```

---

### Task 1: 让网页生成器跳过学习草稿

**Files:**
- Modify: `tools/build-dashboard.mjs`
- Test: `tools/tests/build-dashboard.test.mjs`

- [ ] **Step 1: 写失败测试**

在 `tools/tests/build-dashboard.test.mjs` 增加：

```js
test('notes with web-publish false stay out of generated HTML and note data', async () => {
  await writeFixture(
    '06-任务/draft.md',
    [
      '---',
      'web-publish: false',
      'learning-status: in-progress',
      '---',
      '',
      '# 学习草稿',
      '',
      '尚未完成的内容。',
    ].join('\n'),
  );
  await writeFixture(
    '06-任务/published.md',
    '# 已发布章节\n\n可以生成网页。',
  );

  const outputFile = path.join(
    vaultDir,
    '00-首页/学习驾驶舱/generated/vault-data.js',
  );
  await writeDashboardData(vaultDir, outputFile);

  await assert.rejects(
    access(path.join(
      vaultDir,
      '00-首页/学习驾驶舱/pages/notes/06-任务--draft.html',
    )),
    ({ code }) => code === 'ENOENT',
  );
  await access(path.join(
    vaultDir,
    '00-首页/学习驾驶舱/pages/notes/06-任务--published.html',
  ));

  const output = await readFile(outputFile, 'utf8');
  assert.doesNotMatch(output, /06-任务\/draft\.md/u);
  assert.match(output, /06-任务\/published\.md/u);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
node --test --test-name-pattern="web-publish false" tools/tests/build-dashboard.test.mjs
```

Expected: FAIL，因为当前生成器仍会生成 `06-任务--draft.html`。

- [ ] **Step 3: 实现发布状态判断**

在 `tools/build-dashboard.mjs` 的笔记目录构建逻辑之前增加：

```js
function webPublishEnabled(markdown) {
  const normalized = String(markdown ?? '').replace(/\r\n?/gu, '\n');
  const frontMatter = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/u);
  if (!frontMatter) return true;
  return !/^web-publish:\s*(?:false|no|0)\s*$/imu.test(frontMatter[1]);
}
```

在 `buildNoteCatalog()` 读取内容后、`notes.push(note)` 之前改为：

```js
const contents = await readFile(
  path.join(rootDir, ...normalizedPath.split('/')),
  'utf8',
);
if (!webPublishEnabled(contents)) continue;
note.contents = contents;
notes.push(note);
```

- [ ] **Step 4: 运行定向测试**

Run:

```powershell
node --test --test-name-pattern="web-publish false" tools/tests/build-dashboard.test.mjs
```

Expected: PASS。

- [ ] **Step 5: 运行完整测试**

Run:

```powershell
node --test tools/tests/*.mjs
```

Expected: 所有测试通过，失败数为 0。

- [ ] **Step 6: 提交生成器能力**

```powershell
git add -- tools/build-dashboard.mjs tools/tests/build-dashboard.test.mjs
git commit -m "feat: keep learning drafts out of generated site"
```

---

### Task 2: 创建第二章学习记录，不生成 HTML

**Files:**
- Create: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`

- [ ] **Step 1: 创建带禁用发布标记的章节**

文件开头必须是：

```markdown
---
web-publish: false
learning-status: in-progress
chapter: 2
---

# RK3568 MIPI D-PHY 与 CSI-2 源码对照

> 当前学习节点：IMX415 RAW10 → D-PHY → CSI-2 Receiver。
>
> 发布规则：本章通过全部验收前，不生成 HTML，不加入 Phase0 框架图。
```

固定目录：

```markdown
## 0. 当前学习位置
## 1. 一条主线
## 2. Lane、差分信号与四 Lane 串行传输
## 3. 原理图：IMX415 到 RK3568
## 4. DTS：data-lanes 与双向 endpoint
## 5. 运行时：Media Graph 中的 D-PHY 与 CSI
## 6. 源码：D-PHY 与 CSI 驱动如何初始化
## 7. 故障现象和排查顺序
## 8. 面试表达
## 9. 章节验收
```

- [ ] **Step 2: 写入第一轮已确认知识**

在第 2 节记录：

```markdown
### 问题记录：MIPI 有多根数据线，为什么仍叫串行

一条 Data Lane 由 P/N 差分线组成。单条 Lane 内的 bit 按时间顺序串行传输；四条 Lane 同时工作形成 Lane 级并行。

```text
单 Lane 内：串行
四 Lane 间：并行工作
四条 Lane 共同运输同一条 RAW10 图像流
```

四 Lane D-PHY 的主要高速信号：

```text
CSI_D0_P/N
CSI_D1_P/N
CSI_D2_P/N
CSI_D3_P/N
CSI_CLK_P/N
```
```

- [ ] **Step 3: 引用已有原理图**

在第 3 节加入：

```markdown
![主板 MIPI CSI 接口](assets/主板-MIPI-CSI接口.png)

![IMX415 Sensor 引脚](assets/IMX415-Sensor引脚.png)
```

- [ ] **Step 4: 验证不会生成草稿 HTML**

Run:

```powershell
node tools/build-dashboard.mjs .
Test-Path "00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第2章-MIPI-DPHY与CSI2.html"
```

Expected:

```text
False
```

- [ ] **Step 5: 提交章节骨架**

```powershell
git add -- "06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md"
git commit -m "docs: start MIPI D-PHY and CSI-2 learning chapter"
```

---

### Task 3: 完成电气层与原理图学习

**Files:**
- Modify: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`

- [ ] **Step 1: 学习并记录五个概念**

章节必须能区分：

```text
P/N 差分线
Data Lane
Clock Lane
单 Lane 串行
多 Lane 聚合带宽
```

- [ ] **Step 2: 完成原理图映射表**

记录至少以下映射：

```text
IMX415 CSI_D0_P/N  ↔ 主板 MIPI_CSI_RX_D0P/N
IMX415 CSI_D1_P/N  ↔ 主板 MIPI_CSI_RX_D1P/N
IMX415 CSI_D2_P/N  ↔ 主板 MIPI_CSI_RX_D2P/N
IMX415 CSI_D3_P/N  ↔ 主板 MIPI_CSI_RX_D3P/N
IMX415 CSI_CLK_P/N ↔ 主板 MIPI_CSI_RX_CLK0P/N
```

- [ ] **Step 3: 用户回答第一轮验收题**

```text
1. 为什么 D0P 和 D0N 合起来才叫一条 Lane？
2. 四条 Data Lane 是四幅图、四种颜色，还是同一条图像数据流？
3. Clock Lane 与 Data Lane 的职责有什么区别？
4. 为什么增加 Lane 数量可以提高总带宽？
```

- [ ] **Step 4: 保存原始回答和高亮正确答案**

对每个回答使用：

```markdown
我的回答：保留用户原文。

> [!success] 正确答案
> 给出精确答案。

> [!warning] 需要修正
> 只在答案错误或不完整时出现。
```

- [ ] **Step 5: 完成本节检查**

通过标准：用户不看笔记，可以用自己的话解释“多 Lane 串行链路”并在两份原理图中找出五对高速差分信号。

---

### Task 4: 完成 DTS endpoint 与运行时 Media Graph 学习

**Files:**
- Modify: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`

- [ ] **Step 1: 记录板级 DTS 源码位置**

使用：

```text
kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi:231
kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi:247
kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi:263
kernel/arch/arm64/boot/dts/rockchip/rk3568-atk-evb1-ddr4-v10.dtsi:667
```

- [ ] **Step 2: 追踪 endpoint**

章节中形成：

```text
imx415_out
↔ mipi_in_ucam1
→ rockchip-csi2-dphy0
→ csidphy_out
↔ isp0_in
→ RKISP
```

- [ ] **Step 3: 对照运行时实体**

从用户已有的 `media-ctl -p` 输出定位：

```text
m00_b_imx415 4-001a-1
→ rockchip-csi2-dphy0
→ rkisp-csi-subdev
→ rkisp-isp-subdev
```

- [ ] **Step 4: 用户完成第二轮验收题**

```text
1. `data-lanes = <1 2 3 4>` 描述什么，不描述什么？
2. 为什么 Sensor endpoint 与 D-PHY endpoint 要互相引用？
3. endpoint 写错时，为什么仍可能读到 Sensor ID？
4. `rockchip-csi2-dphy0` 与 `rkisp-csi-subdev` 分别是哪一层？
```

- [ ] **Step 5: 保存回答并验收**

通过标准：用户能从 DTS 标签追到 `media-ctl -p` 中的真实 entity、pad 和 link。

---

### Task 5: 完成 D-PHY 与 CSI 驱动源码追踪

**Files:**
- Modify: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`

- [ ] **Step 1: 找到 D-PHY 驱动入口**

追踪：

```text
drivers/phy/rockchip/phy-rockchip-csi2-dphy.c
drivers/phy/rockchip/phy-rockchip-csi2-dphy-hw.c
drivers/phy/rockchip/phy-rockchip-csi2-dphy-common.h
```

记录 compatible、probe、subdev 注册、endpoint 解析和 Lane 配置对应函数。

- [ ] **Step 2: 找到 CSI 接收端入口**

追踪：

```text
drivers/media/platform/rockchip/isp/csi.c
drivers/media/platform/rockchip/isp/csi.h
```

记录 `rkisp-csi-subdev` 的创建、pad、格式传递和与 ISP 的连接。

- [ ] **Step 3: 将启动日志映射到代码**

至少解释：

```text
rockchip-csi2-dphy csi2-dphy0: csi2 dphy0 probe successfully!
rockchip-csi2-dphy-hw fe870000.csi2-dphy-hw: csi2 dphy hw probe successfully!
dphy0 matches m00_b_imx415 4-001a-1:bus type 4
```

- [ ] **Step 4: 用户完成第三轮验收题**

```text
1. D-PHY 驱动从哪里获得 Lane 数和远端 Sensor？
2. 为什么 D-PHY probe 成功不等于已经收到正确图像？
3. `rkisp-csi-subdev` 为什么需要 Sink Pad 和 Source Pad？
4. 哪条日志能证明 Sensor endpoint 已与 D-PHY 匹配？
```

- [ ] **Step 5: 保存回答并验收**

通过标准：用户能从一条启动日志回到对应驱动文件、函数和 DTS 资源。

---

### Task 6: 完成排障、面试表达与章节总验收

**Files:**
- Modify: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`

- [ ] **Step 1: 建立故障表**

至少覆盖：

```text
data-lanes 两端不一致
endpoint 远端引用错误
Clock Lane 或 Data Lane 接反/断路
Lane 速率或时序配置错误
Sensor ID 正常但 Media Graph 不完整
Media Graph 完整但抓帧超时或花屏
```

- [ ] **Step 2: 建立固定排查顺序**

```text
原理图 Lane 连接
→ DTS data-lanes
→ 双向 endpoint
→ D-PHY probe 日志
→ media-ctl entity/pad/link
→ RKISP 输入格式
→ v4l2-ctl 抓帧
```

- [ ] **Step 3: 写面试表达**

面试表达必须独立说明：

```text
D-PHY 与 CSI-2 Receiver 的区别
四 Lane 为什么仍是串行
endpoint 如何建立 Sensor 到 ISP 的数据关系
Sensor ID 成功为什么不能证明 MIPI 图像正确
```

- [ ] **Step 4: 执行九项章节验收**

逐项核对设计文档第 8 节定义的九项范围，所有问题必须有用户原始回答、正确答案和证据。

- [ ] **Step 5: 标记章节完成**

将 front matter 改为：

```yaml
---
web-publish: true
learning-status: completed
chapter: 2
---
```

只有 Step 4 全部通过后才能执行。

---

### Task 7: 发布正式 HTML 并接入框架图

**Files:**
- Modify: `06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md`
- Modify: `06-任务/RK3568-Camera驱动学习总入口.md`
- Modify: `04-项目/14-Phase0-驱动层全链路框架图.html`
- Modify: `tools/tests/multipage-site.test.mjs`
- Generate: `00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第2章-MIPI-DPHY与CSI2.html`

- [ ] **Step 1: 写框架图入口失败测试**

在 `tools/tests/multipage-site.test.mjs` 增加：

```js
test('driver framework links the completed D-PHY and CSI-2 chapter', () => {
  const framework = readHtml(path.join(vaultRoot, '04-项目', '14-Phase0-驱动层全链路框架图.html'));
  assert.match(framework, /进入学习：MIPI D-PHY 与 CSI-2/u);
  assert.match(
    framework,
    /06-任务--Camera驱动第2章-MIPI-DPHY与CSI2\.html/u,
  );
});
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run:

```powershell
node --test --test-name-pattern="completed D-PHY and CSI-2 chapter" tools/tests/multipage-site.test.mjs
```

Expected: FAIL，因为框架图还没有正式入口。

- [ ] **Step 3: 生成正式 HTML**

Run:

```powershell
node tools/build-dashboard.mjs .
```

确认生成：

```powershell
Test-Path "00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第2章-MIPI-DPHY与CSI2.html"
```

Expected:

```text
True
```

- [ ] **Step 4: 在框架图增加章节按钮**

按钮文本：

```text
进入学习：MIPI D-PHY 与 CSI-2
```

目标：

```text
../00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第2章-MIPI-DPHY与CSI2.html
```

按钮放在 Camera 驱动链路中 MIPI CSI-2/D-PHY 对应节点的学习入口区域，不加入全局顶栏。

- [ ] **Step 5: 更新学习总入口**

记录：

```text
第二章：MIPI D-PHY 与 CSI-2——已完成
下一章：RKISP——学习中
```

- [ ] **Step 6: 运行完整验证**

Run:

```powershell
node --test tools/tests/*.mjs
node tools/check-vault-links.mjs .
```

Expected:

```text
自动化测试失败数：0
Broken wikilinks: 0
Broken relative links: 0
Active-to-archive links: 0
```

- [ ] **Step 7: 浏览器验收**

桌面和 390px 宽度下检查：

```text
章节中文无乱码
原理图图片加载
代码块不越出页面
框架图按钮可点击
上一节点 / 返回框架图 / 下一节点可用
页面没有整体横向溢出
```

- [ ] **Step 8: 提交完成章节**

```powershell
git add -- `
  "06-任务/Camera驱动第2章-MIPI-DPHY与CSI2.md" `
  "06-任务/RK3568-Camera驱动学习总入口.md" `
  "04-项目/14-Phase0-驱动层全链路框架图.html" `
  "00-首页/学习驾驶舱/pages/notes/06-任务--Camera驱动第2章-MIPI-DPHY与CSI2.html" `
  tools/tests/multipage-site.test.mjs
git commit -m "docs: publish MIPI D-PHY and CSI-2 chapter"
```
