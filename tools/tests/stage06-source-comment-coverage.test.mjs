import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const kernelRoot = process.env.RK3568_ANNOTATED_KERNEL
  ?? 'E:/sourceInsight/rk3568_linux_4.19_kernel/kernel';
const stageRoot = 'E:/obsidian_github/RK3568/02-源码陪读/06-Media-Controller';

function readFile(filePath) {
  assert.equal(fs.existsSync(filePath), true, `文件不存在：${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readSource(relativePath) {
  return readFile(path.join(kernelRoot, relativePath));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertStageCommentBefore(source, target, label = target, distance = 900) {
  const pattern = target instanceof RegExp ? target : new RegExp(escapeRegExp(target), 'u');
  const match = pattern.exec(source);
  assert.ok(match, `源码中找不到关键符号或语句：${label}`);
  const context = source.slice(Math.max(0, match.index - distance), match.index);
  assert.match(context, /\[源码陪读 06\]/u, `${label} 前缺少 [源码陪读 06] 注释`);
}

test('stage 06 annotations cover Media Entity, Pad and Link construction', () => {
  const source = readSource('drivers/media/media-entity.c');

  for (const [pattern, label] of [
    [/int media_entity_pads_init\([^]*?\n\{/u, 'media_entity_pads_init()'],
    [/media_create_pad_link\([^]*?\n\{/u, 'media_create_pad_link()'],
  ]) {
    assertStageCommentBefore(source, pattern, label);
  }

  for (const statement of [
    'entity->num_pads = num_pads;',
    'entity->pads = pads;',
    'pads[i].entity = entity;',
    'pads[i].index = i;',
    'link = media_add_link(&source->links);',
    'link->source = &source->pads[source_pad];',
    'backlink = media_add_link(&sink->links);',
    'backlink->is_backlink = true;',
    'link->reverse = backlink;',
    'sink->num_backlinks++;',
  ]) {
    assertStageCommentBefore(source, statement, statement, 500);
  }
});

test('stage 06 annotations cover both orders of V4L2 Async matching', () => {
  const source = readSource('drivers/media/v4l2-core/v4l2-async.c');

  for (const [pattern, label] of [
    [/static struct v4l2_async_subdev \*v4l2_async_find_match\([^]*?\n\{/u, 'v4l2_async_find_match()'],
    [/static int v4l2_async_notifier_try_complete\([^]*?\n\{/u, 'v4l2_async_notifier_try_complete()'],
    [/static int v4l2_async_match_notify\([^]*?\n\{/u, 'v4l2_async_match_notify()'],
    [/static int v4l2_async_notifier_try_all_subdevs\([^]*?\n\{/u, 'v4l2_async_notifier_try_all_subdevs()'],
    [/static int __v4l2_async_notifier_register\([^]*?\n\{/u, '__v4l2_async_notifier_register()'],
    [/int v4l2_async_notifier_register\([^]*?\n\{/u, 'v4l2_async_notifier_register()'],
    [/int v4l2_async_subdev_notifier_register\([^]*?\n\{/u, 'v4l2_async_subdev_notifier_register()'],
    [/int v4l2_async_register_subdev\([^]*?\n\{/u, 'v4l2_async_register_subdev()'],
    [/void v4l2_async_unregister_subdev\([^]*?\n\{/u, 'v4l2_async_unregister_subdev()'],
  ]) {
    assertStageCommentBefore(source, pattern, label);
  }

  for (const statement of [
    'INIT_LIST_HEAD(&notifier->waiting);',
    'INIT_LIST_HEAD(&notifier->done);',
    'list_add_tail(&asd->list, &notifier->waiting);',
    'return n->ops->bound(n, subdev, asd);',
    'ret = v4l2_async_notifier_call_bound(notifier, sd, asd);',
    'list_del(&asd->list);',
    'sd->asd = asd;',
    'list_move(&sd->async_list, &notifier->done);',
    'return n->ops->complete(n);',
    'return v4l2_async_notifier_call_complete(notifier);',
    'list_add(&notifier->list, &notifier_list);',
    'list_add(&sd->async_list, &subdev_list);',
  ]) {
    assertStageCommentBefore(source, statement, statement, 600);
  }
});

test('stage 06 chapters explain object construction, async roles and evidence limits', () => {
  const chapters = fs.readdirSync(stageRoot)
    .filter((name) => name.endsWith('.md'))
    .sort();
  assert.deepEqual(chapters, [
    '00-源码陪读索引.md',
    '01-生命周期.md',
    '02-对象与数据链.md',
    '03-调试与面试验收.md',
  ]);

  const content = chapters
    .map((name) => readFile(path.join(stageRoot, name)))
    .join('\n');

  for (const required of [
    'struct media_device',
    'struct media_entity',
    'struct media_pad',
    'struct media_link',
    'media_entity_pads_init',
    'media_create_pad_link',
    'waiting',
    'done',
    'subdev_list',
    'notifier_list',
    '谁先注册都能匹配',
    'match_notify',
    '.bound',
    '.complete',
    '直接调用',
    '函数指针赋值',
    '框架回调',
    '对象关联',
    'Sensor helper',
    'D-PHY endpoint notifier',
    '能证明',
    '不能证明',
  ]) {
    assert.match(content, new RegExp(escapeRegExp(required), 'u'), `阶段 06 文档缺少：${required}`);
  }
});
