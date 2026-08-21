import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const kernelRoot = process.env.RK3568_ANNOTATED_KERNEL
  ?? 'E:/sourceInsight/rk3568_linux_4.19_kernel/kernel';
const ispRoot = 'drivers/media/platform/rockchip/isp';
const stageRoot = path.join(repoRoot, '02-源码陪读', '07-RKISP');

function readKernel(relativePath) {
  const filePath = path.join(kernelRoot, ispRoot, relativePath);
  assert.equal(fs.existsSync(filePath), true, `源码文件不存在：${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readStage(relativePath) {
  const filePath = path.join(stageRoot, relativePath);
  assert.equal(fs.existsSync(filePath), true, `阶段文档不存在：${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertStageCommentNear(source, symbol, distance = 1200) {
  const position = source.indexOf(symbol);
  assert.ok(position >= 0, `源码中找不到真实符号/语句：${symbol}`);
  const context = source.slice(Math.max(0, position - distance), position);
  assert.match(context, /\[源码陪读 07\]/u, `${symbol} 前缺少邻近的 [源码陪读 07] 注释`);
}

test('stage 07 annotations cover the real RKISP registration and streaming spine', () => {
  const expectations = new Map([
    ['hw.c', [
      'rkisp_hw_probe(struct platform_device *pdev)',
      'dev_set_drvdata(dev, hw_dev);',
      'rkisp_hw_drv_init(void)',
      'platform_driver_register(&rkisp_plat_drv)',
    ]],
    ['dev.c', [
      'rkisp_pipeline_set_stream(struct rkisp_pipeline *p, bool on)',
      'rkisp_create_links(struct rkisp_device *dev)',
      'subdev_notifier_complete(struct v4l2_async_notifier *notifier)',
      'ret = rkisp_create_links(dev);',
      'rkisp_register_platform_subdevs(struct rkisp_device *dev)',
      'rkisp_plat_probe(struct platform_device *pdev)',
      'ret = rkisp_attach_hw(isp_dev);',
      'isp_dev->pipe.set_stream = rkisp_pipeline_set_stream;',
    ]],
    ['csi.c', [
      'rkisp_register_csi_subdev(struct rkisp_device *dev,',
      'v4l2_subdev_init(sd, &rkisp_csi_ops);',
    ]],
    ['rkisp.c', [
      'rkisp_register_isp_subdev(struct rkisp_device *isp_dev,',
      'v4l2_subdev_init(sd, &rkisp_isp_sd_ops);',
    ]],
    ['capture.c', [
      'rkisp_register_stream_vdev(struct rkisp_stream *stream)',
      'vdev->queue = &node->buf_queue;',
      'video_register_device(vdev, VFL_TYPE_GRABBER, -1)',
      'rkisp_register_stream_vdevs(struct rkisp_device *dev)',
    ]],
    ['capture_v21.c', [
      'rkisp_start_streaming(struct vb2_queue *queue, unsigned int count)',
      'dev->pipe.set_stream(&dev->pipe, true)',
      '.start_streaming = rkisp_start_streaming,',
    ]],
  ]);

  const sources = [];
  for (const [file, symbols] of expectations) {
    const source = readKernel(file);
    sources.push(source);
    for (const symbol of symbols) assertStageCommentNear(source, symbol);
  }

  const combined = sources.join('\n');
  for (const concept of [
    '为什么拆分',
    '对象来源',
    '对象桥',
    '函数指针赋值',
    '框架回调',
    '直接调用',
    '汇合点',
    '能证明',
    '不能证明',
  ]) {
    assert.match(combined, new RegExp(`\\[源码陪读 07\\][^]*?${concept}`, 'u'), `源码注释缺少概念：${concept}`);
  }
});

test('rkisp_attach_hw is verified at its real definition and annotated at the authorized call bridge', () => {
  const common = readKernel('common.c');
  assert.match(common, /int\s+rkisp_attach_hw\s*\(struct rkisp_device \*isp\)/u);

  const dev = readKernel('dev.c');
  assertStageCommentNear(dev, 'ret = rkisp_attach_hw(isp_dev);', 700);
  assert.match(dev, /\[源码陪读 07\][^]*?rkisp_attach_hw\(isp_dev\)[^]*?platform_get_drvdata/u);
});

test('stage 07 chapters explain object origins, function tables, convergence, data flow, and evidence limits', () => {
  const files = [
    '00-源码陪读索引.md',
    '01-生命周期.md',
    '02-对象与数据链.md',
    '03-调试与面试验收.md',
  ];
  const chapters = files.map(readStage);
  const combined = chapters.join('\n');

  for (const chapter of chapters) {
    assert.match(chapter, /为什么/u, '每篇都必须解释为什么这样设计');
    assert.match(chapter, /能证明/u, '每篇都必须写证据能证明什么');
    assert.match(chapter, /不能证明/u, '每篇都必须写证据不能证明什么');
  }

  for (const required of [
    'struct rkisp_hw_dev',
    'struct rkisp_device',
    'dev_set_drvdata',
    'platform_get_drvdata',
    'rockchip,hw',
    'struct rkisp_csi_device',
    'struct rkisp_isp_subdev',
    'struct rkisp_stream',
    'struct video_device',
    'struct vb2_queue',
    'rkisp_csi_ops',
    'rkisp_isp_sd_ops',
    'rkisp_vb2_ops',
    'rkisp_fops',
    'rkisp_v4l2_ioctl_ops',
    'RAW',
    'MEDIA_BUS_FMT_YUYV8_2X8',
    'V4L2_PIX_FMT_NV12',
    'video_register_device',
    '/dev/videoX',
    'subdev_notifier_complete',
    'rkisp_create_links',
    'rkisp_start_streaming',
    'pipe.set_stream',
    'rkisp_pipeline_set_stream',
    'Source Insight 逐步表',
    '调用类型',
    '对象从哪里来',
    '在哪汇合',
    '白话',
    '证据边界',
  ]) {
    assert.match(combined, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'), `四篇文档缺少：${required}`);
  }
});
