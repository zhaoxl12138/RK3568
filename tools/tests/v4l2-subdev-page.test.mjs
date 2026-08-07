import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const vaultRoot = path.resolve(import.meta.dirname, '../..');
const projectDir = path.join(vaultRoot, '04-项目');
const pagePath = path.join(projectDir, '19-IMX415-v4l2-subdev注册与开流.html');
const mainlinePath = path.join(projectDir, '18-RK3568-Camera从DTS到videoX真实启动时序.html');

test('v4l2 subdev learning page covers registration and streaming', async () => {
  const html = await readFile(pagePath, 'utf8');

  assert.match(html, /<meta charset=["']UTF-8["']>/iu);
  assert.match(html, /v4l2_subdev/iu);
  assert.match(html, /v4l2_i2c_subdev_init/iu);
  assert.match(html, /media_entity_pads_init/iu);
  assert.match(html, /v4l2_async_register_subdev_sensor_common/iu);
  assert.match(html, /imx415_s_stream/iu);
  assert.match(html, /\/dev\/v4l-subdev3/iu);
  assert.match(html, /\/dev\/video0/iu);
  assert.match(html, /<svg\b/iu);
  assert.match(html, /18-RK3568-Camera从DTS到videoX真实启动时序\.html/iu);
  assert.doesNotMatch(html, /\uFFFD/u);
});

test('camera startup mainline links to the v4l2 subdev chapter', async () => {
  const html = await readFile(mainlinePath, 'utf8');
  assert.match(html, /19-IMX415-v4l2-subdev注册与开流\.html/iu);
});

test('v4l2 subdev page prioritizes the key IMX415 function map', async () => {
  const html = await readFile(pagePath, 'utf8');

  assert.match(html, /id=["']function-map["']/iu);
  assert.match(html, /三个“注册”不要混/iu);
  assert.match(html, /sensor_mod_init/iu);
  assert.match(html, /i2c_add_driver/iu);
  assert.match(html, /imx415_i2c_driver/iu);
  assert.match(html, /imx415_probe/iu);
  assert.match(html, /__imx415_power_on/iu);
  assert.match(html, /imx415_check_sensor_id/iu);
  assert.match(html, /imx415_set_fmt/iu);
  assert.match(html, /imx415_set_ctrl/iu);
  assert.match(html, /imx415_s_stream/iu);
  assert.match(html, /当前必须掌握/iu);
  assert.match(html, /暂时不追/iu);
  assert.ok((html.match(/<details\b[^>]*class=["'][^"']*deep-dive/giu) ?? []).length >= 2);
});

test('key functions are organized as a lifecycle mind map with a secondary index', async () => {
  const html = await readFile(pagePath, 'utf8');

  assert.match(html, /id=["']function-mindmap["']/iu);
  assert.match(html, /IMX415 驱动生命周期/iu);
  assert.match(html, /驱动注册/iu);
  assert.match(html, /匹配与 probe/iu);
  assert.match(html, /V4L2 \/ Media 注册/iu);
  assert.match(html, /运行期控制与开流/iu);
  assert.ok((html.match(/class=["'][^"']*mind-branch\b/giu) ?? []).length >= 4);
  assert.match(html, /<details\b[^>]*class=["'][^"']*function-index/iu);
  assert.match(html, /实线：真实执行顺序或函数调用/iu);
  assert.match(html, /虚线：结构体保存的回调关系/iu);
});

test('page distinguishes registered framework entries from internal helpers', async () => {
  const html = await readFile(pagePath, 'utf8');

  assert.match(html, /id=["']framework-entries["']/iu);
  assert.match(html, /对外入口与内部函数/iu);
  assert.match(html, /I2C Driver 入口/iu);
  assert.match(html, /V4L2 subdev_ops/iu);
  assert.match(html, /V4L2 ctrl_ops/iu);
  assert.match(html, /imx415_probe/iu);
  assert.match(html, /imx415_set_fmt/iu);
  assert.match(html, /imx415_s_stream/iu);
  assert.match(html, /imx415_set_ctrl/iu);
  assert.match(html, /内部函数不需要注册/iu);
});
