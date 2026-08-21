import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const activeCourses = [
  ['00', '01-课程主线/00-系统总览.md'],
  ['01', '01-课程主线/01-Linux-Driver-Model.md'],
  ['02', '01-课程主线/02-DTS与设备发现.md'],
  ['03', '01-课程主线/03-IMX415-Sensor-Bring-up.md'],
  ['04', '01-课程主线/04-MIPI-CSI2-DPHY.md'],
  ['05', '01-课程主线/05-V4L2-Subdev.md'],
  ['06', '01-课程主线/06-Media-Controller.md'],
  ['07', '01-课程主线/07-RKISP.md'],
  ['08', '01-课程主线/08-V4L2用户态取流.md'],
];

const requiredSections = [
  '为什么学习',
  '在整条链路中的位置',
  '输入 / 输出 / 软件身份 / 硬件身份',
  'RK3568 当前对应',
  'DTS / 源码入口',
  '实板验证',
  '常见故障',
  '面试表达',
  '验收题',
  '下一阶段接口',
];

test('durable course and D-PHY source-reading notes live outside 06-任务', () => {
  for (const [, relative] of activeCourses) {
    assert.ok(fs.existsSync(path.join(root, relative)), `missing ${relative}`);
  }
  assert.ok(fs.existsSync(path.join(root, '02-源码陪读/04-DPHY/00-源码陪读索引.md')));

  for (const oldPath of [
    '06-任务/2026-08-08-Linux Camera驱动框架总览.md',
    '06-任务/IMX415-DTS 解读 -2026年7月31日.md',
    '06-任务/03-IMX415-Sensor-Bring-up.md',
    '06-任务/04-MIPI-CSI2-DPHY.md',
    '06-任务/Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md',
  ]) assert.ok(!fs.existsSync(path.join(root, oldPath)), `stale durable note: ${oldPath}`);
});

test('stages 00-08 use the course metadata schema', () => {
  for (const [stage, relative] of activeCourses) {
    const source = read(relative);
    assert.match(source, /^---\s*[\s\S]*?^doc-type:\s*course\s*$[\s\S]*?^course-stage:\s*["']?\d{2}["']?\s*$[\s\S]*?^learning-status:\s*(?:not-started|in-progress|understood|review-needed)\s*$[\s\S]*?^evidence-status:\s*(?:none|partial|verified|superseded)\s*$[\s\S]*?^publish-status:\s*(?:private|draft|published)\s*$[\s\S]*?^---\s*$/mu);
    assert.match(source, new RegExp(`^course-stage:\\s*["']?${stage}["']?\\s*$`, 'mu'));
    if (Number(stage) <= 4) {
      const sections = Array.from(source.matchAll(/^## ([^\r\n]+)/gmu), (match) => match[1]);
      assert.deepEqual(sections, requiredSections, `${relative} must use the fixed course template`);
    }
  }
});

test('course map points 00-08 at canonical sources and keeps 09-11 as placeholders only', () => {
  const stages = JSON.parse(read('00-首页/course-map.json')).stages;
  for (const [stage, relative] of activeCourses) {
    const item = stages.find(({ id }) => id === stage);
    assert.equal(item.sourcePath, relative);
    assert.notEqual(item.maturity, 'placeholder');
  }
  for (const item of stages.filter(({ id }) => Number(id) >= 9)) {
    assert.equal(item.maturity, 'placeholder', `${item.id} must remain a maturity placeholder`);
    assert.equal(item.sourcePath, null, `${item.id} must not claim a course正文`);
  }
});

test('weekly plan contains execution state, verification, and review links but no answer key', () => {
  const plan = read('06-任务/Camera驱动求职第1周执行计划.md');
  for (const heading of ['执行', '状态', '验收链接', '复盘链接']) {
    assert.match(plan, new RegExp(`^## ${heading}$`, 'mu'));
  }
  assert.doesNotMatch(plan, /正确答案|我的回答|判断：/u);
});
