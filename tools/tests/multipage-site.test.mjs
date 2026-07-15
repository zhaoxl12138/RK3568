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

function relativeHrefTargets(filePath) {
  return [...readHtml(filePath).matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/giu)]
    .map((match) => match[1])
    .filter((href) => href && !href.startsWith('#') && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(href))
    .map((href) => href.split(/[?#]/u, 1)[0])
    .filter(Boolean)
    .map((href) => ({ href, target: path.resolve(path.dirname(filePath), href) }));
}

test('shared site resources exist', () => {
  for (const relativePath of ['site.css', 'site.js']) {
    assert.equal(
      fs.existsSync(path.join(siteRoot, relativePath)),
      true,
      `missing shared resource: ${path.relative(repoRoot, path.join(siteRoot, relativePath))}`
    );
  }
});

test('Task 3 pages expose shared assets and the complete site navigation', () => {
  const task3Pages = ['learning-route.html', 'system-map.html', 'phase0.html']
    .map((name) => path.join(siteRoot, 'pages', name));
  const labels = ['驾驶舱首页', '学习路线', '系统地图', 'Phase0 可视化', '任务看板'];

  for (const filePath of task3Pages) {
    const html = readHtml(filePath);
    assert.match(html, /href=["']\.\.\/site\.css["']/u);
    assert.match(html, /src=["']\.\.\/generated\/vault-data\.js["']/u);
    assert.match(html, /src=["']\.\.\/site\.js["']/u);
    assert.doesNotMatch(html, /type=["']module["']/iu);
    assert.match(html, /<script\b[^>]*\bdefer\b[^>]*\bsrc=["'][^"']+\.js["']/iu);
    assert.match(html, /data-site-nav(?:\s|=|>)/iu);
    assert.match(html, /<nav\b[^>]*class=["'][^"']*\bsite-nav\b/iu);
    for (const label of labels) assert.match(html, new RegExp(label, 'u'));
  }
});

test('Task 3 pages expose skip links, main targets, and visible focus styles', () => {
  const task3Pages = ['learning-route.html', 'system-map.html', 'phase0.html']
    .map((name) => path.join(siteRoot, 'pages', name));
  const css = fs.readFileSync(path.join(siteRoot, 'site.css'), 'utf8');

  for (const filePath of task3Pages) {
    const html = readHtml(filePath);
    assert.match(html, /<body>\s*<a[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#main-content["'][^>]*>跳到主要内容<\/a>/u);
    assert.match(html, /<main[^>]*\bid=["']main-content["']/u);
  }

  assert.match(css, /\.skip-link\s*\{[^}]*position:\s*fixed/isu);
  assert.match(css, /\.skip-link:focus-visible\s*\{[^}]*transform:/isu);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:/isu);
});

test('Task 4 pages expose the shared shell and page-specific content contracts', () => {
  const task4Pages = ['project.html', 'evidence.html', 'environment.html', 'notes.html', 'archive.html']
    .map((name) => path.join(siteRoot, 'pages', name));
  const sharedPatterns = [
    /href=["']\.\.\/site\.css["']/u,
    /src=["']\.\.\/generated\/vault-data\.js["']/u,
    /src=["']\.\.\/site\.js["']/u,
    /<script\b[^>]*\bdefer\b[^>]*\bsrc=["'][^"']+\.js["']/iu,
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
  for (const textValue of ['RK3568 + Buildroot 4.19 + YOLOv5 RKNN Python MVP', '01-RK3568 YOLOv8n AI Camera项目.md', '02-AI Camera项目讲解稿.md', '03-Python MVP演示手册.md', '06-AI-Camera项目五分钟讲解.md', '10-Phase0-可视化总入口.html']) {
    assert.match(project, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'), `project missing ${textValue}`);
  }

  const evidence = readHtml(task4Pages[1]);
  assert.match(evidence, /RK3568_VAULT_DATA\.evidence/iu);
  assert.match(evidence, /createElement\(["'](?:img|video)["']\)/u);
  assert.match(evidence, /controls/iu);
  assert.match(evidence, /missing|unknown|不可用/iu);
  for (const target of ['00-实验与证据入口.md', '01-实验产物索引.md', '02-每日进度记录.md']) assert.match(evidence, new RegExp(target.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));

  const environment = readHtml(task4Pages[2]);
  for (const textValue of ['板端 Buildroot', 'Ubuntu / SDK', 'WSL2 / VSCode', '00-环境入口.md', '01-Ubuntu与SDK编译注意事项.md', '02-WSL2和VSCode使用说明.md', '03-WSL2开发环境现状.md', '00-附录入口.md']) assert.match(environment, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));

  const notes = readHtml(task4Pages[3]);
  for (const textValue of ['Camera', 'OpenCV', 'RKNN', 'Display', 'Streaming', 'System', 'IMX415驱动调试与最小demo路线.md', 'AI Camera系统数据流与模块边界.md', 'system-map.html']) assert.match(notes, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));

  const archive = readHtml(task4Pages[4]);
  for (const textValue of ['网页当前入口', 'Obsidian 状态源', '00-重构归档说明.md', '00-归档说明.md', 'index.html', '01-下一步任务看板.md']) assert.match(archive, new RegExp(textValue.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.doesNotMatch(archive, /href=["'][^"']*(?:重构前|历史版|旧路线)[^"']*["'][^>]*>[^<]*旧路线[^<]*当前入口/iu);
});

test('evidence page implements a defensive evidence data contract', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'evidence.html'));
  assert.match(html, /Array\.isArray\([^)]*evidence\)/u);
  assert.match(html, /assetPath/iu);
  assert.match(html, /mediaType|type/iu);
  assert.match(html, /missing|unknown|不可用/iu);
  assert.match(html, /try\s*\{/u);
  assert.match(html, /catch\s*\(/u);
});

test('learning route presents Phase 0 through Phase 10 and the current Phase 1 entry', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'learning-route.html'));
  for (let stage = 0; stage <= 10; stage += 1) {
    assert.match(html, new RegExp(`data-stage=["']${stage}["']`, 'u'));
  }
  assert.match(html, /阶段 1[\s\S]*Buildroot 板端验机[\s\S]*当前/iu);
  assert.match(html, /阶段 1[\s\S]*(?:要回答的问题|通过标准|入口)/iu);
  for (const target of [
    '../../../01-主线/02-从零到Python MVP学习路线.md',
    '../../../06-任务/01-下一步任务看板.md',
    '../../../05-实验与证据/01-板子到手验机记录.md',
    '../../../07-专项笔记/系统/AI Camera系统数据流与模块边界.md'
  ]) assert.ok(html.includes(`href="${target}"`), `missing route link: ${target}`);
});

test('system map presents the Camera to Display and Streaming chain with module references', () => {
  const html = readHtml(path.join(siteRoot, 'pages', 'system-map.html'));
  const modules = ['Camera', 'V4L2', 'GStreamer', 'OpenCV', 'RKNN', 'Display', 'Streaming'];
  for (const module of modules) assert.match(html, new RegExp(module, 'iu'));
  assert.match(html, /Camera[\s\S]*V4L2[\s\S]*GStreamer[\s\S]*OpenCV[\s\S]*RKNN[\s\S]*Display[\s\S]*Streaming/iu);
  assert.match(html, /07-专项笔记\/系统\/AI Camera系统数据流与模块边界\.md/u);
  assert.match(html, /04-项目\/15-Phase0-RK3568全系统框架图\.html/u);
  for (const target of [
    '../../../07-专项笔记/Camera-V4L2/IMX415驱动调试与最小demo路线.md',
    '../../../07-专项笔记/Camera-V4L2/V4L2命令行抓帧记录.md',
    '../../../07-专项笔记/OpenCV/OpenCV读取Camera记录.md',
    '../../../07-专项笔记/AI-RKNN/官方AI例程运行记录.md',
    '../../../07-专项笔记/Display-MIPI/MIPI屏显示链路.md',
    '../../../07-专项笔记/Streaming/RTMP-HLS推流记录.md'
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

test('shared resources satisfy the site contract', () => {
  const css = fs.readFileSync(path.join(siteRoot, 'site.css'), 'utf8');
  const js = fs.readFileSync(path.join(siteRoot, 'site.js'), 'utf8');

  assert.match(css, /--bg:\s*#080c14\b/iu);
  assert.match(css, /\.site-nav\b/iu);
  assert.match(css, /\.site-nav\s*\{[^}]*position:\s*fixed/isu);
  assert.match(js, /window\.RK3568_VAULT_DATA/iu);
  assert.match(js, /data\.currentStage/iu);
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

test('homepage exposes the Phase0 learning entrance contract', () => {
  const homepagePath = path.join(siteRoot, 'index.html');
  const html = readHtml(homepagePath);

  assert.match(html, /RK3568\s+Phase0\s+可视化总入口/iu);
  assert.match(html, /现在从这里开始/iu);
  assert.match(html, /data-current-stage/iu);
  assert.match(html, /data-current-task/iu);
  assert.match(html, /href=["'][^"']*06-任务[^"']*01-下一步任务看板\.md["']/iu);
  assert.match(html, /推荐学习路径/iu);
  assert.match(html, /pages\/learning-route\.html/iu);
  assert.match(html, /pages\/system-map\.html/iu);
  assert.match(html, /pages\/phase0\.html/iu);
  assert.match(html, /pages\/project\.html/iu);
  assert.match(html, /重要内容/iu);
  for (const page of ['evidence', 'environment', 'notes', 'archive']) {
    assert.match(html, new RegExp(`pages/${page}\\.html`, 'iu'));
  }
  assert.match(html, /href=["'][^"']*\.\/styles\.css["']/iu);
  assert.match(html, /href=["'][^"']*\.\/site\.css["']/iu);
  assert.match(html, /src=["'][^"']*\.\/generated\/vault-data\.js["']/iu);
  assert.match(html, /src=["'][^"']*\.\/app\.js["']/iu);
  assert.doesNotMatch(html, /id=["'](?:stage-map|pipeline-flow|domain-grid|evidence-grid|quick-link-grid)["']/iu);
  assert.match(html, /网页只读[\s\S]*回 Obsidian/iu);
});
