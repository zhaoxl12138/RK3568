import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { afterEach, beforeEach, test } from 'node:test';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildDashboardData,
  buildObsidianUrl,
  renderMarkdown,
  parseStageTable,
  parseTaskBoard,
  writeDashboardData,
} from '../build-dashboard.mjs';

const generatorPath = fileURLToPath(new URL('../build-dashboard.mjs', import.meta.url));
let vaultDir;

async function writeFixture(relativePath, contents = '') {
  const filePath = path.join(vaultDir, ...relativePath.split('/'));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

function runCli(...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [generatorPath, ...args], { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stderr, stdout }));
  });
}

beforeEach(async () => {
  vaultDir = await mkdtemp(path.join(tmpdir(), 'rk3568-dashboard-'));
});

afterEach(async () => {
  await rm(vaultDir, { recursive: true, force: true });
});

test('parseTaskBoard gets the current stage and checkbox text from named sections', () => {
  const parsed = parseTaskBoard(`
## 当前阶段
- 阶段：阶段 4：OpenCV 接入 Camera

## 本轮唯一任务
- [ ] 保存一帧 Camera 图像
- [x] 解释 appsink 的职责

## 暂不做
- [ ] 不属于本轮的任务
`);

  assert.equal(parsed.currentStage, '阶段 4：OpenCV 接入 Camera');
  assert.deepEqual(parsed.currentTasks, [
    { completed: false, text: '保存一帧 Camera 图像' },
    { completed: true, text: '解释 appsink 的职责' },
  ]);
});

test('parseTaskBoard supports CRLF and uppercase checkbox markers', () => {
  const parsed = parseTaskBoard([
    '## 当前阶段',
    '- 阶段：阶段 2：Camera/V4L2',
    '',
    '## 本轮唯一任务',
    '- [X] 检查 media topology',
    '- [ ] 抓取 NV12 原始帧',
    '',
    '## 阶段验收',
  ].join('\r\n'));

  assert.equal(parsed.currentStage, '阶段 2：Camera/V4L2');
  assert.deepEqual(parsed.currentTasks, [
    { completed: true, text: '检查 media topology' },
    { completed: false, text: '抓取 NV12 原始帧' },
  ]);
});

test('parseStageTable parses rows from the current acceptance Markdown table', () => {
  const stages = parseStageTable(`
## 阶段总表
| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|
| 0 系统地图 | 数据怎样流动 | 数据流图 | 说明模块边界 | [[系统地图]] |
| 1 Buildroot 验机 | 系统是否可用 | 串口日志 | 区分故障层 | [[验机记录]] |
`);

  assert.deepEqual(stages, [
    {
      id: '0',
      stageKey: 'stage-0',
      normalizedLabel: '阶段 0 系统地图',
      label: '0 系统地图',
      question: '数据怎样流动',
      minimumEvidence: '数据流图',
      criteria: '说明模块边界',
      evidenceEntry: '[[系统地图]]',
      status: 'planned',
    },
    {
      id: '1',
      stageKey: 'stage-1',
      normalizedLabel: '阶段 1 Buildroot 验机',
      label: '1 Buildroot 验机',
      question: '系统是否可用',
      minimumEvidence: '串口日志',
      criteria: '区分故障层',
      evidenceEntry: '[[验机记录]]',
      status: 'planned',
    },
  ]);
});

test('parseStageTable preserves unknown for an explicitly unrecognized status', () => {
  const stages = parseStageTable(`
## \u9636\u6bb5\u603b\u8868
| \u9636\u6bb5 | \u8981\u56de\u7b54\u7684\u95ee\u9898 | \u6700\u5c0f\u8f93\u51fa\u8bc1\u636e | \u901a\u8fc7\u6807\u51c6 | \u8bc1\u636e\u5165\u53e3 | \u72b6\u6001 |
|---|---|---|---|---|---|
| 1 Buildroot | q | e | c | [[e]] | blocked |
`);

  assert.equal(stages[0].status, 'unknown');
});

test('parseStageTable normalizes equivalent stage labels to stable keys', () => {
  const stages = parseStageTable(`
## \u9636\u6bb5\u603b\u8868
| \u9636\u6bb5 | \u8981\u56de\u7b54\u7684\u95ee\u9898 | \u6700\u5c0f\u8f93\u51fa\u8bc1\u636e | \u901a\u8fc7\u6807\u51c6 | \u8bc1\u636e\u5165\u53e3 |
|---|---|---|---|---|
| \u9636\u6bb5 1\uff0cBuildroot \u677f\u7aef\u9a8c\u673a | q | e | c | [[e1]] |
| \u9636\u6bb5 1\uff1aBuildroot \u677f\u7aef\u9a8c\u673a | q | e | c | [[e2]] |
| 1 Buildroot \u9a8c\u673a | q | e | c | [[e3]] |
| Buildroot \u9a8c\u673a | q | e | c | [[unknown]] |
`);

  assert.deepEqual(stages.map(({ id, stageKey, normalizedLabel }) => ({ id, stageKey, normalizedLabel })), [
    { id: '1', stageKey: 'stage-1', normalizedLabel: '\u9636\u6bb5 1 Buildroot \u677f\u7aef\u9a8c\u673a' },
    { id: '1', stageKey: 'stage-1', normalizedLabel: '\u9636\u6bb5 1 Buildroot \u677f\u7aef\u9a8c\u673a' },
    { id: '1', stageKey: 'stage-1', normalizedLabel: '\u9636\u6bb5 1 Buildroot \u9a8c\u673a' },
    { id: '', stageKey: 'unknown', normalizedLabel: 'Buildroot \u9a8c\u673a' },
  ]);
});

test('parseStageTable canonicalizes leading zeros in stage numbers', () => {
  const stages = parseStageTable(`
## \u9636\u6bb5\u603b\u8868
| \u9636\u6bb5 | \u8981\u56de\u7b54\u7684\u95ee\u9898 | \u6700\u5c0f\u8f93\u51fa\u8bc1\u636e | \u901a\u8fc7\u6807\u51c6 | \u8bc1\u636e\u5165\u53e3 |
|---|---|---|---|---|
| 01 Buildroot | q | e | c | [[e]] |
| \u9636\u6bb5 1 Buildroot | q | e | c | [[e2]] |
`);

  assert.deepEqual(stages.map(({ id, stageKey }) => ({ id, stageKey })), [
    { id: '1', stageKey: 'stage-1' },
    { id: '1', stageKey: 'stage-1' },
  ]);
});

test('parseStageTable supports optional pipes and escaped pipes inside cells', () => {
  const stages = parseStageTable(`
## 阶段总表
阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口
--- | --- | --- | --- | ---
0 系统地图 | 数据 \\| 控制怎样流动 | 数据流图 | 说明边界 | [[系统地图]]
| 1 Buildroot 验机 | 系统是否可用 | 串口日志 | 区分故障层 | [[验机记录]] |
`);

  assert.equal(stages.length, 2);
  assert.equal(stages[0].question, '数据 | 控制怎样流动');
  assert.equal(stages[1].evidenceEntry, '[[验机记录]]');
});

test('parseStageTable ignores fenced examples and stops after the first relevant table', () => {
  const stages = parseStageTable(`
## 阶段总表

\`\`\`markdown
| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|
| 99 示例 | 不应读取 | 示例 | 示例 | [[示例]] |
\`\`\`

| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|
| 0 系统地图 | 数据怎样流动 | 数据流图 | 说明边界 | [[系统地图]] |

### 后续示例

| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|
| 88 后续表格 | 不应吸收 | 示例 | 示例 | [[后续]] |
`);

  assert.deepEqual(stages.map(({ id }) => id), ['0']);
});

test('buildDashboardData indexes evidence assets with stage labels and warns for unknown stages', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
### 阶段 4 OpenCV
![[opencv_frame.jpg]]

### 未知阶段
[演示](assets/demo.mp4)
`),
    writeFixture('05-实验与证据/实验产物/assets/opencv_frame.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/demo.mp4', 'video'),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map(({ name, stageLabel, type }) => ({ name, stageLabel, type })), [
    { name: 'demo.mp4', stageLabel: 'unknown', type: 'video' },
    { name: 'opencv_frame.jpg', stageLabel: '阶段 4 OpenCV', type: 'image' },
  ]);
  assert.ok(data.warnings.some((warning) => warning.includes('demo.mp4')));
});

test('buildDashboardData assigns evidenceStageKey across punctuation variants and warns for unknown formats', async () => {
  await Promise.all([
    writeFixture('07-专项笔记/系统/AI Camera分阶段验收标准.md', `
## 阶段总表
| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|
| 1 Buildroot \u9a8c\u673a | q | e | c | [[e]] |
| Buildroot 验机 | q | e | c | [[unknown]] |
`),
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
### 相同阶段一的证据
![[evidence-a.jpg]]
用到阶段：阶段 1，Buildroot 板端验机

### 相同阶段二的证据
![[evidence-b.jpg]]
用到阶段：阶段 1：Buildroot 板端验机

### 无法识别
![[evidence-unknown.jpg]]
用到阶段：Buildroot 验机
`),
    writeFixture('05-实验与证据/实验产物/assets/evidence-a.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/evidence-b.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/evidence-unknown.jpg', 'image'),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map(({ name, evidenceStageKey }) => ({ name, evidenceStageKey })), [
    { name: 'evidence-a.jpg', evidenceStageKey: 'stage-1' },
    { name: 'evidence-b.jpg', evidenceStageKey: 'stage-1' },
    { name: 'evidence-unknown.jpg', evidenceStageKey: 'unknown' },
  ]);
  assert.ok(data.warnings.includes('Unknown stage format: Buildroot 验机'));
});

test('buildDashboardData distinguishes missing and explicitly invalid evidence stages', async () => {
  await Promise.all([
    writeFixture('05-\u5b9e\u9a8c\u4e0e\u8bc1\u636e/\u5b9e\u9a8c\u4ea7\u7269/01-\u5b9e\u9a8c\u4ea7\u7269\u7d22\u5f15.md', `
### \u9636\u6bb5 2 Missing field
![[missing-field.jpg]]

### \u9636\u6bb5 3 Explicit invalid field
![[explicit-invalid.jpg]]
\u7528\u5230\u9636\u6bb5\uff1aNot a stage
`),
    writeFixture('05-\u5b9e\u9a8c\u4e0e\u8bc1\u636e/\u5b9e\u9a8c\u4ea7\u7269/assets/missing-field.jpg', 'image'),
    writeFixture('05-\u5b9e\u9a8c\u4e0e\u8bc1\u636e/\u5b9e\u9a8c\u4ea7\u7269/assets/explicit-invalid.jpg', 'image'),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map(({ name, stageLabel, evidenceStageKey }) => ({
    name,
    stageLabel,
    evidenceStageKey,
  })), [
    { name: 'explicit-invalid.jpg', stageLabel: 'Not a stage', evidenceStageKey: 'unknown' },
    { name: 'missing-field.jpg', stageLabel: '\u9636\u6bb5 2 Missing field', evidenceStageKey: 'stage-2' },
  ]);
  assert.ok(data.warnings.includes('Evidence has unknown stage: explicit-invalid.jpg'));
  assert.equal(data.warnings.includes('Evidence has unknown stage: missing-field.jpg'), false);
});

test('buildDashboardData parses realistic evidence sections, later stage fields, and embed aliases', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
## 关键实验产物

### 1. OpenCV单帧JPG

仓库内备份：

\`\`\`text
05-实验与证据\\实验产物\\assets\\opencv_frame_gst.jpg
\`\`\`

图片预览：

![[assets\\opencv_frame_gst.jpg|OpenCV frame|640x480]]

用到阶段：

\`\`\`text
OpenCV 读取 Camera。
\`\`\`

### 2. 网络拉流结果

![[assets/yolo_hls_pull_test_frame.jpg|480]]
`),
    writeFixture('05-实验与证据/实验产物/assets/opencv_frame_gst.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/yolo_hls_pull_test_frame.jpg', 'image'),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map(({ name, stageLabel }) => ({ name, stageLabel })), [
    { name: 'opencv_frame_gst.jpg', stageLabel: 'OpenCV 读取 Camera。' },
    { name: 'yolo_hls_pull_test_frame.jpg', stageLabel: 'unknown' },
  ]);
  assert.equal(data.evidence[0].evidenceStageKey, 'stage-4');
  assert.equal(data.warnings.some((warning) => warning.includes('opencv_frame_gst.jpg')), false);
  assert.equal(data.warnings.filter((warning) => warning.includes('yolo_hls_pull_test_frame.jpg')).length, 1);
});

test('buildDashboardData maps explicit evidence semantics to stable learning stages', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
### OpenCV 默认摄像头读取 Camera
![[opencv.jpg]]

### RKNN 最小例程
![[rknn.jpg]]

### Camera + RKNN 推理
![[inference.jpg]]

### Streaming RTMP/HLS
![[streaming.jpg]]

### MIPI 显示
![[display.jpg]]

### 未知实验语义
![[unknown.jpg]]
`),
    ...['opencv.jpg', 'rknn.jpg', 'inference.jpg', 'streaming.jpg', 'display.jpg', 'unknown.jpg']
      .map((name) => writeFixture(`05-实验与证据/实验产物/assets/${name}`, 'image')),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map(({ name, evidenceStageKey }) => ({ name, evidenceStageKey })), [
    { name: 'display.jpg', evidenceStageKey: 'stage-7' },
    { name: 'inference.jpg', evidenceStageKey: 'stage-6' },
    { name: 'opencv.jpg', evidenceStageKey: 'stage-4' },
    { name: 'rknn.jpg', evidenceStageKey: 'stage-5' },
    { name: 'streaming.jpg', evidenceStageKey: 'stage-8' },
    { name: 'unknown.jpg', evidenceStageKey: 'unknown' },
  ]);
  assert.ok(data.warnings.includes('Evidence has unknown stage: unknown.jpg'));
});

test('buildDashboardData emits resolvable browser and vault paths with media metadata', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
### 1. Gallery media
![[assets/opencv_frame.jpg]]
![[assets/demo.mp4]]
用到阶段：Stage media
`),
    writeFixture('05-实验与证据/实验产物/assets/opencv_frame.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/demo.mp4', 'video'),
  ]);

  const data = await buildDashboardData(vaultDir);
  const dashboardDir = path.join(vaultDir, '00-首页/学习驾驶舱');

  assert.deepEqual(data.evidence.map((item) => ({
    name: item.name,
    type: item.type,
    mediaType: item.mediaType,
    vaultPath: item.vaultPath,
    assetPath: item.assetPath,
  })), [
    {
      name: 'demo.mp4',
      type: 'video',
      mediaType: 'video/mp4',
      vaultPath: '05-实验与证据/实验产物/assets/demo.mp4',
      assetPath: '../../05-实验与证据/实验产物/assets/demo.mp4',
    },
    {
      name: 'opencv_frame.jpg',
      type: 'image',
      mediaType: 'image/jpeg',
      vaultPath: '05-实验与证据/实验产物/assets/opencv_frame.jpg',
      assetPath: '../../05-实验与证据/实验产物/assets/opencv_frame.jpg',
    },
  ]);
  await Promise.all(data.evidence.map((item) => access(path.resolve(dashboardDir, item.assetPath))));
});

test('buildDashboardData sorts normalized evidence names and warnings deterministically', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
### 1. 无阶段
![[assets\\中.jpg|300]]
![[assets/a.jpg|别名]]
![[assets\\é.jpg]]
![[assets/é.jpg]]
![[assets/a.jpg|重复]]
`),
    writeFixture('05-实验与证据/实验产物/assets/中.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/a.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/é.jpg', 'image'),
  ]);

  const first = await buildDashboardData(vaultDir);
  const second = await buildDashboardData(vaultDir);

  assert.deepEqual(first.evidence.map(({ name }) => name), ['a.jpg', 'é.jpg', '中.jpg']);
  assert.deepEqual(first.warnings, second.warnings);
  assert.deepEqual(first.warnings.slice(0, 2), [
    'Missing optional task board: 06-任务/01-下一步任务看板.md',
    'Missing optional acceptance table: 07-专项笔记/系统/AI Camera分阶段验收标准.md',
  ]);
  assert.equal(new Set(first.warnings).size, first.warnings.length);
  assert.deepEqual(first.warnings.filter((warning) => warning.startsWith('Evidence has unknown stage:')), [
    'Evidence has unknown stage: a.jpg',
    'Evidence has unknown stage: é.jpg',
    'Evidence has unknown stage: 中.jpg',
  ]);
});

test('buildDashboardData matches exact case-sensitive basenames without substring collisions', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
### 1. Referenced lowercase asset
![[assets/myfoo.jpg]]
用到阶段：Stage lowercase

### 2. Wrong-case reference
![[assets/FOO.jpg]]
用到阶段：Wrong case
`),
    writeFixture('05-实验与证据/实验产物/assets/foo.jpg', 'image'),
    writeFixture('05-实验与证据/实验产物/assets/myfoo.jpg', 'image'),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map(({ name, stageLabel }) => ({ name, stageLabel })), [
    { name: 'foo.jpg', stageLabel: 'unknown' },
    { name: 'myfoo.jpg', stageLabel: 'Stage lowercase' },
  ]);
  assert.equal(data.warnings.filter((warning) => warning.includes('foo.jpg')).length, 2);
  assert.ok(data.warnings.includes('Evidence has unknown stage: foo.jpg'));
  assert.equal(data.warnings.some((warning) => warning.includes('FOO.jpg')), false);
});

test('buildDashboardData ignores temp and historical filenames absent from gallery assets', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/实验产物/01-实验产物索引.md', `
### 1. Gallery asset
![[assets/opencv_frame.jpg]]
用到阶段：Stage gallery

### 历史输入与临时输出
5.png
bus.jpg
/tmp/scrfd_result.jpg
E:\\temp\\yolov5_result.jpg
`),
    writeFixture('05-实验与证据/实验产物/assets/opencv_frame.jpg', 'image'),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map(({ name }) => name), ['opencv_frame.jpg']);
  assert.equal(data.warnings.some((warning) => /5\.png|bus\.jpg|scrfd_result\.jpg|yolov5_result\.jpg/u.test(warning)), false);
});

test('buildObsidianUrl separately encodes the Chinese vault and normalized file path', () => {
  assert.equal(
    buildObsidianUrl('RK3568 学习库', '07-专项笔记\\系统\\AI Camera分阶段验收标准.md'),
    'obsidian://open?vault=RK3568%20%E5%AD%A6%E4%B9%A0%E5%BA%93&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FAI%20Camera%E5%88%86%E9%98%B6%E6%AE%B5%E9%AA%8C%E6%94%B6%E6%A0%87%E5%87%86',
  );
});

test('buildDashboardData returns the dashboard shape and warns for missing optional evidence', async () => {
  await Promise.all([
    writeFixture('06-任务/01-下一步任务看板.md', `
## 当前阶段
- 阶段：阶段 1：Buildroot 验机
## 本轮唯一任务
- [ ] 检查串口
`),
    writeFixture('07-专项笔记/系统/AI Camera分阶段验收标准.md', `
## 阶段总表
| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 |
|---|---|---|---|---|
| 1 Buildroot 验机 | 系统可用吗 | 串口日志 | 能区分故障 | [[验机记录]] |
`),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(Object.keys(data), [
    'currentStage', 'currentTasks', 'stages', 'domains', 'evidence', 'quickLinks', 'warnings',
  ]);
  assert.equal(data.stages[0].status, 'current');
  assert.equal(data.warnings.some((warning) => warning.startsWith('Unknown stage status:')), false);
  assert.deepEqual(data.domains.map(({ name }) => name), [
    'Camera', 'OpenCV', 'RKNN', 'Display', 'Streaming', 'System',
  ]);
  assert.equal(data.quickLinks.length, 9);
  const projectTalk = data.quickLinks.find(({ name }) => name === 'projectTalk');
  assert.equal(projectTalk.name, 'projectTalk');
  assert.equal(projectTalk.url, buildObsidianUrl('RK3568', projectTalk.filePath));
  assert.match(projectTalk.webPath, /^pages\/notes\/.+\.html$/u);
  assert.ok([...data.domains, ...data.quickLinks].every(({ url }) => url.includes('vault=RK3568&')));
  assert.ok(data.warnings.some((warning) => warning.includes('evidence')));
});

test('writeDashboardData emits a valid pretty JSON assignment with the required prefix', async () => {
  const outputFile = path.join(vaultDir, '00-首页/学习驾驶舱/generated/vault-data.js');
  await writeDashboardData(vaultDir, outputFile);
  const emitted = await readFile(outputFile, 'utf8');
  const prefix = 'window.RK3568_VAULT_DATA = ';

  assert.ok(emitted.startsWith(prefix));
  assert.equal(emitted, `${prefix}${JSON.stringify(JSON.parse(emitted.slice(prefix.length, -2)), null, 2)};\n`);
  assert.ok(JSON.parse(emitted.slice(prefix.length, -2)).quickLinks.every(
    ({ url }) => url.includes('vault=RK3568&'),
  ));
});

test('renderMarkdown turns note structure into escaped HTML and safe links', () => {
  const html = renderMarkdown([
    '# Camera 记录',
    '',
    '结论：使用 `appsink` 读取图像。',
    '',
    '- 第一项',
    '- 第二项',
    '',
    '> 注意：不要把用户输入当 HTML。',
    '',
    '```python',
    'print("<camera>")',
    '```',
    '',
    '| 输入 | 输出 |',
    '| --- | --- |',
    '| NV12 | BGR |',
    '',
    '参见 [[系统地图|系统地图]]。',
  ].join('\n'), { linkMap: new Map([['系统地图', 'system-map.html']]) });

  assert.match(html, /<h1>Camera 记录<\/h1>/u);
  assert.match(html, /<code>appsink<\/code>/u);
  assert.match(html, /&lt;camera&gt;/u);
  assert.match(html, /<table>[\s\S]*<th>输入<\/th>[\s\S]*<td>BGR<\/td>/u);
  assert.match(html, /href="system-map\.html">系统地图<\/a>/u);
  assert.doesNotMatch(html, /<script>/iu);
});

test('buildDashboardData exposes generated web paths and warns for missing important notes', async () => {
  await writeFixture('06-任务/01-下一步任务看板.md', '## 当前阶段\n- 阶段：1 Buildroot\n\n## 本轮唯一任务\n- [ ] 验机');
  await writeFixture('07-专项笔记/系统/AI Camera分阶段验收标准.md', '## 阶段总表\n| 阶段 | 要回答的问题 | 最小输出证据 | 通过标准 | 证据入口 | 状态 |\n| --- | --- | --- | --- | --- | --- |\n| 1 Buildroot | Q | E | C | [[缺失笔记]] | 计划 |');
  await writeFixture('05-实验与证据/实验产物/01-实验产物索引.md');

  const data = await buildDashboardData(vaultDir);
  const taskBoard = data.quickLinks.find(({ name }) => name === 'taskBoard');
  assert.match(taskBoard.webPath, /pages\/notes\/[^/]+\.html$/u);
  assert.ok(data.warnings.some((warning) => warning.includes('Missing note source')));
});

test('CLI rejects unknown options and nonexistent roots concisely with nonzero exits', async () => {
  const unknown = await runCli('--unknown');
  const missing = await runCli('--root', path.join(vaultDir, 'missing'));
  const extra = await runCli(vaultDir, 'extra');

  assert.deepEqual(unknown, { code: 2, stderr: 'Unknown option: --unknown\n', stdout: '' });
  assert.equal(missing.code, 2);
  assert.equal(missing.stdout, '');
  assert.match(missing.stderr, /^Root directory not found: .+\n$/u);
  assert.deepEqual(extra, { code: 2, stderr: 'Unexpected argument: extra\n', stdout: '' });
});

test('CLI accepts a positional vault root and writes the default output', async () => {
  const result = await runCli(vaultDir);
  const output = await readFile(
    path.join(vaultDir, '00-首页/学习驾驶舱/generated/vault-data.js'),
    'utf8',
  );

  assert.deepEqual(result, { code: 0, stderr: '', stdout: '' });
  assert.ok(output.startsWith('window.RK3568_VAULT_DATA = '));
});
