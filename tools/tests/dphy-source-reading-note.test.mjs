import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const notePath = path.join(repoRoot, '06-任务', 'Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读.md');
const chapterPath = path.join(repoRoot, '06-任务', 'Camera驱动第2章-MIPI-DPHY与CSI2.md');

function readRequired(filePath, label) {
  assert.equal(fs.existsSync(filePath), true, `${label} must exist: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

test('D-PHY source-reading note stays private and identifies the real SDK source', () => {
  const note = readRequired(notePath, 'source-reading note');

  assert.match(note, /web-publish:\s*false/u);
  assert.match(note, /learning-status:\s*in-progress/u);
  assert.match(note, /drivers\/phy\/rockchip\/phy-rockchip-csi2-dphy\.c/u);
  assert.match(note, /Linux 4\.19/u);
});

test('D-PHY source-reading note follows the complete DTS-to-Media call chain', () => {
  const note = readRequired(notePath, 'source-reading note');

  for (const name of [
    'rockchip_csi2_dphy_probe',
    'rockchip_csi2_dphy_attach_hw',
    'v4l2_subdev_init',
    'rockchip_csi2dphy_media_init',
    'media_entity_pads_init',
    'v4l2_async_notifier_parse_fwnode_endpoints_by_port',
    'v4l2_async_subdev_notifier_register',
  ]) assert.match(note, new RegExp(name, 'u'), `missing source-reading section for ${name}`);

  for (const phrase of ['直接调用', '驱动模型回调', '结构体变化', '运行时证据', '面试表达']) {
    assert.match(note, new RegExp(phrase, 'u'), `missing learning aid: ${phrase}`);
  }
});

test('the concept chapter links to the D-PHY source-reading companion', () => {
  const chapter = readRequired(chapterPath, 'concept chapter');

  assert.match(chapter, /\[\[Camera驱动第2章-DPHY从DTS到MediaGraph源码陪读\]\]/u);
});
