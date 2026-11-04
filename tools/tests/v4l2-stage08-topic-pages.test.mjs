import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const vaultRoot = path.resolve(testDir, "../..");
const projectDir = path.join(vaultRoot, "04-项目");
const narrowMediaContract = /@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{\s*\.diagram\s*\{\s*display\s*:\s*none\s*;?\s*\}\s*\.mobile-flow\s*\{\s*display\s*:\s*grid\s*;?[^{}]*\}\s*\}/iu;

const topicPages = [
  {
    fileName: "24-V4L2用户程序初始化与Buffer映射.html",
    title: "初始化与 Buffer 映射",
  },
  {
    fileName: "25-V4L2-QBUF到DQBUF取流闭环.html",
    title: "QBUF 到 DQBUF",
  },
  {
    fileName: "26-V4L2连续100帧统计与资源清理.html",
    title: "连续 100 帧",
  },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function assertContains(content, expected, message) {
  assert.match(
    content,
    new RegExp(escapeRegex(expected), "u"),
    message ?? `应包含 ${expected}`,
  );
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//gu, "");
}

function assertLinkTo(html, href, message) {
  const uncommentedHtml = html.replace(/<!--[\s\S]*?-->/gu, "");
  const linkPattern = new RegExp(
    `<a(?=[\\s/>])[^>]*\\shref\\s*=\\s*(["'])${escapeRegex(href)}\\1[^>]*>`,
    "iu",
  );
  assert.ok(
    linkPattern.test(uncommentedHtml),
    message ?? `应包含指向 ${href} 的链接`,
  );
}

function hasSvgEdgeClass(html, edgeType) {
  const uncommentedHtml = html.replace(/<!--[\s\S]*?-->/gu, "");
  const edgeElements =
    uncommentedHtml.match(/<(?:path|line|polyline)(?=[\s/>])[^>]*>/giu) ?? [];

  return edgeElements.some((element) => {
    const classAttribute = /\sclass\s*=\s*(["'])([^"']*)\1/iu.exec(element);
    if (!classAttribute) return false;

    const classTokens = classAttribute[2].trim().split(/\s+/u).filter(Boolean);
    return classTokens.includes("edge") && classTokens.includes(edgeType);
  });
}

async function readUtf8(relativePath) {
  const absolutePath = path.join(projectDir, relativePath);
  let bytes;

  try {
    bytes = await readFile(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail(`缺少阶段08专题文件：04-项目/${relativePath}`);
    }
    throw error;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    assert.fail(`阶段08专题文件不是有效 UTF-8：04-项目/${relativePath}`);
  }
}

async function readPage(fileName) {
  return readUtf8(fileName);
}

test("测试辅助契约拒绝注释链接、连字符 edge class 和 media 外部规则", () => {
  assertLinkTo(
    '<a class="topic" href="24.html">专题 24</a>',
    "24.html",
    "真实专题链接应通过",
  );
  assert.throws(
    () =>
      assertLinkTo(
        '<!-- <a href="24.html">已注释入口</a> -->',
        "24.html",
        "注释链接不得通过",
      ),
    /注释链接不得通过/u,
  );

  assert.equal(
    hasSvgEdgeClass('<path class="direct highlighted edge" />', "direct"),
    true,
    "同一 class 属性中的独立 edge 和 direct token 应通过",
  );
  assert.equal(
    hasSvgEdgeClass('<path class="edge-direct highlighted" />', "direct"),
    false,
    "edge-direct 不能冒充 edge 与 direct 两个 token",
  );

  assert.match(
    stripCssComments(
      "@media (max-width: 768px) { .diagram { display: none; } .mobile-flow { display: grid; gap: 10px; } }",
    ),
    narrowMediaContract,
    "正确闭合的 media 及两条窄屏规则应通过",
  );
  assert.doesNotMatch(
    stripCssComments(
      "/* @media (max-width: 768px) { .diagram { display: none; } .mobile-flow { display: grid; } } */",
    ),
    narrowMediaContract,
    "仅在 CSS 注释中的完整规则不能通过",
  );
  assert.doesNotMatch(
    stripCssComments(
      "@media (max-width: 768px) { .diagram { display: none; } .mobile-flow { display: grid; }",
    ),
    narrowMediaContract,
    "未闭合的 media 不能通过",
  );
  assert.doesNotMatch(
    stripCssComments(
      ".diagram { display: none; } .mobile-flow { display: grid; } @media (max-width: 768px) { body { color: white; } }",
    ),
    narrowMediaContract,
    "media query 外部的同名规则不能通过",
  );
});

test("阶段08三个专题页存在、使用有效 UTF-8、标题正确并引用共享 CSS", async () => {
  for (const { fileName, title } of topicPages) {
    const html = await readPage(fileName);

    assert.match(html, /<!doctype html>/iu, `${fileName} 应是 HTML5 文档`);
    assert.match(
      html,
      /<meta\b[^>]*charset\s*=\s*["']?utf-8["']?[^>]*>/iu,
      `${fileName} 应声明 UTF-8 charset`,
    );
    assert.match(
      html,
      new RegExp(`<title>[^<]*${escapeRegex(title)}[^<]*</title>`, "iu"),
      `${fileName} 的 title 应包含“${title}”`,
    );
    assert.match(
      html,
      /<link\b[^>]*href=["']assets\/v4l2-callgraph\.css["'][^>]*>/iu,
      `${fileName} 应引用共享 CSS`,
    );
  }
});

test("阶段08专题导航按 23→24→25→26 连续衔接并可返回总览", async () => {
  const overview = await readPage("23-V4L2-VB2用户态取流.html");
  const page24 = await readPage(topicPages[0].fileName);
  const page25 = await readPage(topicPages[1].fileName);
  const page26 = await readPage(topicPages[2].fileName);

  assertLinkTo(overview, topicPages[0].fileName, "总览页应链接到专题 24");
  assertLinkTo(page24, "23-V4L2-VB2用户态取流.html", "专题 24 应链接回总览");
  assertLinkTo(page24, topicPages[1].fileName, "专题 24 应链接到专题 25");
  assertLinkTo(page25, topicPages[0].fileName, "专题 25 应链接回专题 24");
  assertLinkTo(page25, topicPages[2].fileName, "专题 25 应链接到专题 26");
  assertLinkTo(page26, topicPages[1].fileName, "专题 26 应链接回专题 25");
  assertLinkTo(page26, "23-V4L2-VB2用户态取流.html", "专题 26 应链接回总览");
});

test("每个阶段08专题页区分直接调用、框架回调、数据流或 Buffer 所有权", async () => {
  for (const { fileName } of topicPages) {
    const html = await readPage(fileName);

    assertContains(html, "直接调用", `${fileName} 应解释直接调用`);
    assertContains(html, "框架回调", `${fileName} 应解释框架回调`);
    assert.match(
      html,
      /数据流|Buffer\s*所有权/u,
      `${fileName} 应解释数据流或 Buffer 所有权`,
    );
    assert.match(html, /<svg\b/iu, `${fileName} 应提供桌面端 SVG`);
    for (const edgeType of ["direct", "callback", "data"]) {
      assert.ok(
        hasSvgEdgeClass(html, edgeType),
        `${fileName} 的 SVG 应包含 edge ${edgeType} 边`,
      );
    }
    assert.match(
      html,
      /class=["'][^"']*\bmobile-flow\b[^"']*["']/iu,
      `${fileName} 应提供 mobile-flow`,
    );
    assert.doesNotMatch(
      html,
      /overflow(?:-x|-y)?\s*:\s*(?:auto|scroll)/iu,
      `${fileName} 不得声明内部滚动`,
    );
  }
});

test("专题 24 锁定初始化、ioctl 分发和 Buffer 映射函数链", async () => {
  const html = await readPage(topicPages[0].fileName);

  for (const symbol of [
    "set_format()",
    "request_buffers()",
    "map_buffers()",
    "VIDIOC_S_FMT",
    "VIDIOC_REQBUFS",
    "VIDIOC_QUERYBUF",
    "video_ioctl2()",
    "__video_do_ioctl()",
    "rkisp_s_fmt_vid_cap_mplane()",
    "mmap()",
  ]) {
    assertContains(html, symbol, `专题 24 应包含 ${symbol}`);
  }
});

test("专题 25 锁定 QBUF、STREAMON、IRQ 完成到 DQBUF 的取流闭环", async () => {
  const html = await readPage(topicPages[1].fileName);

  for (const symbol of [
    "queue_all_buffers()",
    "queue_one_buffer()",
    "start_streaming()",
    "capture_frames()",
    "poll()",
    "VIDIOC_DQBUF",
    "vb2_ioctl_streamon()",
    "vb2_core_streamon()",
    "rkisp_start_streaming()",
    "rkisp_mi_v21_isr()",
    "vb2_buffer_done(DONE)",
  ]) {
    assertContains(html, symbol, `专题 25 应包含 ${symbol}`);
  }
});

test("专题 26 锁定真实 100 帧证据、统计异常和逆序资源清理", async () => {
  const html = await readPage(topicPages[2].fileName);

  for (const evidence of [
    "captured frames",
    "100",
    "30.000",
    "sequence",
    "2 → 101",
    "sequence gap",
    "poll timeout",
    "12441600",
    "update_stats()",
    "print_summary()",
    "cleanup_capture()",
    "VIDIOC_STREAMOFF",
    "VIDIOC_REQBUFS(count=0)",
  ]) {
    assertContains(html, evidence, `专题 26 应包含 ${evidence}`);
  }
});

test("共享 CSS 在 768px 窄屏切换 mobile-flow、隐藏 diagram 且无内部滚动", async () => {
  const css = await readUtf8(path.join("assets", "v4l2-callgraph.css"));
  const uncommentedCss = stripCssComments(css);

  assert.match(
    uncommentedCss,
    /\.mobile-flow\s*\{[^}]*display\s*:\s*none/isu,
    "桌面端应隐藏 mobile-flow",
  );
  assert.match(
    uncommentedCss,
    narrowMediaContract,
    "768px media query 开头应紧邻 diagram 隐藏和 mobile-flow grid 两条闭合规则",
  );
  assert.doesNotMatch(
    uncommentedCss,
    /overflow(?:-x|-y)?\s*:\s*(?:auto|scroll)/iu,
    "共享 CSS 不得创建内部滚动容器",
  );
});
