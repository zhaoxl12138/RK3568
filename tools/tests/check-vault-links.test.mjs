import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { scanVault } from '../check-vault-links.mjs';

let vaultDir;

async function writeFixture(relativePath, contents = '') {
  const filePath = path.join(vaultDir, ...relativePath.split('/'));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
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
