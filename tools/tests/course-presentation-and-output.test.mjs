import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('static and enhanced navigation share the five approved entry labels', () => {
  const build = read('tools/build-dashboard.mjs');
  const runtime = read('00-首页/学习驾驶舱/site.js');
  for (const label of ['学习首页', '完整路线', '项目', '资料与实验', '当前']) {
    assert.ok(build.includes(label), `static navigation misses ${label}`);
    assert.ok(runtime.includes(label), `runtime navigation misses ${label}`);
  }
  for (const stale of ['当前任务', '>Phase0<']) {
    assert.ok(!build.includes(stale), `static primary navigation keeps ${stale}`);
  }
});

test('course presentation explains maturity and separates core from extension stages', () => {
  const runtime = read('00-首页/学习驾驶舱/site.js');
  for (const label of ['草稿', '学习中', '已验证', '已发布']) assert.ok(runtime.includes(label));
  assert.match(runtime, /00–08 \+ 11/u);
  assert.match(runtime, /09–10/u);
});

test('project page is a bring-up dossier rather than a Phase0 link directory', () => {
  const project = read('00-首页/学习驾驶舱/pages/project.html');
  for (const heading of ['项目目标', '硬件与软件基线', '已完成能力', '实板证据', '关键故障', '可复现步骤', '面试与简历表达', '参考可视化']) {
    assert.ok(project.includes(heading), `project dossier misses ${heading}`);
  }
});

test('interview output has one reusable card template and an evidence-backed project talk', () => {
  const template = read('09-输出沉淀/模板-阶段面试卡.md');
  for (const heading of ['30 秒结论', '90 秒展开', '当前板卡证据', '两个追问', '一个故障场景', '仍不能证明什么']) {
    assert.ok(template.includes(`## ${heading}`), `interview template misses ${heading}`);
  }
  const talk = read('09-输出沉淀/00-项目三分钟讲解.md');
  assert.match(talk, /EVID-/u);
  assert.match(talk, /源码/u);
  assert.match(read('09-输出沉淀/00-输出沉淀入口.md'), /00-项目三分钟讲解/u);
});
