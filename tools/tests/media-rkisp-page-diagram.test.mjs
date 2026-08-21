import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const vaultRoot = path.resolve(import.meta.dirname, "../..");

async function readPage(fileName) {
  return readFile(path.join(vaultRoot, "04-项目", fileName), "utf8");
}

test("Media Controller 原页面保留课程入口，并拆开 Async 调用与证据边界", async () => {
  const html = await readPage("21-MediaController-Entity-Pad-Link.html");

  for (const required of [
    "06-Media-Controller",
    "22-RKISP-从RAW到VideoNode.html",
    "v4l2_async_match_notify",
    "rockchip_csi2_dphy_notifier_bound",
    "media_entity_pads_init",
    "media_create_pad_link",
    "notifier.waiting",
    "[ENABLED]",
    "不能证明",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }

  assert.ok(
    (html.match(/<svg\b/giu) ?? []).length >= 3,
    "原页面应有总览和两张分层图",
  );
  assert.doesNotMatch(
    html,
    /overflow:\s*(auto|scroll)/iu,
    "页面不能依赖内部滚动框阅读流程图",
  );
});

test("RKISP 原页面明确两次 Platform 回调、对象桥和取帧证据", async () => {
  const html = await readPage("22-RKISP-从RAW到VideoNode.html");

  for (const required of [
    "07-RKISP",
    "21-MediaController-Entity-Pad-Link.html",
    "23-V4L2-VB2用户态取流.html",
    "rkisp_hw_drv_init",
    "rkisp_hw_probe",
    "rkisp_plat_probe",
    "rockchip,hw",
    "platform_get_drvdata",
    "rkisp_attach_hw",
    "video_register_device",
    "SGBRG10_1X10",
    "YUYV8_2X8",
    "NV12",
    "VIDIOC_STREAMON",
    "VIDIOC_DQBUF",
    "不是 HW probe",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }

  assert.ok(
    (html.match(/<svg\b/giu) ?? []).length >= 3,
    "原页面应有总览和两张分层图",
  );
  assert.doesNotMatch(
    html,
    /overflow:\s*(auto|scroll)/iu,
    "页面不能依赖内部滚动框阅读流程图",
  );
});

test("RKISP 总览图直接说明两条初始化分支从哪里产生并在哪里汇合", async () => {
  const html = await readPage("22-RKISP-从RAW到VideoNode.html");

  for (const required of [
    'id="overview-common-entry"',
    'id="overview-branch-hw"',
    'id="overview-branch-logic"',
    "共同入口：rkisp_hw_drv_init()",
    "分支 A：共享 HW 资源初始化",
    "分支 B：逻辑 Camera 管线初始化",
    "platform_driver_register(&amp;rkisp_hw_drv)",
    "platform_driver_register(&amp;rkisp_plat_drv)",
    "Platform 总线框架分别匹配两个 platform_device",
    "两个 probe 是独立框架回调，不是相互调用",
    "struct rkisp_hw_dev",
    "struct rkisp_device",
    "platform_get_drvdata",
    "isp_dev-&gt;hw_dev = hw_dev",
    "/dev/videoX 可能先于 Async complete 出现",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }
});

test("RKISP 原页面提供五图阅读顺序和完整 Async 建链图", async () => {
  const html = await readPage("22-RKISP-从RAW到VideoNode.html");

  for (const id of [
    "rkisp-overview",
    "rkisp-lifecycle",
    "rkisp-data-path",
    "rkisp-async-links",
    "rkisp-streaming",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`, "u"));
    assert.match(html, new RegExp(`href=["']#${id}["']`, "u"));
  }

  for (const required of [
    "v4l2_async_register_subdev",
    "subdev_notifier_bound",
    "subdev_notifier_complete",
    "rkisp_create_links",
    "bound：收集一个外部 subdev",
    "complete：所有目标到齐",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }

  assert.ok(
    (html.match(/<svg\b/giu) ?? []).length >= 5,
    "RKISP 原页面应包含五张分层图",
  );
});

test("RKISP 原页面展示 STREAMON 反向启动和 DQBUF 回帧闭环", async () => {
  const html = await readPage("22-RKISP-从RAW到VideoNode.html");

  for (const required of [
    "rkisp_v4l2_ioctl_ops",
    "vb2_ioctl_streamon",
    "rkisp_vb2_ops",
    "rkisp_start_streaming",
    "rkisp_stream_start",
    "pipe.set_stream(true)",
    "rkisp_pipeline_set_stream",
    "v4l2_subdev_call",
    "vb2_buffer_done",
    "VIDIOC_DQBUF",
    "STREAMON 返回 0 不等于已有帧",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }
});

test("RKISP 开流图按 v2.1 源码串行展示本地 DMA 准备后再启动上游 subdev", async () => {
  const html = await readPage("22-RKISP-从RAW到VideoNode.html");

  for (const required of [
    'id="stream-local-ready"',
    'id="stream-upstream-start"',
    "串行顺序：先准备本地采集，再启动上游",
    "先配置 MI / resize / DMA",
    "返回后才执行 pipe.set_stream(true)",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }

  assert.match(
    html,
    /M1101 270V330M1211 389H1314M1424 448V482/u,
    "控制箭头必须由 rkisp_start_streaming 先到本地采集准备，再到 pipeline 与上游 subdev",
  );
});

test("RKISP 初始化图区分两个 platform 匹配、内部注册顺序与 Async 建链后的数据方向", async () => {
  const html = await readPage("22-RKISP-从RAW到VideoNode.html");

  for (const required of [
    "compatible: rockchip,rkisp-vir",
    "ISP subdev → CSI subdev → bridge",
    "→ stream vdevs → notifier",
    "D-PHY Source Pad",
    "RKISP CSI Sink Pad",
    "RKISP ISP Sink Pad",
    "不是对 rkisp_create_links() 的函数调用",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }

  assert.doesNotMatch(html, /compatible: rockchip,rk3568-rkisp-vir/u);
  assert.doesNotMatch(html, /M277 604C315 604 305 353 347 353/u);
});

test("阶段 08 用三张图区分挂表、取流闭环与单 buffer 状态机", async () => {
  const html = await readPage("23-V4L2-VB2用户态取流.html");

  for (const id of [
    "v4l2-registration",
    "v4l2-streaming",
    "v4l2-buffer-state",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`, "u"));
  }

  for (const required of [
    "vdev-&gt;fops = &amp;rkisp_fops",
    "vdev-&gt;ioctl_ops = &amp;rkisp_v4l2_ioctl_ops",
    "vdev-&gt;queue = &amp;node-&gt;buf_queue",
    "DEQUEUED",
    "PREPARED",
    "QUEUED",
    "ACTIVE",
    "DONE",
    "ERROR",
    "vb2_buffer_done(DONE)",
    "STREAMON 返回 0 不等于已有帧",
  ]) {
    assert.match(
      html,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }

  assert.doesNotMatch(
    html,
    /overflow:\s*(auto|scroll)/iu,
    "阶段 08 不应依赖内部滚动框阅读流程图",
  );

  assert.match(html, /id=["']registration-plain-language["']/u);
  assert.doesNotMatch(
    html,
    /<text[^>]*>白话：注册期只把/u,
    "图 1 的长白话说明不应横跨 SVG 泳道",
  );
  assert.match(html, /id=["']stream-control-flow["']/u);
  assert.match(
    html,
    /id=["']stream-frame-completion["'][^>]*transform=["']translate\(0 8\d\d\)["']/u,
    "图 2 的完成链必须移动到控制流下方的独立区域",
  );
  assert.match(html, /id=["']arrow-control-2["']/u);
  assert.match(html, /id=["']arrow-data-2["']/u);
  assert.match(html, /marker-end=["']url\(#arrow-control-2\)["']/u);
  assert.match(html, /marker-end=["']url\(#arrow-data-2\)["']/u);
  assert.match(html, /\.nt\{[^}]*font-size:(1[6-9]|[2-9]\d)px/u);
  assert.match(html, /\.ns\{[^}]*font-size:(1[3-9]|[2-9]\d)px/u);
});
