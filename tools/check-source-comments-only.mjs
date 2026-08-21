import fs from 'node:fs';
import path from 'node:path';

const annotatedRoot = process.env.RK3568_ANNOTATED_KERNEL
  ?? 'E:/sourceInsight/rk3568_linux_4.19_kernel/kernel';
const baselineRoot = process.env.RK3568_BASELINE_KERNEL
  ?? '//wsl.localhost/Ubuntu-20.04/home/rk3568/work/rk3568_linux_sdk/kernel';

const files = [
  'drivers/base/bus.c',
  'drivers/base/dd.c',
  'drivers/base/platform.c',
  'drivers/of/platform.c',
  'drivers/i2c/i2c-core-of.c',
  'drivers/i2c/i2c-core-base.c',
  'drivers/media/i2c/imx415.c',
  'drivers/phy/rockchip/phy-rockchip-csi2-dphy-hw.c',
  'drivers/phy/rockchip/phy-rockchip-csi2-dphy.c',
  'drivers/media/v4l2-core/v4l2-common.c',
  'drivers/media/v4l2-core/v4l2-subdev.c',
  'drivers/media/v4l2-core/v4l2-fwnode.c',
  'drivers/media/media-entity.c',
  'drivers/media/v4l2-core/v4l2-async.c',
  'drivers/media/platform/rockchip/isp/hw.c',
  'drivers/media/platform/rockchip/isp/dev.c',
  'drivers/media/platform/rockchip/isp/csi.c',
  'drivers/media/platform/rockchip/isp/rkisp.c',
  'drivers/media/platform/rockchip/isp/capture.c',
  'drivers/media/platform/rockchip/isp/capture_v21.c',
  'drivers/media/v4l2-core/v4l2-ioctl.c',
  'drivers/media/common/videobuf2/videobuf2-v4l2.c',
  'drivers/media/common/videobuf2/videobuf2-core.c',
];

function codeWithoutCommentsOrWhitespace(source) {
  let result = '';
  let state = 'code';
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (current === '\n') state = 'code';
      continue;
    }

    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        state = 'code';
        index += 1;
      }
      continue;
    }

    if (state === 'string' || state === 'character') {
      result += current;
      if (escaped) {
        escaped = false;
      } else if (current === '\\') {
        escaped = true;
      } else if ((state === 'string' && current === '"')
        || (state === 'character' && current === "'")) {
        state = 'code';
      }
      continue;
    }

    if (current === '/' && next === '/') {
      state = 'line-comment';
      index += 1;
    } else if (current === '/' && next === '*') {
      state = 'block-comment';
      index += 1;
    } else if (current === '"') {
      state = 'string';
      result += current;
    } else if (current === "'") {
      state = 'character';
      result += current;
    } else if (!/\s/u.test(current)) {
      result += current;
    }
  }

  if (state === 'block-comment' || state === 'string' || state === 'character') {
    throw new Error(`源码词法状态未闭合：${state}`);
  }
  return result;
}

const failures = [];
for (const relativePath of files) {
  const annotatedPath = path.join(annotatedRoot, relativePath);
  const baselinePath = path.join(baselineRoot, relativePath);
  if (!fs.existsSync(annotatedPath) || !fs.existsSync(baselinePath)) {
    failures.push(`${relativePath}: 文件不存在`);
    continue;
  }

  const annotated = codeWithoutCommentsOrWhitespace(fs.readFileSync(annotatedPath, 'utf8'));
  const baseline = codeWithoutCommentsOrWhitespace(fs.readFileSync(baselinePath, 'utf8'));
  if (annotated !== baseline) failures.push(`${relativePath}: 存在注释/空白以外的差异`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Source Insight 学习副本验收通过：${files.length} 个文件只有注释或空白差异。`);
}
