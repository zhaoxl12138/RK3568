import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const vaultRoot = path.resolve(import.meta.dirname, '../..');
const dashboardDir = path.join(vaultRoot, '00-首页', '学习驾驶舱');
const indexPath = path.join(dashboardDir, 'index.html');
const appPath = path.join(dashboardDir, 'app.js');
const generatedPath = path.join(dashboardDir, 'generated', 'vault-data.js');

async function dashboardSources() {
  const [html, app, generated] = await Promise.all([
    readFile(indexPath, 'utf8'),
    readFile(appPath, 'utf8'),
    readFile(generatedPath, 'utf8'),
  ]);
  return { app, generated, html };
}

function scriptTags(html) {
  return [...html.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/gu)]
    .map((match) => ({ attributes: `${match[1]} ${match[3]}`, src: match[2] }));
}

function parseGeneratedAssignment(source) {
  const prefix = 'window.RK3568_VAULT_DATA = ';
  assert.ok(source.startsWith(prefix), 'generated data must use the expected global assignment');
  assert.ok(source.endsWith(';\n'), 'generated assignment must end with a semicolon');
  return JSON.parse(source.slice(prefix.length, -2));
}

test('double-click launch loads classic deferred data before classic deferred app', async () => {
  const { html } = await dashboardSources();
  const scripts = scriptTags(html);
  assert.deepEqual(scripts.map(({ src }) => src), ['./generated/vault-data.js', './app.js']);
  assert.ok(scripts.every(({ attributes }) => /\bdefer\b/u.test(attributes)));
  assert.doesNotMatch(scripts[1].attributes, /\btype\s*=\s*["']module["']/u);
});

test('all local index src and href targets exist', async () => {
  const { html } = await dashboardSources();
  const targets = [...html.matchAll(/\b(?:src|href)="([^"]+)"/gu)]
    .map((match) => match[1])
    .filter((target) => target && !target.startsWith('#') && !/^[a-z][a-z\d+.-]*:/iu.test(target));
  assert.ok(targets.length > 0);
  await Promise.all(targets.map((target) => access(path.resolve(dashboardDir, target))));
});

test('app is classic-script syntax and avoids file protocol incompatible loading', async () => {
  const { app, html } = await dashboardSources();
  assert.doesNotThrow(() => new vm.Script(app, { filename: appPath }));
  assert.doesNotMatch(app, /(^|\n)\s*(?:import|export)\b|\bimport\s*\(|\bfetch\s*\(/u);
  assert.doesNotMatch(html, /<script[^>]+type=["']module["']/u);
});

test('generated assignment parses and dashboard contracts are present', async () => {
  const { app, generated, html } = await dashboardSources();
  const data = parseGeneratedAssignment(generated);
  assert.deepEqual(Object.keys(data), [
    'currentStage', 'currentTasks', 'stages', 'domains', 'evidence', 'quickLinks', 'warnings',
  ]);
  for (const id of [
    'current-state', 'stage-map', 'pipeline-flow', 'domain-grid', 'evidence-grid',
    'quick-link-grid', 'diagnostics-details', 'diagnostics-list', 'obsidian-fallback',
    'fallback-close', 'fallback-path', 'fallback-copy', 'copy-status',
  ]) assert.match(html, new RegExp(`\\bid="${id}"`));
  for (const name of [
    'renderCurrentState', 'renderStages', 'renderPipeline', 'renderDomains',
    'renderEvidence', 'renderQuickLinks', 'renderDiagnostics', 'openObsidian',
  ]) assert.match(app, new RegExp(`function ${name}\\b`));
});

test('mobile navigation and nonmodal fallback accessibility contracts are present', async () => {
  const { app, html } = await dashboardSources();
  const mobileNav = html.match(/<nav class="top-nav"[\s\S]*?<\/nav>/u)?.[0] ?? '';
  assert.deepEqual([...mobileNav.matchAll(/href="(#[^"]+)"/gu)].map((match) => match[1]), [
    '#overview', '#stages', '#pipeline', '#domains', '#evidence', '#quick-links',
  ]);
  assert.match(html, /id="obsidian-fallback"[^>]+role="dialog"[^>]+aria-modal="false"[^>]+tabindex="-1"/u);
  assert.match(html, /<code id="fallback-path" tabindex="0"><\/code>/u);
  assert.match(app, /\bIntersectionObserver\b/u);
  assert.match(app, /event\.key === 'Escape'/u);
  assert.match(app, /fallbackTrigger/u);
  assert.match(app, /selectNodeContents\(pathNode\)/u);
});
