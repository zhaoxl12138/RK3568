import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const vaultRoot = path.resolve(import.meta.dirname, '../..');
const pagePath = path.join(vaultRoot, '04-项目', '17-DPHY-从DTS到MediaGraph.html');

test('D-PHY course page is organized as seven progressive source-reading modules', async () => {
  const html = await readFile(pagePath, 'utf8');

  for (const id of [
    'course-overview',
    'hw-driver',
    'logical-dphy',
    'subdev-pads',
    'endpoint-async',
    'bound-link',
    'debug-evidence',
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`, 'u'), `missing section ${id}`);
    assert.match(html, new RegExp(`href=["']#${id}["']`, 'u'), `missing local navigation for ${id}`);
  }

  assert.ok((html.match(/<svg\b/giu) ?? []).length >= 6, 'the course needs at least six focused diagrams');
  assert.doesNotMatch(html, /viewBox=["']0 0 1600 1350["']/u, 'the old oversized all-in-one SVG should be removed');
});

test('diagrams distinguish driver-model relationships instead of using one ambiguous arrow', async () => {
  const html = await readFile(pagePath, 'utf8');

  for (const relationship of ['赋值', '注册', '框架回调', '直接调用', 'DTS 引用']) {
    assert.match(html, new RegExp(relationship, 'u'), `missing relationship legend: ${relationship}`);
  }

  for (const concept of [
    '设备线',
    '驱动线',
    'compatible 匹配',
    'rockchip_csi2_dphy_hw_probe',
    'rockchip_csi2_dphy_probe',
    'rockchip_csi2_dphy_attach_hw',
  ]) {
    assert.match(html, new RegExp(concept, 'u'), `missing driver lifecycle concept: ${concept}`);
  }
});

test('page teaches object ownership, async state, exact Media Graph and evidence boundaries', async () => {
  const html = await readFile(pagePath, 'utf8');

  for (const concept of [
    'struct csi2_dphy_hw',
    'struct csi2_dphy',
    'struct v4l2_subdev',
    'media_entity_pads_init',
    'waiting',
    'done',
    '不阻塞',
    'media_create_pad_link',
    'pad0 Source',
    'pad0 Sink',
    '[ENABLED]',
    '运行时 DTS',
    'Async match',
    'STREAMON',
    '不能证明',
  ]) {
    assert.match(html, new RegExp(concept.replaceAll('[', '\\[').replaceAll(']', '\\]'), 'u'), `missing concept: ${concept}`);
  }
});

test('each major topic includes plain-language and source-navigation help', async () => {
  const html = await readFile(pagePath, 'utf8');

  for (const label of ['大白话', '源码入口', '箭头类型', '调试边界', '面试表达']) {
    assert.match(html, new RegExp(label, 'u'), `missing learning aid: ${label}`);
  }

  assert.ok((html.match(/class=["'][^"']*plain-card\b/giu) ?? []).length >= 6, 'major diagrams need plain-language cards');
  assert.match(html, /Source Insight/iu);
  assert.doesNotMatch(html, /\uFFFD/u);
});
