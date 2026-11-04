import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(testDir, '../../04-项目');
const pages = [
  ['30-Media对象Entity-Pad-Link.html', 'Media 对象'],
  ['31-V4L2-Async双向注册与匹配.html', 'Async 双向'],
  ['32-Bound-Complete与MediaGraph建链.html', 'Bound / Complete'],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/gu, '');
}

function rendered(html) {
  return html.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}

function contains(html, value) {
  assert.match(rendered(html), new RegExp(escapeRegex(value), 'u'), `应包含 ${value}`);
}

function link(html, href) {
  assert.match(stripComments(html), new RegExp(`<a(?=[\\s/>])[^>]*\\shref\\s*=\\s*(["'])${escapeRegex(href)}\\1[^>]*>`, 'iu'), `应包含真实链接 ${href}`);
}

function edge(html, type) {
  return (stripComments(html).match(/<(?:path|line|polyline)(?=[\s/>])[^>]*>/giu) ?? []).some((item) => {
    const match = /\sclass\s*=\s*(["'])([^"']*)\1/iu.exec(item);
    return match?.[2].split(/\s+/u).includes('edge') && match[2].split(/\s+/u).includes(type);
  });
}

async function read(name) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(await readFile(path.join(projectDir, name)));
  } catch (error) {
    if (error?.code === 'ENOENT') assert.fail(`缺少阶段06专题文件：04-项目/${name}`);
    throw error;
  }
}

test('阶段06三个专题页存在并使用共享站点壳', async () => {
  for (const [name, title] of pages) {
    const html = await read(name);
    assert.match(html, /<!doctype html>/iu);
    assert.match(html, /<meta\b[^>]*charset\s*=\s*["']?utf-8/iu);
    assert.match(html, new RegExp(`<title>[^<]*${escapeRegex(title)}[^<]*</title>`, 'iu'));
    assert.match(html, /href=["'][^"']*学习驾驶舱\/site\.css(?:\?[^"']*)?["']/iu);
    assert.match(html, /href=["']assets\/v4l2-callgraph\.css["']/iu);
    assert.match(html, /<nav\b[^>]*\bdata-site-nav\b/iu);
    assert.match(html, /<script\b[^>]*src=["'][^"']*学习驾驶舱\/site\.js(?:\?[^"']*)?["']/iu);
  }
});

test('阶段06专题导航按 21→30→31→32→22 连续衔接', async () => {
  const [overview, p30, p31, p32] = await Promise.all([
    read('21-MediaController-Entity-Pad-Link.html'), read(pages[0][0]), read(pages[1][0]), read(pages[2][0]),
  ]);
  link(overview, pages[0][0]);
  link(p30, '21-MediaController-Entity-Pad-Link.html'); link(p30, pages[1][0]);
  link(p31, '21-MediaController-Entity-Pad-Link.html'); link(p31, pages[0][0]); link(p31, pages[2][0]);
  link(p32, '21-MediaController-Entity-Pad-Link.html'); link(p32, pages[1][0]); link(p32, '22-RKISP-从RAW到VideoNode.html');
});

test('阶段06专题图统一区分直接调用、框架回调和对象关系', async () => {
  for (const [name] of pages) {
    const html = await read(name);
    contains(html, '直接调用'); contains(html, '框架回调');
    assert.match(html, /对象关系|链表迁移|数据流/u);
    assert.match(html, /<svg\b/iu);
    for (const type of ['direct', 'callback', 'data']) assert.ok(edge(html, type), `${name} 缺少 edge ${type}`);
    assert.match(html, /class=["'][^"']*\bmobile-flow\b/iu);
    assert.doesNotMatch(html, /overflow(?:-x|-y)?\s*:\s*(?:auto|scroll)/iu);
  }
});

test('专题30锁定 Media 对象初始化和 link 双向索引', async () => {
  const html = await read(pages[0][0]);
  for (const value of ['struct media_device', 'struct media_entity', 'struct media_pad', 'struct media_link', 'media_entity_pads_init()', 'media_create_pad_link()', 'backlink', 'reverse']) contains(html, value);
});

test('专题31锁定 Async 两种到达顺序和统一状态迁移', async () => {
  const html = await read(pages[1][0]);
  for (const value of ['v4l2_async_register_subdev()', '__v4l2_async_notifier_register()', 'v4l2_async_notifier_try_all_subdevs()', 'v4l2_async_match_notify()', 'notifier_list', 'subdev_list', 'waiting', 'done', 'bound()']) contains(html, value);
});

test('专题32锁定 D-PHY bound、RKISP complete 与分段建链', async () => {
  const html = await read(pages[2][0]);
  for (const value of ['rockchip_csi2_dphy_notifier_bound()', 'media_create_pad_link()', 'subdev_notifier_complete()', 'rkisp_create_links()', 'dphy->notifier', 'dphy->sd', 'media-ctl -p']) contains(html, value);
});
