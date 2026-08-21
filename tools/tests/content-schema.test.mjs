import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('content schema separates document, learning, evidence, and publishing states', () => {
  const schema = read('docs/content-schema.md');
  for (const type of ['course', 'source-reading', 'evidence', 'task', 'reference', 'interview-output']) {
    assert.match(schema, new RegExp(`\\b${type}\\b`, 'u'));
  }
  for (const field of ['learning-status', 'evidence-status', 'publish-status', 'course-stage']) {
    assert.match(schema, new RegExp(field, 'u'));
  }
  assert.match(schema, /web-publish:\s*false[\s\S]*publish-status:\s*private/u);
});

test('course, source-reading, and evidence templates use the shared metadata contract', () => {
  const templates = [
    ['08-附录/模板/课程正文模板.md', 'course'],
    ['08-附录/模板/源码陪读模板.md', 'source-reading'],
    ['08-附录/模板/实验证据模板.md', 'evidence'],
  ];
  for (const [file, type] of templates) {
    const source = read(file);
    assert.match(source, new RegExp(`doc-type:\\s*${type}`, 'u'));
    assert.match(source, /course-stage:\s*"[A-Z0-9]+"/u);
    assert.match(source, /learning-status:/u);
    assert.match(source, /evidence-status:/u);
    assert.match(source, /publish-status:/u);
  }
});

test('dashboard publisher supports private status and the legacy private flag', () => {
  const source = read('tools/build-dashboard.mjs');
  assert.match(source, /publish-status:\\s\*private/u);
  assert.match(source, /web-publish:\\s\*\(\?:false\|no\|0\)/u);
});
