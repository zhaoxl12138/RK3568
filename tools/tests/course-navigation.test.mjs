import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const siteRoot = path.join(repoRoot, '00-首页', '学习驾驶舱');
const siteJsPath = path.join(siteRoot, 'site.js');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadCourseContract() {
  const source = fs.readFileSync(siteJsPath, 'utf8');
  const listeners = {};
  const context = {
    URL,
    document: {
      addEventListener(name, callback) { listeners[name] = callback; },
      readyState: 'loading',
    },
    window: {
      location: new URL('file:///E:/obsidian_github/RK3568/00-首页/学习驾驶舱/index.html'),
    },
  };
  vm.runInNewContext(source, context, { filename: siteJsPath });
  return { contract: context.window.RK3568_COURSE, source };
}

test('course runtime defines one ordered 00-11 route', () => {
  const { contract } = loadCourseContract();

  assert.ok(contract, 'site.js must expose window.RK3568_COURSE');
  assert.deepEqual(Array.from(contract.stages, ({ id }) => id), [
    '00', '01', '02', '03', '04', '05',
    '06', '07', '08', '09', '10', '11',
  ]);
  assert.equal(contract.currentStage, '04');
  assert.equal(new Set(Array.from(contract.stages, ({ path: stagePath }) => stagePath)).size, 12);
  assert.ok(contract.stages.every(({ objective }) => typeof objective === 'string' && objective.length > 10));
});

test('all course targets exist and use one page per stage', () => {
  const { contract } = loadCourseContract();
  assert.ok(contract, 'site.js must expose window.RK3568_COURSE');

  const missing = contract.stages.flatMap(({ id, path: stagePath }) => {
    const target = path.resolve(siteRoot, stagePath);
    return fs.existsSync(target) ? [] : [`${id}: ${stagePath}`];
  });
  assert.equal(missing.length, 0, `missing course targets:\n${Array.from(missing).join('\n')}`);
});

test('shared runtime provides course navigation, context, route, and adjacency', () => {
  const { source } = loadCourseContract();

  for (const functionName of [
    'findCourseStageForPage',
    'renderCourseNavigation',
    'renderCourseContext',
    'renderCourseRoute',
  ]) {
    assert.match(source, new RegExp(`function\\s+${functionName}\\s*\\(`, 'u'));
  }
  for (const label of ['学习首页', '完整路线', '项目', '课程目录', '资料与实验']) {
    assert.match(source, new RegExp(label, 'u'));
  }
  assert.doesNotMatch(source, /primaryItems\s*=\s*\[[\s\S]*?label:\s*['"](?:当前任务|Phase0)['"]/u);
  assert.match(source, /course-footer-nav/u);
  assert.match(source, /is-complete/u);
  assert.match(source, /is-current/u);
  assert.match(source, /is-planned/u);
});

test('shared navigation keeps the approved top-level structure', () => {
  const { source } = loadCourseContract();

  for (const label of ['学习首页', '完整路线', '项目']) {
    assert.match(source, new RegExp(`label:\\s*['"]${label}['"]`, 'u'));
  }
  assert.match(source, /courseSummary\.textContent\s*=\s*['"]课程目录['"]/u);
  assert.match(source, /referenceSummary\.textContent\s*=\s*['"]资料与实验['"]/u);
  assert.match(source, /stageLink\.textContent\s*=\s*['"]当前 /u);
  assert.doesNotMatch(source, /label:\s*['"](?:课程|实验|参考)['"]/u);
});

test('mainline context keeps course progress and previous-route-next navigation', () => {
  const { source } = loadCourseContract();

  assert.match(source, /function\s+renderCourseProgress\s*\(/u);
  assert.match(source, /progress\.className\s*=\s*['"]course-progress['"]/u);
  assert.match(source, /返回完整学习路线/u);
  assert.match(source, /appendAdjacentLink/u);
});

test('stage 03 to 04 to 05 follows the intended Camera learning chain', () => {
  const { contract } = loadCourseContract();
  const stages = Array.from(contract.stages);
  const three = stages.find(({ id }) => id === '03');
  const four = stages.find(({ id }) => id === '04');
  const five = stages.find(({ id }) => id === '05');

  assert.equal(three.title, 'IMX415 Sensor');
  assert.equal(four.title, 'MIPI CSI-2 / D-PHY');
  assert.equal(five.title, 'V4L2 Subdev');
  for (const stage of [three, four, five]) {
    assert.doesNotMatch(stage.path, /Phase0|下一步任务|task/iu);
  }
});

test('system map is stage 00 while Phase0 stays reference-only', () => {
  const systemMap = read('00-首页/学习驾驶舱/pages/system-map.html');
  const phase0 = read('00-首页/学习驾驶舱/pages/phase0.html');

  assert.match(systemMap, /阶段 00|系统总览/u);
  assert.match(phase0, /可视化参考/u);
  assert.doesNotMatch(phase0, /data-course-stage=["']00["']/u);
});

test('homepage is a focused learning cockpit', () => {
  const html = read('00-首页/学习驾驶舱/index.html');

  assert.match(html, /<title>RK3568 Camera 学习驾驶舱<\/title>/u);
  for (const marker of [
    'data-course-current',
    'data-course-objective',
    'data-course-next',
    'data-course-route',
  ]) assert.match(html, new RegExp(marker, 'u'));
  assert.doesNotMatch(html, /<title>[^<]*Phase0/iu);
});

test('learning route uses the shared 00-11 course renderer', () => {
  const html = read('00-首页/学习驾驶舱/pages/learning-route.html');

  assert.match(html, /data-course-route/u);
  assert.doesNotMatch(html, /data-stage=["'](?:0|1|2|3|4|5|6|7|8|9|10)["']/u);
});
