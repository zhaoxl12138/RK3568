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
  return expectedPages().filter((filePath) => fs.existsSync(filePath));
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
