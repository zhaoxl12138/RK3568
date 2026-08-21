import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = path.join(repoRoot, '02-源码陪读');
const siteRoot = path.join(repoRoot, '00-首页', '学习驾驶舱');

const stageSpecs = [
  ['00', '00-系统源码地图', 'review-needed', 'pages/system-map.html'],
  ['01', '01-Linux-Driver-Model', 'review-needed', '../../04-项目/15-Linux设备模型与总线分层.html'],
  ['02', '02-DTS与设备发现', 'review-needed', '../../04-项目/20-DTS到运行时设备发现.html'],
  ['03', '03-IMX415-Sensor', 'review-needed', '../../04-项目/16-IMX415-三层驱动调用流程.html'],
  ['04', '04-DPHY', 'understood', '../../04-项目/17-DPHY-从DTS到MediaGraph.html'],
  ['05', '05-V4L2-Subdev', 'in-progress', '../../04-项目/19-IMX415-v4l2-subdev注册与开流.html'],
  ['06', '06-Media-Controller', 'not-started', '../../04-项目/21-MediaController-Entity-Pad-Link.html'],
  ['07', '07-RKISP', 'not-started', '../../04-项目/22-RKISP-从RAW到VideoNode.html'],
  ['08', '08-V4L2用户态取流', 'not-started', '../../04-项目/23-V4L2-VB2用户态取流.html'],
];

const chapterNames = [
  '00-源码陪读索引.md',
  '01-生命周期.md',
  '02-对象与数据链.md',
  '03-调试与面试验收.md',
];

function read(filePath) {
  assert.equal(fs.existsSync(filePath), true, `required file must exist: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u);
  assert.ok(match, 'Markdown must start with YAML frontmatter');
  return match[1];
}

function readCourseContract() {
  const generatedPath = path.join(siteRoot, 'generated', 'vault-data.js');
  const context = { window: {} };
  vm.runInNewContext(read(generatedPath), context, { filename: generatedPath });
  return context.window.RK3568_COURSE;
}

function wildcardPathExists(root, relativePath) {
  const normalized = relativePath.replace(/^kernel\//u, '');
  if (!normalized.includes('*')) return fs.existsSync(path.join(root, normalized));

  const directory = path.join(root, path.dirname(normalized));
  if (!fs.existsSync(directory)) return false;
  const filenamePattern = path.basename(normalized)
    .replace(/[.+?^${}()|[\]\\]/gu, '\\$&')
    .replaceAll('*', '.*');
  return fs.readdirSync(directory).some((filename) => new RegExp(`^${filenamePattern}$`, 'u').test(filename));
}

test('source-reading root contains exactly the approved 00-08 stage directories', () => {
  const directories = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(directories, stageSpecs.map(([, directory]) => directory));
});

test('each source-reading stage has the four canonical Markdown chapters and metadata', () => {
  for (const [stage, directory, status] of stageSpecs) {
    const stageDir = path.join(sourceRoot, directory);
    assert.equal(fs.existsSync(stageDir), true, `source-reading stage must exist: ${directory}`);
    const files = fs.readdirSync(stageDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();

    assert.deepEqual(files, chapterNames, `${directory} must use the canonical four-chapter shape`);

    for (const chapterName of chapterNames) {
      const markdown = read(path.join(stageDir, chapterName));
      const metadata = frontmatter(markdown);
      assert.match(metadata, /^doc-type:\s*source-reading\s*$/mu, `${directory}/${chapterName}: doc-type`);
      assert.match(metadata, new RegExp(`^course-stage:\\s*["']?${stage}["']?\\s*$`, 'mu'), `${directory}/${chapterName}: course-stage`);
      assert.match(metadata, new RegExp(`^learning-status:\\s*${status}\\s*$`, 'mu'), `${directory}/${chapterName}: learning-status`);
    }
  }
});

test('each source-reading chapter teaches source navigation, relationship types, evidence boundaries, and interview recall', () => {
  const semanticSections = [
    ['Source Insight 定位', /Source Insight/u],
    ['源码文件或搜索符号', /(?:drivers\/|include\/|\.c\b|\.h\b|搜索符号|搜索函数)/u],
    ['代码与调用关系', /(?:直接调用|框架回调|函数指针|字段赋值|对象关系|调用类型)/u],
    ['白话解释', /(?:大白话|白话解释)/u],
    ['板端证据边界', /板端[\s\S]{0,40}证据|能证明[\s\S]{0,80}不能证明/su],
    ['面试问题', /面试问题/u],
    ['我的回答', /我的回答/u],
    ['正确答案', /(?:高亮)?正确答案/u],
  ];

  for (const [, directory] of stageSpecs) {
    for (const chapterName of chapterNames) {
      const markdown = read(path.join(sourceRoot, directory, chapterName));
      for (const [label, pattern] of semanticSections) {
        assert.match(markdown, pattern, `${directory}/${chapterName} missing ${label}`);
      }
    }
  }
});

test('every kernel source path named by source-reading notes exists in both learning copy and WSL baseline', () => {
  const annotatedRoot = 'E:/sourceInsight/rk3568_linux_4.19_kernel/kernel';
  const baselineRoot = '//wsl.localhost/Ubuntu-20.04/home/rk3568/work/rk3568_linux_sdk/kernel';
  const sourcePattern = /\b(?:kernel\/)?(?:drivers|include|arch)\/[A-Za-z0-9_./*+-]+\.(?:c|h)\b/gu;

  for (const [, directory] of stageSpecs) {
    for (const chapterName of chapterNames) {
      const markdown = read(path.join(sourceRoot, directory, chapterName));
      const sourcePaths = [...new Set(markdown.match(sourcePattern) ?? [])];
      assert.ok(sourcePaths.length > 0, `${directory}/${chapterName} must name at least one source file`);
      for (const sourcePath of sourcePaths) {
        assert.equal(wildcardPathExists(annotatedRoot, sourcePath), true, `learning-copy source missing: ${sourcePath}`);
        assert.equal(wildcardPathExists(baselineRoot, sourcePath), true, `WSL baseline source missing: ${sourcePath}`);
      }
    }
  }
});

test('course map is the single current-stage source and generated runtime keeps stage 05', () => {
  const statePath = path.join(repoRoot, '00-首页', '00-当前学习状态.md');
  const courseMap = JSON.parse(read(path.join(repoRoot, '00-首页', 'course-map.json')));
  const buildSource = read(path.join(repoRoot, 'tools', 'build-dashboard.mjs'));
  const contract = readCourseContract();

  assert.equal(fs.existsSync(statePath), false, 'legacy learning-state note must be removed');
  assert.equal(courseMap.currentStage, '05');
  assert.doesNotMatch(buildSource, /learningState|00-当前学习状态\.md/u);
  assert.equal(contract.currentStage, '05');
  assert.deepEqual(JSON.parse(JSON.stringify(contract.stages)), courseMap.stages);
});

test('course stages 00-08 point to the approved visual source-reading pages', () => {
  const courseMap = JSON.parse(read(path.join(repoRoot, '00-首页', 'course-map.json')));
  const actual = courseMap.stages.slice(0, 9).map(({ id, path: pagePath }) => [id, pagePath]);
  assert.deepEqual(actual, stageSpecs.map(([stage, , , pagePath]) => [stage, pagePath]));

  for (const [stage, directory, , pagePath] of stageSpecs) {
    const absolutePage = path.resolve(siteRoot, pagePath);
    assert.ok(fs.existsSync(absolutePage), `stage ${stage} page must exist: ${absolutePage}`);
    const html = read(absolutePage);
    const sourceIndex = `02-源码陪读/${directory}/00-源码陪读索引`;
    const encodedIndex = sourceIndex.split('/').map(encodeURIComponent).join('%2F');

    assert.ok(
      html.includes(sourceIndex) || html.includes(encodedIndex),
      `stage ${stage} page must enter ${sourceIndex}`,
    );
    assert.match(html, /实线/u, `stage ${stage} must explain solid-line semantics`);
    assert.match(html, /虚线/u, `stage ${stage} must explain dashed-line semantics`);
    assert.match(html, /(?:drivers\/|include\/|\.c\b|\.h\b)/u, `stage ${stage} must identify source files`);
    assert.match(html, /\b[a-zA-Z_][a-zA-Z0-9_]*\s*\(/u, `stage ${stage} must identify source functions`);
    assert.match(html, /(?:大白话|白话解释)/u, `stage ${stage} must include plain-language teaching`);
    assert.match(html, /证据/u, `stage ${stage} must include evidence`);
    assert.match(html, /面试/u, `stage ${stage} must include interview language`);
  }
});

test('course route remains continuous from IMX415 through userspace capture', () => {
  const courseMap = JSON.parse(read(path.join(repoRoot, '00-首页', 'course-map.json')));
  const route = courseMap.stages.filter(({ id }) => Number(id) >= 3 && Number(id) <= 8);

  assert.deepEqual(route.map(({ id }) => id), ['03', '04', '05', '06', '07', '08']);
  assert.deepEqual(route.map(({ title }) => title), [
    'IMX415 Sensor',
    'MIPI CSI-2 / D-PHY',
    'V4L2 Subdev',
    'Media Controller',
    'RKISP',
    'V4L2 用户态取流',
  ]);

  for (let index = 0; index < route.length - 1; index += 1) {
    const currentPage = read(path.resolve(siteRoot, route[index].path));
    const nextTarget = path.basename(route[index + 1].path);
    assert.match(currentPage, new RegExp(nextTarget.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'), `${route[index].id} must link to ${route[index + 1].id}`);
  }
});

test('00-08 visual pages are fluid and do not use nested scrolling or local zoom controls', () => {
  for (const [stage, , , pagePath] of stageSpecs) {
    const html = read(path.resolve(siteRoot, pagePath));
    assert.match(html, /<meta\s+name=["']viewport["']/iu, `stage ${stage} needs viewport metadata`);
    if (/<svg\b/iu.test(html)) {
      assert.match(html, /(?:svg|[A-Za-z0-9_-]*svg)\s*\{[^}]*width:\s*100%/iu, `stage ${stage} diagrams must be fluid`);
    }
    const linkedSharedStyles = /href=["'][^"']*site\.css/iu.test(html);
    assert.ok(linkedSharedStyles || /@media\s*\([^)]*max-width/iu.test(html), `stage ${stage} needs responsive styles`);
    assert.doesNotMatch(html, /class=["'][^"']*(?:zoom|pan-controls)[^"']*["']/iu, `stage ${stage} must not add local zoom controls`);
    assert.doesNotMatch(html, /\.diagram[^}]*overflow:\s*(?:auto|scroll)/iu, `stage ${stage} must not create nested diagram scrolling`);
  }
});
