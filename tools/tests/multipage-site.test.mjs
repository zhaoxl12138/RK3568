import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const siteRoot = path.join(repoRoot, '00-首页', '学习驾驶舱');

const contentPages = [
  'learning-route.html',
  'system-map.html',
  'phase0.html',
  'project.html',
  'evidence.html',
  'environment.html',
  'notes.html',
  'archive.html'
];

const phase0Pages = [
  '10-Phase0-可视化总入口.html',
  '12-Phase0-数据流动画.html',
  '13-Phase0-Camera配置全流程.html',
  '14-Phase0-驱动层全链路框架图.html',
  '15-Phase0-RK3568全系统框架图.html'
].map((name) => path.join(repoRoot, '04-项目', name));

function expectedPages() {
  return [
    path.join(siteRoot, 'index.html'),
    ...contentPages.map((name) => path.join(siteRoot, 'pages', name)),
    ...phase0Pages
  ];
}

function readHtml(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function existingPages() {
  return [
    path.join(siteRoot, 'index.html'),
    ...contentPages.map((name) => path.join(siteRoot, 'pages', name))
  ].filter((filePath) => fs.existsSync(filePath));
}

function collectHtmlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.html') ? [filePath] : [];
  });
}

function activeHtmlPages() {
  return [
    ...collectHtmlFiles(siteRoot),
    ...collectHtmlFiles(path.join(repoRoot, '04-项目')),
  ];
}

function relativeHrefTargets(filePath) {
  return [...readHtml(filePath).matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/giu)]
    .map((match) => match[1])
    .filter((href) => href && !href.startsWith('#') && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(href))
    .map((href) => href.split(/[?#]/u, 1)[0])
    .filter(Boolean)
    .map((href) => ({ href, target: path.resolve(path.dirname(filePath), href) }));
}

function relativeResourceTargets(filePath) {
  return [...readHtml(filePath).matchAll(/\b(?:href|src)=["']([^"']+)["']/giu)]
    .map((match) => match[1])
    .filter((target) => target && !target.startsWith('#') && !target.startsWith('/') && !/^(?:[a-z][a-z\d+.-]*:|\/\/|data:)/iu.test(target))
    .map((target) => target.split(/[?#]/u, 1)[0])
    .filter(Boolean)
    .map((target) => ({ target, resolved: path.resolve(path.dirname(filePath), target) }));
}

test('all active HTML pages are UTF-8 documents and never open Markdown directly', () => {
  const failures = activeHtmlPages().flatMap((filePath) => {
    const html = readHtml(filePath);
    const relativePath = path.relative(repoRoot, filePath);
    const problems = [];
    if (!/<meta\b[^>]*charset=["']?utf-8/iu.test(html.slice(0, 1024))) {
      problems.push(`${relativePath}: missing early UTF-8 charset`);
    }
    if (html.includes('\uFFFD')) problems.push(`${relativePath}: contains UTF-8 replacement characters`);
    for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+\.md(?:#[^"']*)?)["']/giu)) {
      problems.push(`${relativePath}: raw Markdown link ${match[1]}`);
    }
    return problems;
  });

  assert.deepEqual(failures, [], `invalid active HTML contract:\n${failures.join('\n')}`);
});

test('all active HTML pages have resolvable local links, scripts, styles, and images', () => {
  const missing = activeHtmlPages().flatMap((filePath) => (
    relativeResourceTargets(filePath)
      .filter(({ resolved }) => !fs.existsSync(resolved))
      .map(({ target }) => `${path.relative(repoRoot, filePath)} -> ${target}`)
  ));

  assert.deepEqual(missing, [], `missing active web target(s):\n${missing.join('\n')}`);
});

test('shared site resources exist', () => {
  for (const relativePath of ['site.css', 'site.js']) {
    assert.equal(
      fs.existsSync(path.join(siteRoot, relativePath)),
      true,
      `missing shared resource: ${path.relative(repoRoot, path.join(siteRoot, relativePath))}`
    );
  }
});

test('shared runtime builds one course-focused global navigation', () => {
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');
  const siteCss = fs.readFileSync(path.join(siteRoot, 'site.css'), 'utf8');

  assert.match(siteJs, /function\s+renderSiteNavigation\s*\(/u);
  assert.match(siteJs, /function\s+renderCourseNavigation\s*\(/u);
  for (const label of ['学习首页', '完整路线', '课程目录', '资料与实验', '总览地图', '实验依据', '专项笔记']) {
    assert.match(siteJs, new RegExp(label, 'u'), `shared navigation missing ${label}`);
  }
  assert.match(siteJs, /COURSE_STAGES/u);
  assert.match(siteJs, /COURSE_CURRENT_STAGE/u);
  assert.match(siteJs, /aria-current/u);
  assert.match(siteJs, /site-nav__stage/u);
  assert.match(siteJs, /site-nav__more/u);
  assert.match(siteCss, /\.site-nav__stage\b/u);
  assert.match(siteCss, /\.site-nav__more\b/u);
  assert.match(siteCss, /\.site-nav__links\b[^}]*overflow-x:\s*auto/isu);
});

test('every active page ships the shared navigation hook before JavaScript enhancement', () => {
  const failures = activeHtmlPages().flatMap((filePath) => {
    const html = readHtml(filePath);
    const navigation = html.match(/<nav\b[^>]*data-site-nav[\s\S]*?<\/nav>/iu)?.[0] ?? '';
    const problems = [];
    if (!navigation) problems.push(`${path.relative(repoRoot, filePath)}: missing data-site-nav`);
    if (!/site\.js\?v=[a-f0-9]{10}/u.test(html)) problems.push(`${path.relative(repoRoot, filePath)}: missing shared site.js`);
    return problems;
  });

  assert.deepEqual(failures, [], `incomplete navigation hook:\n${failures.join('\n')}`);
});

test('Task 3 pages expose shared assets and the complete site navigation', () => {
  const task3Pages = ['learning-route.html', 'system-map.html', 'phase0.html']
    .map((name) => path.join(siteRoot, 'pages', name));
  for (const filePath of task3Pages) {
    const html = readHtml(filePath);
    assert.match(html, /href=["']\.\.\/site\.css\?v=[a-f0-9]{10}["']/u);
    assert.match(html, /src=["']\.\.\/generated\/vault-data\.js\?v=[a-f0-9]{10}["']/u);
    assert.match(html, /src=["']\.\.\/site\.js\?v=[a-f0-9]{10}["']/u);
    assert.doesNotMatch(html, /type=["']module["']/iu);
    assert.match(html, /<script\b[^>]*\bdefer\b[^>]*\bsrc=["'][^"']+\.js(?:\?v=[a-f0-9]{10})?["']/iu);
    assert.match(html, /data-site-nav(?:\s|=|>)/iu);
    assert.match(html, /<nav\b[^>]*class=["'][^"']*\bsite-nav\b/iu);
  }
});

test('system map and phase0 pages expose the complete content navigation', () => {
  const pages = ['system-map.html', 'phase0.html']
    .map((name) => path.join(siteRoot, 'pages', name));
  const navigationTargets = [
    '../index.html',
    'notes/06-任务--01-下一步任务看板.html',
    'learning-route.html',
    'system-map.html',
    '../../../04-项目/10-Phase0-可视化总入口.html',
    'notes.html',
    'evidence.html',
    'project.html',
    'environment.html',
    'archive.html',
  ];

  for (const filePath of pages) {
    const html = readHtml(filePath);
    const nav = html.match(/<nav\b[^>]*data-site-nav[\s\S]*?<\/nav>/iu)?.[0] ?? '';
    assert.equal((html.match(/data-site-nav/giu) ?? []).length, 1, `${path.basename(filePath)} must have one site navigation`);
    for (const target of navigationTargets) {
      assert.ok(nav.includes(`href="${target}"`), `${path.basename(filePath)} missing navigation target: ${target}`);
    }
  }
});

test('Task 3 pages expose skip links, main targets, and visible focus styles', () => {
  const task3Pages = ['learning-route.html', 'system-map.html', 'phase0.html']
    .map((name) => path.join(siteRoot, 'pages', name));
  const css = fs.readFileSync(path.join(siteRoot, 'site.css'), 'utf8');

  for (const filePath of task3Pages) {
    const html = readHtml(filePath);
    assert.match(html, /<body\b[^>]*>\s*<a[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#main-content["'][^>]*>跳到主要内容<\/a>/u);
    assert.match(html, /<main[^>]*\bid=["']main-content["']/u);
  }

  assert.match(css, /\.skip-link\s*\{[^}]*position:\s*fixed/isu);
  assert.match(css, /\.skip-link:focus\s*\{[^}]*transform:/isu);
  assert.match(css, /\.skip-link:focus-visible\s*\{[^}]*transform:/isu);
  assert.match(css, /a:focus\s*\{[^}]*outline:/isu);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:/isu);
});

test('shared site JavaScript keeps cleaning regexes compatible with legacy browsers', () => {
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');

  assert.doesNotMatch(siteJs, /\/(?:[^/\\]|\\.)*\/[dgimsuvy]*u[dgimsuvy]*/);
});

test('learning route current marker is sourced from the shared course contract', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'learning-route.html'));
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');

  assert.match(html, /data-course-route/iu);
  assert.match(siteJs, /COURSE_CURRENT_STAGE\s*=\s*['"]04['"]/u);
  assert.match(siteJs, /querySelectorAll\(["']\[data-course-route\]["']\)/u);
  assert.match(siteJs, /courseStageStatus\s*\(/u);
  assert.match(siteJs, /is-current/u);
  assert.match(siteJs, /is-complete/u);
  assert.match(siteJs, /is-planned/u);
});

test('Task 4 pages expose the shared shell and page-specific content contracts', () => {
  const task4Pages = ['project.html', 'evidence.html', 'environment.html', 'notes.html', 'archive.html']
    .map((name) => path.join(siteRoot, 'pages', name));
  const sharedPatterns = [
    /href=["']\.\.\/site\.css\?v=[a-f0-9]{10}["']/u,
    /src=["']\.\.\/generated\/vault-data\.js\?v=[a-f0-9]{10}["']/u,
    /src=["']\.\.\/site\.js\?v=[a-f0-9]{10}["']/u,
    /<script\b[^>]*\bdefer\b[^>]*\bsrc=["'][^"']+\.js(?:\?v=[a-f0-9]{10})?["']/iu,
    /data-site-nav(?:\s|=|>)/iu,
    /<body>\s*<a[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#main-content["'][^>]*>/u,
    /<main[^>]*\bid=["']main-content["']/u
  ];

  for (const filePath of task4Pages) {
    const html = readHtml(filePath);
    for (const pattern of sharedPatterns) assert.match(html, pattern, `${path.basename(filePath)} missing shared contract`);
    assert.doesNotMatch(html, /type=["']module["']/iu);
    assert.match(html, /class=["'][^"']*\b(?:hero|grid|card|badge|button|flow)\b/iu);
  }

  const project = readHtml(task4Pages[0]);
  for (const textValue of ['RK3568 + IMX415 Camera 驱动学习', '10-Phase0-可视化总入口.html', '13-Phase0-Camera配置全流程.html', '14-Phase0-驱动层全链路框架图.html', '16-IMX415-三层驱动调用流程.html', '06-任务--Camera驱动第1章-IMX415-Sensor与驱动.html']) {
    assert.match(project, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'), `project missing ${textValue}`);
  }
  assert.doesNotMatch(project, /Python MVP|YOLOv8n/iu);

  const evidence = readHtml(task4Pages[1]);
  assert.match(evidence, /RK3568_VAULT_DATA\.evidence/iu);
  assert.match(evidence, /createElement\(["'](?:img|video)["']\)/u);
  assert.match(evidence, /controls/iu);
  assert.match(evidence, /missing|unknown|不可用/iu);
  for (const target of ['05-实验与证据--2026-07-28-Camera驱动Day1验收.html', '05-实验与证据--2026-07-28-直连板端读取IMX415配置.html']) assert.match(evidence, new RegExp(target.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.doesNotMatch(evidence, /05-实验与证据--(?:00-实验与证据入口|01-板子到手验机记录|02-每日进度记录)\.html/u);

  const environment = readHtml(task4Pages[2]);
  for (const textValue of ['当前开发环境已就绪', 'RK3568 Linux SDK', 'Source Insight', '08-附录--00-附录入口.html', '06-任务--Camera驱动求职第1周执行计划.html']) assert.match(environment, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.doesNotMatch(environment, /03-环境--/u);

  const notes = readHtml(task4Pages[3]);
  for (const textValue of ['Sensor', 'MIPI', 'RKISP', 'V4L2', 'Debug', '06-任务--Camera驱动第1章-IMX415-Sensor与驱动.html', '07-专项笔记--Camera-V4L2--V4L2命令行抓帧记录.html', '07-专项笔记--系统--Camera驱动分阶段验收标准.html', 'learning-route.html']) assert.match(notes, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.match(notes, /data-note-directory/u);
  assert.match(notes, /data-note-search/u);
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');
  assert.match(siteJs, /function\s+renderNoteDirectory\s*\(/u);
  assert.match(siteJs, /data\.notes/u);

  const archive = readHtml(task4Pages[4]);
  for (const textValue of ['唯一课程入口', '隐藏的归档候选', 'Excalidraw', '本轮不删除', 'AI', 'RKNN', 'RTMP/HLS', 'obsidian://open?vault=RK3568', 'index.html', 'learning-route.html']) assert.match(archive, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.doesNotMatch(archive, /notes\/99-归档--/u);
  assert.doesNotMatch(archive, /href=["'][^"']*(?:重构前|历史版|旧路线)[^"']*["'][^>]*>[^<]*旧路线[^<]*当前入口/iu);
});

test('evidence page implements a defensive evidence data contract', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'evidence.html'));
  assert.match(html, /Array\.isArray\([^)]*evidence\)/u);
  assert.match(html, /assetPath/iu);
  assert.match(html, /item\.sourcePath/iu, 'evidence cards must consume the generated source path');
  assert.match(html, /item\.(?:url|sourceUrl)/iu, 'evidence cards must prefer a generated Obsidian URL when available');
  assert.match(html, /obsidian:\/\/open/iu, 'evidence cards must expose an Obsidian URL fallback');
  assert.match(html, /mediaType|type/iu);
  assert.match(html, /missing|unknown|不可用/iu);
  assert.match(html, /try\s*\{/u);
  assert.match(html, /catch\s*\(/u);
});

test('evidence page groups assets by evidence stage and exposes empty and unknown states', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'evidence.html'));

  assert.match(html, /evidenceStageKey/iu, 'evidence groups must use the normalized stage key');
  assert.match(html, /stageLabel/iu, 'evidence groups must display the stage label');
  assert.match(html, /data-stage-group/iu, 'each evidence stage must have a group container');
  assert.match(html, /data-stage-count/iu, 'each evidence stage must display an asset count');
  assert.match(html, /需要补充阶段|补充阶段/iu, 'unknown-stage evidence must ask for a stage');
  assert.match(html, /暂无已登记证据|暂无.*证据|缺失.*证据/iu, 'empty evidence must show a missing notice');
  assert.match(html, /实验与证据|实验记录/iu, 'evidence page must keep an experiment-record entry');
  assert.match(html, /Obsidian/iu, 'evidence page must keep an Obsidian entry');
  assert.doesNotMatch(html, /fetch\s*\(/iu, 'evidence page must not depend on fetch');
  assert.doesNotMatch(html, /type=["']module["']/iu, 'evidence page must keep classic scripts');
});

test('evidence page exposes the shared current-learning-state contract and zero-count notices', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'evidence.html'));

  assert.match(html, /data-current-state(?:\s|=|>)/iu);
  assert.match(html, /data-current-stage(?:\s|=|>)/iu);
  assert.match(html, /data-current-task(?:\s|=|>)/iu);
  assert.match(html, /data-current-task-link(?:\s|=|>)/iu);
  assert.match(html, /data\.stages/iu, 'known stages must be rendered even without evidence');
  assert.match(html, /暂无证据，待补充/iu, 'known stages with zero evidence need a supplement notice');
  assert.match(html, /unknown|需要补充阶段/iu, 'unknown evidence must remain a separate group');
});

test('learning route presents the shared 00-11 Camera course', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'learning-route.html'));
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');
  assert.match(html, /00–11 主线/iu);
  assert.match(html, /data-course-route/iu);
  for (const stage of ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']) {
    assert.match(siteJs, new RegExp(`id:\\s*['"]${stage}['"]`, 'u'));
  }
  for (const topic of ['DTS', 'Sensor', 'D-PHY', 'Media Controller', 'RKISP', 'V4L2', 'OpenCV', 'RKNN', 'Bring-up']) {
    assert.match(siteJs, new RegExp(topic, 'iu'));
  }
});

test('generated note directory excludes deleted legacy roots and documents', () => {
  const notes = readHtml(path.join(siteRoot, 'pages', 'notes.html'));
  const data = fs.readFileSync(path.join(siteRoot, 'generated', 'vault-data.js'), 'utf8');

  for (const legacy of [
    '01-主线/',
    '02-资料/',
    '03-环境/',
    '04-项目/00-项目可视化入口.md',
    '04-项目/01-RK3568 YOLOv8n AI Camera项目.md',
    '04-项目/02-AI Camera项目讲解稿.md',
    '04-项目/03-Python MVP演示手册.md',
    '05-实验与证据/00-实验与证据入口.md',
    '05-实验与证据/01-板子到手验机记录.md',
    '05-实验与证据/02-每日进度记录.md',
  ]) {
    assert.doesNotMatch(notes, new RegExp(legacy, 'u'));
    assert.doesNotMatch(data, new RegExp(legacy, 'u'));
  }
});

test('system map presents the Camera driver control and data chains', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'system-map.html'));
  const modules = ['DTS / I2C4', 'I2C Core', 'imx415_probe', 'IMX415 Sensor', 'MIPI D-PHY', 'CSI-2 Receiver', 'RKISP', 'Media / V4L2', '/dev/video0'];
  for (const module of modules) assert.match(html, new RegExp(module, 'iu'));
  assert.match(html, /DTS[\s\S]*I2C Core[\s\S]*imx415_probe\(\)[\s\S]*IMX415 Sensor[\s\S]*MIPI D-PHY[\s\S]*CSI-2 Receiver[\s\S]*RKISP[\s\S]*Media \/ V4L2[\s\S]*\/dev\/video0/iu);
  for (const target of [
    '../../../04-项目/14-Phase0-驱动层全链路框架图.html',
    '../../../04-项目/16-IMX415-三层驱动调用流程.html',
    'notes/07-专项笔记--Camera-V4L2--IMX415驱动调试与最小demo路线.html',
    'notes/07-专项笔记--Camera-V4L2--V4L2命令行抓帧记录.html',
    'notes/09-输出沉淀--04-V4L2专题-什么是dev-video0.html'
  ]) assert.ok(html.includes(`href="${target}"`), `missing system link: ${target}`);
});

test('phase0 page sequences the five existing visualizations with learning focus and navigation concepts', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'phase0.html'));
  const pages = [
    '10-Phase0-可视化总入口.html',
    '12-Phase0-数据流动画.html',
    '13-Phase0-Camera配置全流程.html',
    '14-Phase0-驱动层全链路框架图.html',
    '15-Phase0-RK3568全系统框架图.html'
  ];
  let previousIndex = -1;
  for (const page of pages) {
    const index = html.indexOf(page);
    assert.ok(index > previousIndex, `${page} is out of sequence`);
    previousIndex = index;
  }
  assert.match(html, /学习重点/gu);
  assert.match(html, /打开页面/gu);
  assert.match(html, /上一页/gu);
  assert.match(html, /下一页/gu);
});

test('Task5 pages keep narrow-screen content clear of duplicated navigation', () => {
  const dataFlowHtml = readHtml(phase0Pages[1]);
  const cameraConfigHtml = readHtml(phase0Pages[2]);
  const mobileStyles = dataFlowHtml.match(/@media\s*\(max-width:\s*900px\)[\s\S]*?<\/style>/iu)?.[0] ?? '';

  assert.match(dataFlowHtml, /\.topbar\s*\{[^}]*position:\s*fixed/isu, 'desktop topbar must remain fixed');
  assert.match(mobileStyles, /\.topbar\s*\{[^}]*position:\s*(?:static|absolute)/isu, 'mobile topbar must participate in the page layout');
  assert.doesNotMatch(mobileStyles, /\.main\s*\{[^}]*padding-top:\s*220px/isu, 'mobile layout must not use a fixed 220px topbar compensation');
  assert.doesNotMatch(mobileStyles, /\.topbar\s*\{[^}]*position:\s*fixed[\s\S]*?\}[^}]*\.main\s*\{[^}]*padding-top:\s*\d+px/isu, 'mobile rules must not pair a fixed topbar with a fixed main offset');
  assert.doesNotMatch(cameraConfigHtml, /<div\s+class=["']bottom-links["'][\s\S]*?<\/div>/iu);
  assert.match(cameraConfigHtml, /<div\s+class=["']footer["'][^>]*>[\s\S]*?\S[\s\S]*?<\/div>/iu);
});

test('Task5 framework diagram shrinks detail cards on narrow screens', () => {
  const html = readHtml(phase0Pages[4]);
  const narrowStyles = html.match(/@media\s*\(max-width:\s*600px\)[\s\S]*?<\/style>/iu)?.[0] ?? '';

  assert.match(html, /<h2\b[^>]*class=["'][^"']*\bsection-title\b/iu, 'framework diagram section titles must use semantic h2 headings');
  assert.match(narrowStyles, /\.detail-grid\s*\{[^}]*grid-template-columns:\s*(?:repeat\(auto-fit,\s*)?minmax\(0,\s*1fr\)/isu);
  assert.match(narrowStyles, /\.detail-grid\s*>\s*\*\s*\{[^}]*min-width:\s*0/isu);
});

test('Task5 framework diagram wraps narrow-screen code and key-value content', () => {
  const html = readHtml(phase0Pages[4]);
  const narrowStyles = html.match(/@media\s*\(max-width:\s*600px\)[\s\S]*?<\/style>/iu)?.[0] ?? '';

  assert.match(narrowStyles, /\.code-block\s*\{[^}]*max-width:\s*100%/isu);
  assert.match(narrowStyles, /\.code-block\s*\{[^}]*white-space:\s*pre-wrap/isu);
  assert.match(narrowStyles, /\.code-block\s*\{[^}]*overflow-wrap:\s*anywhere/isu);
  assert.match(narrowStyles, /\.code-block\s+\.cmt\s*,\s*\.code-block\s+\.str\s*\{[^}]*overflow-wrap:\s*anywhere/isu);
  assert.match(narrowStyles, /table\.kv\s*\{[^}]*table-layout:\s*fixed/isu);
  assert.match(narrowStyles, /table\.kv\s+td\s*\{[^}]*overflow-wrap:\s*anywhere/isu);
  assert.match(narrowStyles, /table\.kv\s+td\.k\s*\{[^}]*white-space:\s*normal/isu);
});

test('Task5 data-flow nodes expose the keyboard interaction contract', () => {
  const html = readHtml(phase0Pages[1]);

  assert.match(html, /div\.setAttribute\(['"]tabindex['"],\s*['"]0['"]\)/u);
  assert.match(html, /div\.setAttribute\(['"]role['"],\s*['"]button['"]\)/u);
  assert.match(html, /div\.setAttribute\(['"]aria-label['"],\s*n\.label\.replace\(\/\\n\/g,\s*['"]\s*['"]\)/u);
  assert.match(html, /div\.addEventListener\(['"]click['"],\s*\(\)\s*=>\s*jumpToStep\(i\)\)/u);
  assert.match(html, /div\.addEventListener\(['"]keydown['"],[\s\S]*?event\.key\s*===\s*['"]Enter['"][\s\S]*?event\.key\s*===\s*['"]\s['"][\s\S]*?event\.preventDefault\(\)[\s\S]*?jumpToStep\(i\)/u);
  assert.match(html, /\.node:focus-visible\s*\{[^}]*outline:/isu);
});

test('shared resources satisfy the site contract', () => {
  const css = fs.readFileSync(path.join(siteRoot, 'site.css'), 'utf8');
  const js = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');

  assert.match(css, /--bg:\s*#080c14\b/iu);
  assert.match(css, /\.site-nav\b/iu);
  assert.match(css, /\.site-nav\s*\{[^}]*position:\s*fixed/isu);
  assert.match(js, /window\.RK3568_VAULT_DATA/iu);
  assert.match(js, /window\.RK3568_COURSE/iu);
  assert.match(js, /COURSE_CURRENT_STAGE/iu);
  assert.match(js, /data\.currentTasks/iu);
  assert.match(js, /data\.evidence/iu);
  assert.doesNotMatch(js, /(?:^|\n)\s*(?:import|export)\b/iu);
});

test('all expected multipage site targets exist', () => {
  const missing = expectedPages()
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(repoRoot, filePath));

  assert.deepEqual(missing, [], `missing expected page(s):\n${missing.join('\n')}`);
});

test('target pages use classic scripts', () => {
  const moduleScripts = existingPages()
    .filter((filePath) => /<script\b[^>]*\btype=["']module["']/iu.test(readHtml(filePath)))
    .map((filePath) => path.relative(repoRoot, filePath));

  assert.deepEqual(moduleScripts, [], `module scripts are not supported for file:// pages:\n${moduleScripts.join('\n')}`);
});

test('existing target pages reference shared assets and navigation', () => {
  const missingContracts = existingPages().flatMap((filePath) => {
    const html = readHtml(filePath);
    const relativePath = path.relative(repoRoot, filePath);
    const missing = [];
    if (!/<link\b[^>]*\bhref=["'][^"']*site\.css(?:["'#?])/iu.test(html)) missing.push(`${relativePath}: site.css reference`);
    if (!/<script\b[^>]*\bsrc=["'][^"']*site\.js(?:["'#?])/iu.test(html)) missing.push(`${relativePath}: site.js reference`);
    if (!/data-site-nav(?:\s|=|>)/iu.test(html)) missing.push(`${relativePath}: data-site-nav marker`);
    return missing;
  });

  assert.deepEqual(missingContracts, [], `missing shared HTML contract:\n${missingContracts.join('\n')}`);
});

test('existing target pages have resolvable relative href targets', () => {
  const missingTargets = existingPages().flatMap((filePath) => relativeHrefTargets(filePath)
    .filter(({ target }) => !fs.existsSync(target))
    .map(({ href }) => `${path.relative(repoRoot, filePath)} -> ${href}`));

  assert.deepEqual(missingTargets, [], `missing relative href target(s):\n${missingTargets.join('\n')}`);
});

test('target pages expose the shared navigation marker', () => {
  const missingNavigation = existingPages()
    .filter((filePath) => !/<nav\b[^>]*class=["'][^"']*\bsite-nav\b/iu.test(readHtml(filePath)))
    .map((filePath) => path.relative(repoRoot, filePath));

  assert.deepEqual(missingNavigation, [], `missing shared .site-nav marker:\n${missingNavigation.join('\n')}`);
});

test('Phase0 visualization pages expose the shared shell and fixed learning sequence', () => {
  const expectedNext = [
    './12-Phase0-数据流动画.html',
    './13-Phase0-Camera配置全流程.html',
    './14-Phase0-驱动层全链路框架图.html',
    './15-Phase0-RK3568全系统框架图.html',
    null
  ];
  const expectedPrevious = [
    null,
    './10-Phase0-可视化总入口.html',
    './12-Phase0-数据流动画.html',
    './13-Phase0-Camera配置全流程.html',
    './14-Phase0-驱动层全链路框架图.html'
  ];
  const sharedAssets = [
    '../00-首页/学习驾驶舱/site.css',
    '../00-首页/学习驾驶舱/generated/vault-data.js',
    '../00-首页/学习驾驶舱/site.js'
  ];
  const navigationTargets = [
    '../00-首页/学习驾驶舱/index.html',
    '10-Phase0-可视化总入口.html',
    '../00-首页/学习驾驶舱/pages/notes/06-任务--01-下一步任务看板.html',
  ];

  phase0Pages.forEach((filePath, index) => {
    const html = readHtml(filePath);
    assert.match(html, /<link\b[^>]*href=["']\.\.\/00-首页\/学习驾驶舱\/site\.css\?v=[a-f0-9]{10}["']/u);
    assert.match(html, /<script\b[^>]*defer[^>]*src=["']\.\.\/00-首页\/学习驾驶舱\/generated\/vault-data\.js\?v=[a-f0-9]{10}["']/u);
    assert.match(html, /<script\b[^>]*defer[^>]*src=["']\.\.\/00-首页\/学习驾驶舱\/site\.js\?v=[a-f0-9]{10}["']/u);
    assert.match(html, /data-site-nav(?:\s|=|>)/u);
    assert.match(html, /<body\b[^>]*>\s*<a[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#main-content["']/u);
    assert.match(html, /<main[^>]*\bid=["']main-content["']/u);
    for (const target of navigationTargets) assert.ok(html.includes(`href="${target}"`), `${path.basename(filePath)} missing navigation target: ${target}`);
    assert.match(html, /在\s*Obsidian\s*中打开/u, `${path.basename(filePath)} missing clear Obsidian entry text`);
    if (index === phase0Pages.length - 1) assert.doesNotMatch(html, /下一页[^<]*任务看板/u, `${path.basename(filePath)} must not label the task board as the next page`);
    if (expectedPrevious[index]) assert.ok(html.includes(`href="${expectedPrevious[index]}"`), `${path.basename(filePath)} missing previous page`);
    if (expectedNext[index]) assert.ok(html.includes(`href="${expectedNext[index]}"`), `${path.basename(filePath)} missing next page`);
    for (const asset of sharedAssets) assert.ok(fs.existsSync(path.resolve(path.dirname(filePath), asset)), `${path.basename(filePath)} missing target: ${asset}`);
    for (const { href, target } of relativeHrefTargets(filePath)) assert.ok(fs.existsSync(target), `${path.basename(filePath)} -> ${href}`);
  });
});

test('homepage exposes the Camera course cockpit contract', () => {
  const homepagePath = path.join(siteRoot, 'index.html');
  const html = readHtml(homepagePath);

  assert.match(html, /Camera 驱动[\s\S]*学习驾驶舱/iu);
  assert.match(html, /现在学什么/iu);
  assert.match(html, /data-course-current/iu);
  assert.match(html, /data-course-objective/iu);
  assert.match(html, /data-course-next/iu);
  assert.match(html, /data-course-route/iu);
  assert.match(html, /完整学习路线/iu);
  assert.match(html, /pages\/learning-route\.html/iu);
  assert.match(html, /pages\/phase0\.html/iu);
  assert.match(html, /需要时再查/iu);
  for (const page of ['evidence', 'environment', 'notes', 'archive']) {
    assert.match(html, new RegExp(`pages/${page}\\.html`, 'iu'));
  }
  assert.match(html, /href=["'][^"']*\.\/styles\.css\?v=[a-f0-9]{10}["']/iu);
  assert.match(html, /href=["'][^"']*\.\/site\.css\?v=[a-f0-9]{10}["']/iu);
  assert.match(html, /src=["'][^"']*\.\/generated\/vault-data\.js\?v=[a-f0-9]{10}["']/iu);
  assert.match(html, /src=["'][^"']*\.\/app\.js\?v=[a-f0-9]{10}["']/iu);
  assert.doesNotMatch(html, /id=["'](?:stage-map|pipeline-flow|domain-grid|evidence-grid|quick-link-grid)["']/iu);
  assert.match(html, /正文仍可回到 Obsidian 编辑/iu);
});

test('course shell exposes the shared current-learning-state contract', () => {
  const homepage = readHtml(path.join(siteRoot, 'index.html'));
  const route = readHtml(path.join(siteRoot, 'pages', 'learning-route.html'));
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(siteRoot, 'app.js'), 'utf8');
  assert.match(homepage, /data-course-current/iu);
  assert.match(homepage, /data-course-objective/iu);
  assert.match(homepage, /data-course-next/iu);
  assert.match(route, /data-course-route/iu);
  assert.match(siteJs, /querySelectorAll\(['"]\[data-course-current\]['"]\)/u);
  assert.match(siteJs, /querySelectorAll\(['"]\[data-course-objective\]['"]\)/u);
  assert.match(siteJs, /querySelectorAll\(['"]\[data-course-next\]['"]\)/u);
  assert.match(siteJs, /for\s*\(\s*(?:var\s+)?i\s*=\s*0/u);
  assert.doesNotMatch(siteJs, /\.find\s*\(/u);
  assert.doesNotMatch(siteJs, /\.forEach\s*\(/u);
  assert.doesNotMatch(appJs, /data-course-(?:current|objective|next)/u);
});

test('dashboard starts from course stage 04', () => {
  const homepage = readHtml(path.join(siteRoot, 'index.html'));
  const route = readHtml(path.join(siteRoot, 'pages', 'learning-route.html'));

  assert.match(homepage, /data-course-next/iu);
  assert.match(route, /data-course-route/iu);
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');
  assert.match(siteJs, /COURSE_CURRENT_STAGE\s*=\s*['"]04['"]/u);
  assert.match(siteJs, /currentCourseStage\s*\(/u);
  assert.match(siteJs, /data-course-next/u);
});

test('shared site shell supports reduced motion and non-overlapping narrow navigation', () => {
  const siteCss = fs.readFileSync(path.join(siteRoot, 'site.css'), 'utf8');

  assert.match(siteCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/u);
  assert.match(siteCss, /scroll-behavior:\s*auto/u);
  assert.match(siteCss, /animation:\s*none\s*!important/u);
  assert.match(siteCss, /transition:\s*none\s*!important/u);
  assert.match(siteCss, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.site-nav\s*\{[\s\S]*?position:\s*relative/u);
  assert.match(siteCss, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.page-shell\s*\{[\s\S]*?--site-nav-space:\s*0/u);
  assert.match(siteCss, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.site-nav__links\s*\{[\s\S]*?flex-wrap:\s*wrap[\s\S]*?overflow-x:\s*visible/u);
  assert.match(siteCss, /\.card\s+img,\s*\.card\s+video\s*\{[^}]*max-width:\s*100%/u);
});

test('learning route delegates all stage cards to the shared course renderer', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'learning-route.html'));
  const siteJs = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');
  assert.equal((html.match(/data-course-route/giu) || []).length, 1);
  assert.match(siteJs, /COURSE_STAGES\.length/u);
  assert.match(siteJs, /course-route__card/u);
  assert.match(siteJs, /进入本阶段/u);
});

test('important Markdown notes are presented as generated HTML pages', () => {
  const notesPage = readHtml(path.join(siteRoot, 'pages', 'notes.html'));
  const openCvPage = path.join(siteRoot, 'pages', 'notes', '07-专项笔记--OpenCV--OpenCV读取Camera记录.html');
  assert.equal(fs.existsSync(openCvPage), true, 'OpenCV note HTML page is missing');
  assert.match(notesPage, /notes\/07-[^"']+\.html/iu);
  assert.doesNotMatch(notesPage, /href=["'][^"']*专项笔记[^"']+\.md["']/iu);

  const html = readHtml(openCvPage);
  assert.match(html, /<article[^>]*class=["'][^"']*note-content/iu);
  assert.match(html, /OpenCV读取Camera记录/iu);
  assert.equal((html.match(/<h1\b/giu) || []).length, 1, 'generated note pages should have one page title');
  assert.match(html, /在 Obsidian 中打开/iu);
  assert.doesNotMatch(html, /查看原始 Markdown/iu);
  for (const target of relativeHrefTargets(openCvPage)) {
    assert.equal(fs.existsSync(target.target), true, `${path.basename(openCvPage)} -> ${target.href}`);
  }
});

test('active web pages do not open content Markdown files directly', () => {
  const allowedMarkdown = [];
  const violations = existingPages().flatMap((filePath) => {
    const html = readHtml(filePath);
    return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+\.md(?:#[^"']*)?)["']/giu)]
      .map((match) => match[1].split('#', 1)[0])
      .filter((href) => !allowedMarkdown.some((allowed) => href.endsWith(allowed)))
      .map((href) => `${path.relative(repoRoot, filePath)} -> ${href}`);
  });
  assert.deepEqual(violations, [], `content links still open Markdown directly:\n${violations.join('\n')}`);
});
