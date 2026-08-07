import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const vaultRoot = path.resolve(import.meta.dirname, '../..');
const dashboardDir = path.join(vaultRoot, '00-首页', '学习驾驶舱');
const indexPath = path.join(dashboardDir, 'index.html');
const appPath = path.join(dashboardDir, 'app.js');
const stylesPath = path.join(dashboardDir, 'styles.css');
const generatedPath = path.join(dashboardDir, 'generated', 'vault-data.js');

async function dashboardSources() {
  const [html, app, generated, styles] = await Promise.all([
    readFile(indexPath, 'utf8'),
    readFile(appPath, 'utf8'),
    readFile(generatedPath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ]);
  return { app, generated, html, styles };
}

function scriptTags(html) {
  return [...html.matchAll(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gu)]
    .map((match) => ({ attributes: `${match[1]} ${match[3]}`, src: match[2] }));
}

function parseGeneratedAssignment(source) {
  const prefix = 'window.RK3568_VAULT_DATA = ';
  const normalizedSource = source.replace(/\r\n/g, '\n');
  assert.ok(source.startsWith(prefix), 'generated data must use the expected global assignment');
  assert.ok(normalizedSource.endsWith(';\n'), 'generated assignment must end with a semicolon');
  return JSON.parse(normalizedSource.slice(prefix.length, -2));
}

test('homepage loads classic deferred data and site scripts for file://', async () => {
  const { html } = await dashboardSources();
  const scripts = scriptTags(html);
  assert.deepEqual(scripts.map(({ src }) => src.split('?', 1)[0]), [
    './generated/vault-data.js', './site.js', './app.js',
  ]);
  assert.ok(scripts.every(({ src }) => /\?v=[a-f0-9]{10}$/u.test(src)));
  assert.ok(scripts.every(({ attributes }) => /\bdefer\b/u.test(attributes)));
  assert.ok(scripts.every(({ attributes }) => !/\btype\s*=\s*["']module["']/iu.test(attributes)));
  assert.doesNotMatch(html, /<script[^>]+type=["']module["']/iu);
});

test('homepage local shell assets resolve without requiring future pages', async () => {
  const { html } = await dashboardSources();
  const existingTargets = [
    './styles.css', './site.css', './generated/vault-data.js', './site.js', './app.js',
    'pages/learning-route.html', '../../04-项目/17-DPHY-从DTS到MediaGraph.html',
  ];
  await Promise.all(existingTargets.map((target) => access(path.resolve(dashboardDir, target))));
  for (const target of existingTargets) {
    const version = /\.(?:css|js)$/u.test(target) ? '(?:\\?v=[a-f0-9]{10})?' : '';
    assert.match(html, new RegExp(`(?:src|href)=["']${target.replaceAll('.', '\\.').replaceAll('/', '\\/')}${version}["']`, 'u'));
  }
});

test('app is classic-script syntax and avoids file protocol incompatible loading', async () => {
  const { app, html } = await dashboardSources();
  assert.doesNotThrow(() => new vm.Script(app, { filename: appPath }));
  assert.doesNotMatch(app, /(^|\n)\s*(?:import|export)\b|\bimport\s*\(|\bfetch\s*\(/u);
  assert.doesNotMatch(html, /<script[^>]+type=["']module["']/iu);
});

test('generated data syntax and course cockpit contracts are present', async () => {
  const { generated, html } = await dashboardSources();
  const data = parseGeneratedAssignment(generated);
  assert.equal(typeof data.currentStage, 'string');
  assert.ok(Array.isArray(data.currentTasks));
  assert.match(html, /Camera 驱动[\s\S]*学习驾驶舱/iu);
  assert.match(html, /现在学什么/iu);
  assert.match(html, /data-course-current/iu);
  assert.match(html, /data-course-objective/iu);
  assert.match(html, /data-course-next/iu);
  assert.match(html, /data-course-route/iu);
  assert.match(html, /完整学习路线/iu);
  assert.match(html, /需要时再查/iu);
  for (const page of ['learning-route', 'phase0', 'evidence', 'environment', 'notes', 'archive']) {
    assert.match(html, new RegExp(`pages/${page}\\.html`, 'iu'));
  }
});

test('homepage exposes keyboard navigation contracts', async () => {
  const { html, styles } = await dashboardSources();
  assert.match(html, /class=["'][^"']*skip-link[^"']*["']/iu);
  assert.match(html, /href=["']#main-content["']/iu);
  assert.match(html, /<main[^>]+id=["']main-content["']/iu);
  assert.match(styles, /:focus-visible\s*\{/iu);
});

test('homepage footer links back to the Obsidian main entry', async () => {
  const { html } = await dashboardSources();
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/iu)?.[0] ?? '';
  assert.match(footer, /href=["']index\.html["']/iu);
  assert.match(footer, /返回学习驾驶舱首页/iu);
});
