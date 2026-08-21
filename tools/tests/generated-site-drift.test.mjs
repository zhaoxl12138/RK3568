import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const generatedRoots = [
  path.join(root, '00-首页', '学习驾驶舱'),
  path.join(root, '04-项目'),
];

function collectHtmlAndRuntime(directory) {
  const result = new Map();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [filePath, content] of collectHtmlAndRuntime(fullPath)) result.set(filePath, content);
    } else if (/\.(?:html|js|css)$/u.test(entry.name)) {
      result.set(path.relative(root, fullPath), fs.readFileSync(fullPath));
    }
  }
  return result;
}

function snapshot() {
  const result = new Map();
  for (const directory of generatedRoots) {
    for (const [filePath, content] of collectHtmlAndRuntime(directory)) result.set(filePath, content);
  }
  return result;
}

test('dashboard build is idempotent and introduces no generated-site drift', () => {
  const before = snapshot();
  execFileSync(process.execPath, ['tools/build-dashboard.mjs'], { cwd: root, stdio: 'pipe' });
  const after = snapshot();
  assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort());
  for (const [filePath, content] of before) {
    assert.ok(content.equals(after.get(filePath)), `generated drift: ${filePath}`);
  }
});
