import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const siteRoot = path.join(repoRoot, '00-首页', '学习驾驶舱');
const siteJsPath = path.join(siteRoot, 'site.js');
const generatedPath = path.join(siteRoot, 'generated', 'vault-data.js');
const courseMapPath = path.join(repoRoot, '00-首页', 'course-map.json');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadCourseContract() {
  const generated = fs.readFileSync(generatedPath, 'utf8');
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
  vm.runInNewContext(generated, context, { filename: generatedPath });
  vm.runInNewContext(source, context, { filename: siteJsPath });
  return { contract: context.window.RK3568_COURSE, source };
}

test('course runtime is generated from the single course map', () => {
  const courseMap = JSON.parse(fs.readFileSync(courseMapPath, 'utf8'));
  const { contract, source } = loadCourseContract();

  assert.deepEqual(JSON.parse(JSON.stringify(contract.stages)), courseMap.stages);
  assert.equal(courseMap.currentStage, '05');
  assert.equal(contract.currentStage, '05');
  assert.equal(fs.existsSync(path.join(repoRoot, '00-首页', '00-当前学习状态.md')), false);
  assert.doesNotMatch(source, /COURSE_CURRENT_STAGE|var\s+COURSE_STAGES\s*=|MIPI CSI-2 \/ D-PHY[\s\S]*?path:/u);
});

test('course runtime defines one ordered 00-11 route', () => {
  const { contract } = loadCourseContract();

  assert.ok(contract, 'site.js must expose window.RK3568_COURSE');
  assert.deepEqual(Array.from(contract.stages, ({ id }) => id), [
    '00', '01', '02', '03', '04', '05',
    '06', '07', '08', '09', '10', '11',
  ]);
  assert.equal(contract.currentStage, '05');
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
  const matureStages = contract.stages.filter(({ maturity }) => maturity !== 'placeholder');
  assert.ok(matureStages.every(({ sourcePath }) => sourcePath.endsWith('.md')));
  assert.ok(matureStages.every(({ sourcePath }) => fs.existsSync(path.join(repoRoot, sourcePath))));
  assert.ok(contract.stages.filter(({ maturity }) => maturity === 'placeholder').every(({ sourcePath }) => sourcePath === null));
});

test('every course target loads generated course data before the shared runtime', () => {
  const { contract } = loadCourseContract();
  for (const stage of contract.stages) {
    const html = fs.readFileSync(path.resolve(siteRoot, stage.path), 'utf8');
    const dataIndex = html.search(/<script[^>]+vault-data\.js/iu);
    const siteIndex = html.search(/<script[^>]+site\.js/iu);
    assert.ok(dataIndex >= 0 && dataIndex < siteIndex, `${stage.id} must load vault-data.js before site.js`);
  }
});

test('capability matrix uses C01-C10 and maps every capability to course stages', () => {
  const matrix = read('07-专项笔记/系统/Camera驱动能力验收矩阵.md');
  const ids = Array.from(matrix.matchAll(/^\|\s*(C\d{2})\s*\|/gmu), (match) => match[1]);

  assert.deepEqual(ids, Array.from({ length: 10 }, (_, index) => `C${String(index + 1).padStart(2, '0')}`));
  for (const row of matrix.matchAll(/^\|\s*C\d{2}\s*\|([^\n]+)$/gmu)) {
    assert.match(row[1], /\|\s*(?:\d{2})(?:\s*,\s*\d{2})*\s*\|/u);
  }
});

test('main entry points directly to the current source-reading index', () => {
  const entry = read('00-首页/00-RK3568学习主入口.md');
  assert.match(entry, /\[\[02-源码陪读\/05-V4L2-Subdev\/00-源码陪读索引(?:\||\]\])/u);
  assert.doesNotMatch(entry, /\[\[00-当前学习状态/u);
  assert.doesNotMatch(entry, /Camera驱动第2章-MIPI-DPHY与CSI2/u);
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

test('stage 03 to 08 follows the intended Camera learning chain', () => {
  const { contract } = loadCourseContract();
  const stages = Array.from(contract.stages);
  const three = stages.find(({ id }) => id === '03');
  const four = stages.find(({ id }) => id === '04');
  const five = stages.find(({ id }) => id === '05');
  const six = stages.find(({ id }) => id === '06');
  const seven = stages.find(({ id }) => id === '07');
  const eight = stages.find(({ id }) => id === '08');

  assert.equal(three.title, 'IMX415 Sensor');
  assert.equal(four.title, 'MIPI CSI-2 / D-PHY');
  assert.equal(five.title, 'V4L2 Subdev');
  assert.equal(six.title, 'Media Controller');
  assert.equal(seven.title, 'RKISP');
  assert.equal(eight.title, 'V4L2 用户态取流');
  for (const stage of [three, four, five, six, seven, eight]) {
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
