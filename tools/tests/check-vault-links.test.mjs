import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { afterEach, beforeEach, test } from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scanVault } from '../check-vault-links.mjs';

const checkerPath = fileURLToPath(new URL('../check-vault-links.mjs', import.meta.url));
let vaultDir;

async function writeFixture(relativePath, contents = '') {
  const filePath = path.join(vaultDir, ...relativePath.split('/'));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

async function runCli(...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [checkerPath, ...args], {
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stderr, stdout }));
  });
}

beforeEach(async () => {
  vaultDir = await mkdtemp(path.join(tmpdir(), 'rk3568-vault-'));

  await Promise.all([
    writeFixture('00-首页/00-首页入口.md', '# 首页\n'),
    writeFixture('07-专项笔记/00-专项笔记入口.md', '# 专项笔记\n'),
    writeFixture('08-附录/assets/占位图.png', 'image'),
    writeFixture('99-归档/00-归档说明.md', '# 归档说明\n'),
  ]);
});

afterEach(async () => {
  await rm(vaultDir, { recursive: true, force: true });
});

test('resolves wikilinks by basename', async () => {
  await writeFixture('07-专项笔记/相机基础.md', '# 相机基础\n## 采集章节\n');
  await writeFixture(
    '00-首页/00-首页入口.md',
    '[[相机基础]]\n[[相机基础|相机别名]]\n[[相机基础#采集章节]]\n',
  );

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, []);
});

test('resolves embedded image wikilinks', async () => {
  await writeFixture('08-附录/assets/相机链路图.png', 'image');
  await writeFixture('07-专项笔记/图像说明.md', '![[相机链路图.png]]\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, []);
});

test('reports missing markdown relative links', async () => {
  await writeFixture('00-首页/导航.md', '[缺失笔记](../07-专项笔记/不存在.md)\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenRelativeLinks, [
    {
      source: '00-首页/导航.md',
      target: '../07-专项笔记/不存在.md',
    },
  ]);
});

test('reports active documents linking directly to archive content', async () => {
  await writeFixture('99-归档/旧版路线.md', '# 旧版路线\n');
  await writeFixture('07-专项笔记/迁移说明.md', '[旧版路线](../99-归档/旧版路线.md)\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.activeToArchiveLinks, [
    {
      source: '07-专项笔记/迁移说明.md',
      target: '99-归档/旧版路线.md',
    },
  ]);
});

test('allows archive index links', async () => {
  await writeFixture('00-首页/导航.md', '[[99-归档/00-归档说明|归档说明]]\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, []);
  assert.deepEqual(result.activeToArchiveLinks, []);
});

test('ignores stale links inside archive documents', async () => {
  await writeFixture('99-归档/历史记录.md', '[[已经删除的旧入口]]\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, []);
});

test('does not resolve stale explicit wikilink paths by basename', async () => {
  await writeFixture('07-专项笔记/新目录/相机基础.md', '# 相机基础\n');
  await writeFixture('00-首页/导航.md', '[[07-专项笔记/旧目录/相机基础]]\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, [
    {
      source: '00-首页/导航.md',
      target: '07-专项笔记/旧目录/相机基础',
    },
  ]);
});

test('reports duplicate basename wikilinks as ambiguous and broken', async () => {
  await writeFixture('07-专项笔记/Camera/相机基础.md', '# Camera\n');
  await writeFixture('07-专项笔记/V4L2/相机基础.md', '# V4L2\n');
  await writeFixture('00-首页/导航.md', '[[相机基础]]\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, [
    {
      source: '00-首页/导航.md',
      target: '相机基础',
    },
  ]);
});

test('normalizes Windows separators in explicit wikilink paths', async () => {
  await writeFixture('07-专项笔记/Camera/相机基础.md', '# 相机基础\n');
  await writeFixture('00-首页/导航.md', '[[07-专项笔记\\Camera\\相机基础]]\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, []);
});

test('ignores external markdown links and anchors', async () => {
  await writeFixture(
    '00-首页/导航.md',
    [
      '[HTTP](http://example.com/a)',
      '[HTTPS](https://example.com/a)',
      '[File](file:///C:/资料/说明.md)',
      '[Obsidian](obsidian://open?vault=RK3568)',
      '[Anchor](#本页章节)',
    ].join('\n'),
  );

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenRelativeLinks, []);
});

test('exempts entry points, task board, README, and generated data from orphans', async () => {
  await writeFixture('README.md', '# README\n');
  await writeFixture('02-资料/00-资料入口.md', '# 资料入口\n');
  await writeFixture('06-任务/01-下一步任务看板.md', '# 下一步任务\n');
  await writeFixture('00-首页/学习驾驶舱/generated/快照.md', '# 生成数据\n');
  await writeFixture('07-专项笔记/孤立正文.md', '# 孤立正文\n');

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.orphanActiveDocs, ['07-专项笔记/孤立正文.md']);
});

test('ignores fenced code links and docs link examples', async () => {
  await writeFixture(
    '00-首页/代码示例.md',
    '```markdown\n[[不存在]]\n[缺失](../不存在.md)\n```\n',
  );
  await writeFixture(
    'docs/设计说明.md',
    '[[文档中的占位符]]\n[旧路线](../99-归档/不存在.md)\n',
  );

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenWikiLinks, []);
  assert.deepEqual(result.brokenRelativeLinks, []);
  assert.deepEqual(result.activeToArchiveLinks, []);
});

test('resolves markdown destinations containing parentheses', async () => {
  await writeFixture('08-附录/assets/图像(最终).png', 'image');
  await writeFixture(
    '07-专项笔记/图像说明.md',
    [
      '[普通括号](../08-附录/assets/图像(最终).png)',
      '[转义括号](../08-附录/assets/图像\\(最终\\).png)',
    ].join('\n'),
  );

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenRelativeLinks, []);
});

test('treats parentheses as literal inside angle-bracket destinations', async () => {
  await writeFixture('07-专项笔记/file)name.md', '# 右括号文件\n');
  await writeFixture('07-专项笔记/file(name.md', '# 左括号文件\n');
  await writeFixture(
    '07-专项笔记/00-专项笔记入口.md',
    [
      '[右括号](<file)name.md>)',
      '[左括号](<file(name.md>)',
    ].join('\n'),
  );

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenRelativeLinks, []);
  assert.deepEqual(result.orphanActiveDocs, []);
});

test('ignores malformed angle-bracket destinations without swallowing later links', async () => {
  await writeFixture('07-专项笔记/有效目标.md', '# 有效目标\n');
  await writeFixture(
    '07-专项笔记/00-专项笔记入口.md',
    '[格式错误](<未闭合.md)\n[有效链接](有效目标.md)\n',
  );

  const result = await scanVault(vaultDir);

  assert.deepEqual(result.brokenRelativeLinks, []);
  assert.deepEqual(result.orphanActiveDocs, []);
});

test('orphan-only CLI scan exits zero', async () => {
  await writeFixture('07-专项笔记/孤立正文.md', '# 孤立正文\n');

  const result = await runCli(vaultDir);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /Orphan active docs \(warnings\): 1/u);
  assert.equal(result.stderr, '');
});

test('CLI exits one for broken links', async () => {
  await writeFixture('00-首页/导航.md', '[[不存在]]\n');

  const result = await runCli(vaultDir);

  assert.equal(result.code, 1);
});

test('CLI exits one for active-to-archive links', async () => {
  await writeFixture('99-归档/旧版路线.md', '# 旧版路线\n');
  await writeFixture('00-首页/导航.md', '[[99-归档/旧版路线]]\n');

  const result = await runCli(vaultDir);

  assert.equal(result.code, 1);
});

test('CLI emits JSON with --json', async () => {
  const result = await runCli(vaultDir, '--json');

  assert.equal(result.code, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(Object.keys(JSON.parse(result.stdout)), [
    'markdownFiles',
    'brokenWikiLinks',
    'brokenRelativeLinks',
    'activeToArchiveLinks',
    'orphanActiveDocs',
  ]);
});

test('CLI rejects unknown options', async () => {
  const result = await runCli(vaultDir, '--unknown');

  assert.equal(result.code, 2);
  assert.match(result.stderr, /Unknown option: --unknown/u);
});

test('CLI rejects extra positional arguments', async () => {
  const result = await runCli(vaultDir, 'another-vault');

  assert.equal(result.code, 2);
  assert.match(result.stderr, /Expected at most one vault path/u);
});
