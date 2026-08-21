import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const kernelRoot = process.env.RK3568_ANNOTATED_KERNEL
  ?? 'E:/sourceInsight/rk3568_linux_4.19_kernel/kernel';
const stageDir = path.join(repoRoot, '02-源码陪读', '08-V4L2用户态取流');

function readRequired(filePath, label) {
  assert.equal(fs.existsSync(filePath), true, `${label} 不存在：${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readSource(relativePath) {
  return readRequired(path.join(kernelRoot, relativePath), '源码文件');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertStageCommentBefore(source, signature) {
  const position = source.indexOf(signature);
  assert.ok(position >= 0, `源码中找不到真实定义：${signature}`);
  const context = source.slice(Math.max(0, position - 900), position);
  assert.match(context, /\[源码陪读 08\]/u, `${signature} 前缺少 [源码陪读 08] 注释`);
}

function assertAnnotatedStatement(source, statement) {
  const positions = [];
  let position = source.indexOf(statement);
  while (position >= 0) {
    positions.push(position);
    position = source.indexOf(statement, position + statement.length);
  }
  assert.ok(positions.length > 0, `源码中找不到关键语句：${statement}`);
  const hasAnnotation = positions.some((statementPosition) => {
    const context = source.slice(Math.max(0, statementPosition - 420), statementPosition);
    return /\[源码陪读 08\]/u.test(context);
  });
  assert.equal(hasAnnotation, true, `${statement} 附近缺少 [源码陪读 08] 注释`);
}

function assertAnnotatedStatementInFunction(source, signature, statement) {
  const functionPosition = source.indexOf(signature);
  assert.ok(functionPosition >= 0, `源码中找不到函数：${signature}`);
  const statementPosition = source.indexOf(statement, functionPosition + signature.length);
  assert.ok(statementPosition >= 0, `${signature} 中找不到关键语句：${statement}`);
  const context = source.slice(Math.max(functionPosition, statementPosition - 420), statementPosition);
  assert.match(context, /\[源码陪读 08\]/u,
    `${signature} 中的 ${statement} 附近缺少 [源码陪读 08] 注释`);
}

test('stage 08 annotations cover the real V4L2 ioctl dispatch entries', () => {
  const source = readSource('drivers/media/v4l2-core/v4l2-ioctl.c');

  for (const signature of [
    'static long __video_do_ioctl(struct file *file,',
    'long video_ioctl2(struct file *file,',
  ]) assertStageCommentBefore(source, signature);

  for (const statement of [
    'const struct v4l2_ioctl_ops *ops = vfd->ioctl_ops;',
    'ret = info->func(ops, file, fh, arg);',
    'return video_usercopy(file, cmd, arg, __video_do_ioctl);',
  ]) assertAnnotatedStatement(source, statement);
});

test('stage 08 annotations cover both vb2 V4L2 adapters and public helpers', () => {
  const source = readSource('drivers/media/common/videobuf2/videobuf2-v4l2.c');

  for (const signature of [
    'int vb2_reqbufs(struct vb2_queue *q, struct v4l2_requestbuffers *req)',
    'int vb2_qbuf(struct vb2_queue *q, struct v4l2_buffer *b)',
    'int vb2_dqbuf(struct vb2_queue *q, struct v4l2_buffer *b, bool nonblocking)',
    'int vb2_streamon(struct vb2_queue *q, enum v4l2_buf_type type)',
    'int vb2_ioctl_reqbufs(struct file *file, void *priv,',
    'int vb2_ioctl_qbuf(struct file *file, void *priv, struct v4l2_buffer *p)',
    'int vb2_ioctl_dqbuf(struct file *file, void *priv, struct v4l2_buffer *p)',
    'int vb2_ioctl_streamon(struct file *file, void *priv, enum v4l2_buf_type i)',
  ]) assertStageCommentBefore(source, signature);

  for (const statement of [
    'vdev->queue->owner = p->count ? file->private_data : NULL;',
    'return vb2_qbuf(vdev->queue, p);',
    'return vb2_dqbuf(vdev->queue, p, file->f_flags & O_NONBLOCK);',
    'return vb2_streamon(vdev->queue, i);',
  ]) assertAnnotatedStatement(source, statement);
});

test('stage 08 annotations expose the vb2 core state transitions and wake-up proof', () => {
  const source = readSource('drivers/media/common/videobuf2/videobuf2-core.c');

  for (const signature of [
    'void vb2_buffer_done(struct vb2_buffer *vb, enum vb2_buffer_state state)',
    'static void __enqueue_in_driver(struct vb2_buffer *vb)\n{',
    'static int vb2_start_streaming(struct vb2_queue *q)',
    'int vb2_core_qbuf(struct vb2_queue *q, unsigned int index, void *pb)',
    'static void __vb2_dqbuf(struct vb2_buffer *vb)',
    'int vb2_core_dqbuf(struct vb2_queue *q, unsigned int *pindex, void *pb,',
    'int vb2_core_streamon(struct vb2_queue *q, unsigned int type)',
  ]) assertStageCommentBefore(source, signature);

  for (const statement of [
    'list_add_tail(&vb->done_entry, &q->done_list);',
    'wake_up(&q->done_wq);',
    '__enqueue_in_driver(vb);',
    'ret = call_qop(q, start_streaming, q,',
    'vb->state = VB2_BUF_STATE_QUEUED;',
    'q->streaming = 1;',
  ]) assertAnnotatedStatement(source, statement);

  for (const [signature, statement] of [
    ['static void __enqueue_in_driver(struct vb2_buffer *vb)\n{',
      'vb->state = VB2_BUF_STATE_ACTIVE;'],
    ['int vb2_core_qbuf(struct vb2_queue *q, unsigned int index, void *pb)',
      'vb->state = VB2_BUF_STATE_QUEUED;'],
    ['static void __vb2_dqbuf(struct vb2_buffer *vb)',
      'vb->state = VB2_BUF_STATE_DEQUEUED;'],
  ]) assertAnnotatedStatementInFunction(source, signature, statement);
});

test('stage 08 chapters teach one continuous user-to-DMA chain with evidence limits', () => {
  const chapterNames = [
    '00-源码陪读索引.md',
    '01-生命周期.md',
    '02-对象与数据链.md',
    '03-调试与面试验收.md',
  ];
  const chapters = chapterNames.map((name) => readRequired(path.join(stageDir, name), name));
  const corpus = chapters.join('\n');

  for (const [index, chapter] of chapters.entries()) {
    assert.match(chapter, /Source Insight/u, `${chapterNames[index]} 缺少 Source Insight 搜索指引`);
    assert.match(chapter, /白话/u, `${chapterNames[index]} 缺少白话解释`);
    assert.match(chapter, /能证明/u, `${chapterNames[index]} 缺少“能证明”边界`);
    assert.match(chapter, /不能证明/u, `${chapterNames[index]} 缺少“不能证明”边界`);
  }

  for (const required of [
    'video_device',
    'v4l2_file_operations',
    'v4l2_ioctl_ops',
    'vb2_queue',
    '函数指针回调',
    '直接调用',
    'S_FMT',
    'REQBUFS',
    'QUERYBUF',
    'mmap',
    'QBUF',
    'STREAMON',
    'DQBUF',
    'DEQUEUED',
    'PREPARED',
    'QUEUED',
    'ACTIVE',
    'DONE',
    'done_list',
    'done_wq',
    'num_planes',
    'v4l2_plane',
    '物理连续',
    'vb2_buffer_done',
    'DMA',
    '中断',
    '谁调用',
    '为什么这样设计',
  ]) {
    assert.match(corpus, new RegExp(escapeRegExp(required), 'u'), `四篇正文缺少：${required}`);
  }

  assert.match(corpus, /rkisp.*vb2_buffer_done|vb2_buffer_done.*rkisp/isu,
    '必须把 RKISP 完成路径与 vb2_buffer_done 连起来');
  assert.match(corpus, /API plane[^]*?物理连续|物理连续[^]*?API plane/isu,
    '必须明确 API plane 与物理连续性不是同一概念');
});

test('stage 08 chapters keep the reading order and responsibilities separate', () => {
  const index = readRequired(path.join(stageDir, '00-源码陪读索引.md'), '索引');
  const lifecycle = readRequired(path.join(stageDir, '01-生命周期.md'), '生命周期');
  const dataChain = readRequired(path.join(stageDir, '02-对象与数据链.md'), '对象与数据链');
  const acceptance = readRequired(path.join(stageDir, '03-调试与面试验收.md'), '调试与面试验收');

  assert.match(index, /先看 01，再看 02，最后做 03/u);
  assert.match(lifecycle, /注册时挂表，运行时查表/u);
  assert.match(dataChain, /应用拥有|驱动\/DMA 拥有|已完成待应用领取/u);
  assert.match(acceptance, /DQBUF 超时/u);
});
