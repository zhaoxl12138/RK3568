import assert from 'node:assert/strict';
import fs from 'node:fs';
import { afterEach, beforeEach, test } from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDashboardData } from '../build-dashboard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let vaultDir;

async function writeFixture(relativePath, contents = '') {
  const filePath = path.join(vaultDir, ...relativePath.split('/'));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

beforeEach(async () => {
  vaultDir = await mkdtemp(path.join(tmpdir(), 'rk3568-evidence-'));
});

afterEach(async () => {
  await rm(vaultDir, { recursive: true, force: true });
});

test('dashboard indexes auditable evidence records even when they have no attachment', async () => {
  await Promise.all([
    writeFixture('05-实验与证据/00-Camera证据索引.md', '# Camera 证据索引'),
    writeFixture('05-实验与证据/2026-07-28-runtime.md', `---
id: EVID-20260728-RUNTIME
doc-type: evidence
title: 运行时配置
course-stage: "02"
evidence-status: verified
collected-at: 2026-07-28
board: ATK-DLRK3568 + IMX415
system: Buildroot
kernel: 4.19.232
sdk-commit: unknown
dtb: running-dtb-unidentified
device-ip: 192.168.0.230
raw-output-file: embedded-transcript
---

## 操作目的
读取运行时配置。

## 原始命令

\`\`\`sh
grep -R imx415 /sys/firmware/devicetree/base
\`\`\`

## 原始输出
embedded

## 可以证明
运行时节点存在。

## 不能证明
不能证明当前 DTB 文件名。

## 关联课程阶段
02

## 状态
verified
`),
    writeFixture('05-实验与证据/2026-07-28-media.md', `---
id: EVID-20260728-MEDIA
doc-type: evidence
title: Media Graph
course-stage: "04"
evidence-status: superseded
collected-at: 2026-07-28
board: ATK-DLRK3568 + IMX415
system: Buildroot
kernel: 4.19.232
sdk-commit: unknown
dtb: running-dtb-unidentified
device-ip: 192.168.0.230
raw-output-file: media-ctl.txt
---

## 操作目的
核对 Media Graph。

## 原始命令
media-ctl -p

## 原始输出
media graph

## 可以证明
拓扑已建立。

## 不能证明
不能证明已抓帧。

## 关联课程阶段
04

## 状态
superseded
`),
  ]);

  const data = await buildDashboardData(vaultDir);

  assert.deepEqual(data.evidence.map((item) => ({
    id: item.id,
    name: item.name,
    evidenceStageKey: item.evidenceStageKey,
    status: item.status,
    sourcePath: item.sourcePath,
    kernel: item.environment.kernel,
    attachmentCount: item.attachments.length,
  })), [
    {
      id: 'EVID-20260728-MEDIA',
      name: 'Media Graph',
      evidenceStageKey: 'stage-4',
      status: 'superseded',
      sourcePath: '05-实验与证据/2026-07-28-media.md',
      kernel: '4.19.232',
      attachmentCount: 0,
    },
    {
      id: 'EVID-20260728-RUNTIME',
      name: '运行时配置',
      evidenceStageKey: 'stage-2',
      status: 'verified',
      sourcePath: '05-实验与证据/2026-07-28-runtime.md',
      kernel: '4.19.232',
      attachmentCount: 0,
    },
  ]);
});

test('Task 7 evidence documents preserve audit fields and resolve known environment conflicts', () => {
  const evidenceFiles = [
    '05-实验与证据/2026-07-28-Camera驱动Day1验收.md',
    '05-实验与证据/2026-07-28-直连板端读取IMX415配置.md',
  ];
  for (const relativePath of evidenceFiles) {
    const markdown = fs.readFileSync(path.join(root, relativePath), 'utf8');
    for (const field of ['id', 'doc-type: evidence', 'course-stage', 'evidence-status', 'collected-at', 'board', 'system', 'kernel', 'sdk-commit', 'dtb', 'device-ip', 'raw-output-file']) {
      assert.match(markdown, new RegExp(`^${field.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}(?:\\s*:|\\b)`, 'mu'), `${relativePath} missing ${field}`);
    }
    for (const heading of ['环境快照', '操作目的', '原始命令', '原始输出', '可以证明', '不能证明', '关联课程阶段', '状态']) {
      assert.match(markdown, new RegExp(`^## ${heading}$`, 'mu'), `${relativePath} missing ${heading}`);
    }
  }

  const baseline = fs.readFileSync(path.join(root, '05-实验与证据/环境基线/RK3568-IMX415当前基线.md'), 'utf8');
  for (const fact of ['4.19.232', '4.19.255', '192.168.0.103', '192.168.0.230', 'YUYV8_2X8', 'NV12', '/dev/video7', '/dev/video8', '1280×720', '1920×1080', '3840×2160']) {
    assert.match(baseline, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'), `baseline missing ${fact}`);
  }
  assert.match(baseline, /4\.19\.255[\s\S]{0,180}(?:未保留|未核实|不能)/u);
  assert.match(baseline, /YUYV8_2X8[\s\S]{0,220}Media bus[\s\S]{0,220}NV12[\s\S]{0,220}(?:memory|内存)/iu);
  assert.match(baseline, /\/dev\/video7[\s\S]{0,120}statistics[\s\S]{0,180}\/dev\/video8[\s\S]{0,120}input-params/iu);
  assert.match(baseline, /1920×1080[\s\S]{0,180}(?:显式|协商)/u);

  const manifest = fs.readFileSync(path.join(root, '05-实验与证据/assets/manifest.md'), 'utf8');
  for (const hash of [
    '1CAE3CF1191522AD378CB25D21B996765C4994617145C4C805195DD88D9319EF',
    '28EF940E74E549984464C28E54118C0943DDC6E265DC38AF557BC9D231B886BF',
    'CD9F09B0E29E3BC77709AF19ADDEB51CA26111AB444DB2DE461F312129FC056B',
  ]) assert.match(manifest, new RegExp(hash, 'u'));
  assert.match(manifest, /tmp\/pdfs\/imx415-datasheet-page-84\.png/u);
  assert.match(manifest, /第 84 页/u);
});
