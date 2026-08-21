import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = path.join(repoRoot, '02-源码陪读', '05-V4L2-Subdev');
const indexPath = path.join(sourceDir, '00-源码陪读索引.md');
const chapterPath = path.join(sourceDir, '01-生命周期.md');

function readRequired(filePath, label) {
  assert.equal(fs.existsSync(filePath), true, `${label} must exist: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

test('stage 05 progress is synchronized across source-reading notes and course map', () => {
  const stage04 = readRequired(path.join(repoRoot, '01-课程主线', '04-MIPI-CSI2-DPHY.md'), 'stage 04 note');
  const stage05 = readRequired(path.join(repoRoot, '01-课程主线', '05-V4L2-Subdev.md'), 'stage 05 note');
  const taskBoard = readRequired(path.join(repoRoot, '06-任务', '01-下一步任务看板.md'), 'task board');
  const courseMap = JSON.parse(readRequired(path.join(repoRoot, '00-首页', 'course-map.json'), 'course map'));
  const map04 = courseMap.stages.find(({ id }) => id === '04');
  const map05 = courseMap.stages.find(({ id }) => id === '05');

  assert.equal(fs.existsSync(path.join(repoRoot, '00-首页', '00-当前学习状态.md')), false);
  assert.equal(courseMap.currentStage, '05');
  assert.match(stage04, /^learning-status:\s*understood\s*$/mu);
  assert.match(stage05, /^learning-status:\s*in-progress\s*$/mu);
  assert.match(stage05, /\[\[02-源码陪读\/05-V4L2-Subdev\/00-源码陪读索引/u);
  assert.match(taskBoard, /阶段 05：V4L2 Subdev/u);
  assert.equal(map04.maturity, 'validated');
  assert.equal(map05.maturity, 'in-progress');
  assert.equal(map05.sourcePath, '01-课程主线/05-V4L2-Subdev.md');
});

test('stage 05 source reading starts from one compact index and one real first chapter', () => {
  const index = readRequired(indexPath, 'stage 05 source-reading index');
  const chapter = readRequired(chapterPath, 'stage 05 first source-reading chapter');

  assert.match(index, /^doc-type:\s*source-reading\s*$/mu);
  assert.match(index, /^course-stage:\s*["']05["']\s*$/mu);
  assert.match(index, /^learning-status:\s*in-progress\s*$/mu);
  assert.match(index, /\[\[02-源码陪读\/05-V4L2-Subdev\/01-生命周期(?:\||\]\])/u);
  assert.match(index, /drivers\/media\/i2c\/imx415\.c/u);
  assert.match(index, /sensor_mod_init/u);
  assert.match(index, /imx415_probe/u);
  assert.match(index, /v4l2_i2c_subdev_init/u);
  assert.match(index, /imx415_subdev_ops/u);
  assert.match(index, /v4l2_async_register_subdev_sensor_common/u);

  assert.match(chapter, /\[\[02-源码陪读\/05-V4L2-Subdev\/00-源码陪读索引/u);
  assert.match(chapter, /device_initcall_sync\(sensor_mod_init\)/u);
  assert.match(chapter, /i2c_add_driver\(&imx415_i2c_driver\)/u);
  assert.match(chapter, /v4l2_i2c_subdev_init\(sd, client, &imx415_subdev_ops\)/u);
  assert.match(chapter, /media_entity_pads_init/u);
  assert.match(chapter, /v4l2_async_register_subdev_sensor_common/u);
  assert.match(chapter, /注册.*不.*调用.*probe/su);
  assert.match(chapter, /init.*不等于.*register/su);
  assert.match(chapter, /我的回答/u);
  assert.match(chapter, /高亮正确答案/u);
});

test('stage 05 HTML has correct 04 previous and 06 next course fallbacks', () => {
  const html = readRequired(path.join(repoRoot, '04-项目', '19-IMX415-v4l2-subdev注册与开流.html'), 'stage 05 HTML');

  assert.match(html, /上一阶段：D-PHY 与 Media Graph/u);
  assert.match(html, /返回完整学习路线/u);
  assert.match(html, /下一阶段：Media Controller/u);
  assert.doesNotMatch(html, /后续：D-PHY 与 Media Graph/u);
});
