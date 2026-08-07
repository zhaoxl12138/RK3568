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
  for (const label of ['学习首页', '完整路线', '课程目录', '资料与实验']) {
    assert.match(source, new RegExp(label, 'u'));
  }
  assert.doesNotMatch(source, /primaryItems\s*=\s*\[[\s\S]*?label:\s*['"](?:当前任务|Phase0)['"]/u);
  assert.match(source, /course-footer-nav/u);
  assert.match(source, /is-complete/u);
  assert.match(source, /is-current/u);
  assert.match(source, /is-planned/u);
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
