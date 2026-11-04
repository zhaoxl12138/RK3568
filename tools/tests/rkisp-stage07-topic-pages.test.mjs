import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const projectDir = path.join(repoRoot, '04-项目');

const topicPages = [
  { fileName: '27-RKISP双Platform驱动与对象桥.html', title: '双 Platform' },
  { fileName: '28-RKISP内部节点注册与外部Async建链.html', title: '内部节点注册' },
  { fileName: '29-RKISP开流与帧完成中断.html', title: '开流与帧完成' },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertContains(content, expected, message) {
  const renderedText = content
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
  assert.match(renderedText, new RegExp(escapeRegex(expected), 'u'), message ?? `应包含 ${expected}`);
}

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/gu, '');
}

function assertLinkTo(html, href, message) {
  const linkPattern = new RegExp(
    `<a(?=[\\s/>])[^>]*\\shref\\s*=\\s*(["'])${escapeRegex(href)}\\1[^>]*>`,
    'iu',
  );
  assert.ok(linkPattern.test(stripHtmlComments(html)), message ?? `应包含指向 ${href} 的真实链接`);
}

function hasSvgEdgeClass(html, edgeType) {
  const edgeElements = stripHtmlComments(html).match(/<(?:path|line|polyline)(?=[\s/>])[^>]*>/giu) ?? [];
  return edgeElements.some((element) => {
    const classAttribute = /\sclass\s*=\s*(["'])([^"']*)\1/iu.exec(element);
    if (!classAttribute) return false;
    const tokens = classAttribute[2].trim().split(/\s+/u).filter(Boolean);
    return tokens.includes('edge') && tokens.includes(edgeType);
  });
}

async function readProjectFile(relativePath) {
  const absolutePath = path.join(projectDir, relativePath);
  let bytes;
  try {
    bytes = await readFile(absolutePath);
  } catch (error) {
    if (error?.code === 'ENOENT') assert.fail(`缺少阶段07专题文件：04-项目/${relativePath}`);
    throw error;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    assert.fail(`阶段07专题文件不是有效 UTF-8：04-项目/${relativePath}`);
  }
}

test('阶段07测试辅助契约拒绝注释链接和伪 edge class', () => {
  assertLinkTo('<a href="27.html">真实链接</a>', '27.html');
  assert.throws(
    () => assertLinkTo('<!-- <a href="27.html">注释链接</a> -->', '27.html', '注释链接不得通过'),
    /注释链接不得通过/u,
  );
  assert.equal(hasSvgEdgeClass('<path class="edge direct"/>', 'direct'), true);
  assert.equal(hasSvgEdgeClass('<path class="edge-direct"/>', 'direct'), false);
});

test('阶段07三个专题页存在并接入共享站点壳', async () => {
  for (const { fileName, title } of topicPages) {
    const html = await readProjectFile(fileName);
    assert.match(html, /<!doctype html>/iu, `${fileName} 应是 HTML5`);
    assert.match(html, /<meta\b[^>]*charset\s*=\s*["']?utf-8["']?/iu, `${fileName} 应声明 UTF-8`);
    assert.match(html, new RegExp(`<title>[^<]*${escapeRegex(title)}[^<]*</title>`, 'iu'));
    assert.match(html, /href=["'][^"']*学习驾驶舱\/site\.css(?:\?[^"']*)?["']/iu);
    assert.match(html, /href=["']assets\/v4l2-callgraph\.css["']/iu);
    assert.match(html, /<nav\b[^>]*\bdata-site-nav\b/iu);
    assert.match(html, /<script\b[^>]*src=["'][^"']*学习驾驶舱\/site\.js(?:\?[^"']*)?["']/iu);
  }
});

test('阶段07专题导航按 22→27→28→29→23 连续衔接', async () => {
  const overview = await readProjectFile('22-RKISP-从RAW到VideoNode.html');
  const page27 = await readProjectFile(topicPages[0].fileName);
  const page28 = await readProjectFile(topicPages[1].fileName);
  const page29 = await readProjectFile(topicPages[2].fileName);

  assertLinkTo(overview, topicPages[0].fileName, '22 总览应进入专题 27');
  assertLinkTo(page27, '22-RKISP-从RAW到VideoNode.html');
  assertLinkTo(page27, topicPages[1].fileName);
  assertLinkTo(page28, '22-RKISP-从RAW到VideoNode.html');
  assertLinkTo(page28, topicPages[0].fileName);
  assertLinkTo(page28, topicPages[2].fileName);
  assertLinkTo(page29, '22-RKISP-从RAW到VideoNode.html');
  assertLinkTo(page29, topicPages[1].fileName);
  assertLinkTo(page29, '23-V4L2-VB2用户态取流.html');
});

test('每个阶段07专题页区分直接调用、框架回调和数据或对象关系', async () => {
  for (const { fileName } of topicPages) {
    const html = await readProjectFile(fileName);
    assertContains(html, '直接调用');
    assertContains(html, '框架回调');
    assert.match(html, /数据流|对象关系|对象共享|Buffer\s*所有权/u);
    assert.match(html, /<svg\b/iu);
    for (const edgeType of ['direct', 'callback', 'data']) {
      assert.ok(hasSvgEdgeClass(html, edgeType), `${fileName} 应包含 edge ${edgeType}`);
    }
    assert.match(html, /class=["'][^"']*\bmobile-flow\b[^"']*["']/iu);
    assert.doesNotMatch(html, /overflow(?:-x|-y)?\s*:\s*(?:auto|scroll)/iu);
  }
});

test('专题27锁定双 driver、双 probe 与 phandle/drvdata 对象桥', async () => {
  const html = await readProjectFile(topicPages[0].fileName);
  for (const symbol of [
    'rkisp_hw_drv_init()',
    'platform_driver_register(&rkisp_hw_drv)',
    'platform_driver_register(&rkisp_plat_drv)',
    'rkisp_hw_probe()',
    'rkisp_plat_probe()',
    'rkisp_attach_hw()',
    'of_parse_phandle()',
    'platform_get_drvdata()',
    'dev_set_drvdata()',
  ]) assertContains(html, symbol, `专题27应包含 ${symbol}`);
});

test('专题28锁定内部 subdev、Video Node 与外部 Async 两个汇合点', async () => {
  const html = await readProjectFile(topicPages[1].fileName);
  for (const symbol of [
    'rkisp_register_platform_subdevs()',
    'rkisp_register_isp_subdev()',
    'rkisp_register_csi_subdev()',
    'rkisp_register_stream_vdevs()',
    'rkisp_register_stream_v21()',
    'rkisp_register_stream_vdev()',
    'video_register_device()',
    'subdev_notifier_complete()',
    'rkisp_create_links()',
  ]) assertContains(html, symbol, `专题28应包含 ${symbol}`);
});

test('专题29锁定 RKISP 本地启动、上游开流与帧完成中断', async () => {
  const html = await readProjectFile(topicPages[2].fileName);
  for (const symbol of [
    'rkisp_start_streaming()',
    'rkisp_stream_start()',
    'pipe.set_stream',
    'rkisp_pipeline_set_stream()',
    's_stream(1)',
    'rkisp_mi_v21_isr()',
    'mi_frame_end()',
    'vb2_buffer_done(DONE)',
  ]) assertContains(html, symbol, `专题29应包含 ${symbol}`);
});
