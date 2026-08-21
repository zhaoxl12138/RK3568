import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const kernelRoot = process.env.RK3568_ANNOTATED_KERNEL
  ?? 'E:/sourceInsight/rk3568_linux_4.19_kernel/kernel';

function readSource(relativePath) {
  const filePath = `${kernelRoot}/${relativePath}`;
  assert.equal(fs.existsSync(filePath), true, `源码文件不存在：${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertStageCommentBeforeSymbol(source, symbol) {
  const symbolPosition = source.indexOf(symbol);
  assert.ok(symbolPosition >= 0, `源码中找不到符号：${symbol}`);
  const context = source.slice(Math.max(0, symbolPosition - 700), symbolPosition);
  assert.match(context, /\[源码陪读 05\]/u, `${symbol} 前缺少 [源码陪读 05] 注释`);
}

test('stage 05 annotations cover the complete IMX415 subdev lifecycle', () => {
  const source = readSource('drivers/media/i2c/imx415.c');
  const requiredSymbols = [
    'imx415_set_fmt(',
    'imx415_get_fmt(',
    'imx415_enum_mbus_code(',
    '__imx415_start_stream(',
    '__imx415_stop_stream(',
    'imx415_s_stream(',
    'imx415_runtime_resume(',
    'imx415_runtime_suspend(',
    'imx415_video_ops =',
    'imx415_pad_ops =',
    'imx415_subdev_ops =',
    'imx415_set_ctrl(',
    'imx415_ctrl_ops =',
    'imx415_initialize_controls(',
    'imx415_remove(',
    'imx415_of_match[]',
    'imx415_i2c_driver =',
    'sensor_mod_init(',
    'sensor_mod_exit(',
  ];

  for (const symbol of requiredSymbols) assertStageCommentBeforeSymbol(source, symbol);

  for (const concept of ['函数指针赋值', '框架回调', '直接调用', '对象关联']) {
    assert.match(source, new RegExp(`\\[源码陪读 05\\][^]*?${concept}`, 'u'), `缺少概念注释：${concept}`);
  }
});

test('stage 05 annotations explain the generic I2C-to-subdev assembly helpers', () => {
  const commonSource = readSource('drivers/media/v4l2-core/v4l2-common.c');
  const subdevSource = readSource('drivers/media/v4l2-core/v4l2-subdev.c');
  assertStageCommentBeforeSymbol(commonSource, 'v4l2_i2c_subdev_init(');
  assertStageCommentBeforeSymbol(subdevSource, 'v4l2_subdev_init(');
  assert.match(subdevSource, /\[源码陪读 05\][^]*?sd->ops\s*=\s*ops/u);
  assert.match(commonSource, /\[源码陪读 05\][^]*?i2c_set_clientdata/u);
  assert.match(commonSource, /\[源码陪读 05\][^]*?v4l2_set_subdevdata/u);
});

test('stage 05 object-and-data chapter uses real IMX415 code and explains state changes', () => {
  const chapter = fs.readFileSync(
    'E:/obsidian_github/RK3568/02-源码陪读/05-V4L2-Subdev/02-对象与数据链.md',
    'utf8',
  );

  for (const required of [
    'imx415_find_best_fit(imx415, fmt)',
    'V4L2_SUBDEV_FORMAT_TRY',
    'imx415_change_mode(imx415, mode)',
    'pm_runtime_get_if_in_use',
    'IMX415_LF_EXPO_REG_L',
    '__v4l2_ctrl_handler_setup',
    'IMX415_REG_CTRL_MODE',
    '为什么这样设计',
    '这一步改变了什么',
    '能证明',
    '不能证明',
  ]) {
    assert.match(chapter, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }

  assert.doesNotMatch(chapter, /IMX415_REG_EXPOSURE|IMX415_REG_GAIN/u);
});

test('stage 05 diagnostic chapter uses five gates instead of flat command lists', () => {
  const chapter = fs.readFileSync(
    'E:/obsidian_github/RK3568/02-源码陪读/05-V4L2-Subdev/03-调试与面试验收.md',
    'utf8',
  );

  for (const required of [
    '五道门诊断法',
    'Gate 1：I2C probe',
    'Gate 2：Subdev 对象组装',
    'Gate 3：Entity 与 Source Pad',
    'Gate 4：Async 匹配与 Media Link',
    'Gate 5：开流与真实帧',
    '第一处失败',
    '日志/断点',
    '不能继续推断',
    '__imx415_start_stream',
  ]) {
    assert.match(chapter, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
});
