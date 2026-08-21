import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dphyDir = path.join(repoRoot, '02-源码陪读', '04-DPHY');
const indexPath = path.join(dphyDir, '00-源码陪读索引.md');
const moduleNames = [
  '01-生命周期.md',
  '02-对象与数据链.md',
  '03-调试与面试验收.md',
];
const modulePaths = moduleNames.map((name) => path.join(dphyDir, name));

function readRequired(filePath, label) {
  assert.equal(fs.existsSync(filePath), true, `${label} must exist: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

test('D-PHY source reading is split into a compact index and three linked canonical modules', () => {
  const index = readRequired(indexPath, 'source-reading index');
  assert.ok(index.split(/\r?\n/u).length <= 300, 'source-reading index must stay within 300 lines');

  for (const [position, modulePath] of modulePaths.entries()) {
    const module = readRequired(modulePath, `lifecycle module ${position + 1}`);
    const basename = path.basename(modulePath, '.md');
    assert.match(index, new RegExp(`\\[\\[02-源码陪读/04-DPHY/${basename}(?:\\||\\]\\])`, 'u'), `index must link to ${basename}`);
    assert.match(module, /\[\[02-源码陪读\/04-DPHY\/00-源码陪读索引(?:\|[^\]]+)?\]\]/u, `${basename} must link back to the index`);
  }
});

test('D-PHY lifecycle modules preserve the complete registration-to-media-link call chain', () => {
  const corpus = [indexPath, ...modulePaths].map((filePath) => readRequired(filePath, path.basename(filePath))).join('\n');
  const callChain = [
    'module_platform_driver',
    'rockchip_csi2_dphy_hw_probe',
    'platform_driver_register',
    'rockchip_csi2_dphy_probe',
    'rockchip_csi2_dphy_attach_hw',
    'v4l2_subdev_init',
    'rockchip_csi2dphy_media_init',
    'media_entity_pads_init',
    'v4l2_async_notifier_parse_fwnode_endpoints_by_port',
    'v4l2_async_subdev_notifier_register',
    '.bound',
    'media_create_pad_link',
  ];

  let previous = -1;
  for (const name of callChain) {
    const position = corpus.indexOf(name, previous + 1);
    assert.ok(position > previous, `missing or out-of-order call-chain item: ${name}`);
    previous = position;
  }
});

test('D-PHY lifecycle modules retain the source baseline, Source Insight boundary, and fixed function cards', () => {
  const index = readRequired(indexPath, 'source-reading index');
  assert.match(index, /web-publish:\s*false/u);
  assert.match(index, /learning-status:\s*understood/u);
  assert.match(index, /drivers\/phy\/rockchip\/phy-rockchip-csi2-dphy\.c/u);
  assert.match(index, /Linux 4\.19/u);
  assert.match(index, /Source Insight/u);
  assert.match(index, /学习副本/u);
  assert.match(index, /WSL SDK/u);
  assert.match(index, /Git commit/u);
  assert.match(index, /编译事实源/u);

  const cardFields = [
    '函数属于哪一层',
    '谁调用',
    '参数从哪里来',
    '读取什么',
    '修改哪个结构体',
    'DTS 对应',
    '运行时证据',
    '失败时下一检查点',
    '面试一句话',
  ];
  for (const modulePath of modulePaths) {
    const module = readRequired(modulePath, path.basename(modulePath));
    for (const field of cardFields) {
      assert.match(module, new RegExp(field, 'u'), `${path.basename(modulePath)} missing function-card field: ${field}`);
    }
  }
});

test('chapter 03 diagnoses this learner before interview and debugging acceptance', () => {
  const chapter06 = readRequired(modulePaths[2], 'chapter 03 diagnostic acceptance');
  const requiredDiagnostics = [
    '我的薄弱点',
    '箭头类型',
    'waiting',
    'done',
    '对象关系验收',
    '误区诊断',
    '最早缺失的证据',
    '30 秒表达',
    '2 分钟表达',
    '回看路由',
  ];

  for (const marker of requiredDiagnostics) {
    assert.match(chapter06, new RegExp(marker, 'u'), `chapter 06 missing diagnostic marker: ${marker}`);
  }

  const requiredBoundaries = [
    '函数指针赋值不是调用',
    'DTS.*不是调用',
    'Async.*不阻塞',
    'pads_init.*不.*link',
    '\\[ENABLED\\].*不.*出帧',
    'Sensor ID.*不.*MIPI',
  ];

  for (const boundary of requiredBoundaries) {
    assert.match(chapter06, new RegExp(boundary, 'u'), `chapter 06 missing boundary: ${boundary}`);
  }
});
