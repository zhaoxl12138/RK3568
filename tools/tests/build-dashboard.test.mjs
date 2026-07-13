import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { afterEach, beforeEach, test } from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildDashboardData,
  buildObsidianUrl,
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
      label: '0 系统地图',
      question: '数据怎样流动',
      minimumEvidence: '数据流图',
      criteria: '说明模块边界',
      evidenceEntry: '[[系统地图]]',
      status: 'unknown',
    },
    {
      id: '1',
      label: '1 Buildroot 验机',
      question: '系统是否可用',
      minimumEvidence: '串口日志',
      criteria: '区分故障层',
      evidenceEntry: '[[验机记录]]',
      status: 'unknown',
    },
  ]);
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
  assert.deepEqual(data.domains.map(({ name }) => name), [
    'Camera', 'OpenCV', 'RKNN', 'Display', 'Streaming', 'System',
  ]);
  assert.equal(data.quickLinks.length, 8);
  assert.ok(data.warnings.some((warning) => warning.includes('evidence')));
});

test('writeDashboardData emits a valid pretty JSON assignment with the required prefix', async () => {
  const outputFile = path.join(vaultDir, '00-首页/学习驾驶舱/generated/vault-data.js');
  await writeDashboardData(vaultDir, outputFile);
  const emitted = await readFile(outputFile, 'utf8');
  const prefix = 'window.RK3568_VAULT_DATA = ';

  assert.ok(emitted.startsWith(prefix));
  assert.equal(emitted, `${prefix}${JSON.stringify(JSON.parse(emitted.slice(prefix.length, -2)), null, 2)};\n`);
});

test('CLI rejects unknown options and nonexistent roots concisely with nonzero exits', async () => {
  const unknown = await runCli('--unknown');
  const missing = await runCli('--root', path.join(vaultDir, 'missing'));

  assert.deepEqual(unknown, { code: 2, stderr: 'Unknown option: --unknown\n', stdout: '' });
  assert.equal(missing.code, 2);
  assert.equal(missing.stdout, '');
  assert.match(missing.stderr, /^Root directory not found: .+\n$/u);
});
