import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PATHS = {
  taskBoard: '06-任务/01-下一步任务看板.md',
  acceptance: '07-专项笔记/系统/Camera驱动分阶段验收标准.md',
  evidenceIndex: '05-实验与证据/00-Camera证据索引.md',
  evidenceAssets: '05-实验与证据/assets',
};
const DASHBOARD_DIRECTORY = '00-首页/学习驾驶舱';
const DEFAULT_VAULT_NAME = 'RK3568';

const DOMAIN_MAP = [
  ['Camera', '07-专项笔记/Camera-V4L2/IMX415驱动调试与最小demo路线.md'],
  ['V4L2', '07-专项笔记/Camera-V4L2/V4L2命令行抓帧记录.md'],
  ['OpenCV', '07-专项笔记/OpenCV/OpenCV读取Camera记录.md'],
  ['System', '07-专项笔记/系统/AI Camera系统数据流与模块边界.md'],
];

const QUICK_LINKS = [
  ['taskBoard', PATHS.taskBoard],
  ['activeRoute', '06-任务/Camera驱动求职第1周执行计划.md'],
  ['currentChapter', '06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md'],
  ['dailyRecord', '05-实验与证据/2026-07-28-Camera驱动Day1验收.md'],
  ['acceptance', PATHS.acceptance],
  ['evidenceMoc', '05-实验与证据/2026-07-28-直连板端读取IMX415配置.md'],
  ['outputMoc', '09-输出沉淀/00-输出沉淀入口.md'],
];

const EXTRA_NOTE_PATHS = [
  '06-任务/Camera驱动求职第1周执行计划.md',
  '06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md',
  '05-实验与证据/2026-07-28-Camera驱动Day1验收.md',
  '05-实验与证据/2026-07-28-直连板端读取IMX415配置.md',
  '05-实验与证据/00-Camera证据索引.md',
  '07-专项笔记/Camera-V4L2/V4L2命令行抓帧记录.md',
  '08-附录/00-附录入口.md',
  '09-输出沉淀/00-输出沉淀入口.md',
];

const NOTE_PAGE_DIRECTORY = '00-首页/学习驾驶舱/pages/notes';
const PRESERVED_MARKDOWN_PATHS = new Set([
  '00-首页/00-RK3568学习主入口.md',
]);
const ACTIVE_HTML_ROOTS = [
  '00-首页/学习驾驶舱',
  '04-项目',
];
const ACTIVE_NOTE_ROOTS = [
  '04-项目',
  '05-实验与证据',
  '06-任务',
  '07-专项笔记',
  '08-附录',
  '09-输出沉淀',
];

function normalizeVaultPath(filePath) {
  return filePath.replace(/\\/gu, '/').replace(/^\.\//u, '');
}

function webPublishEnabled(markdown) {
  const normalized = String(markdown ?? '').replace(/\r\n?/gu, '\n');
  const frontMatter = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/u);
  if (!frontMatter) return true;
  return !/^web-publish:\s*(?:false|no|0)\s*$/imu.test(frontMatter[1]);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

function notePageName(filePath) {
  return `${normalizeVaultPath(filePath).replace(/\.md$/iu, '').replace(/\//gu, '--')}.html`;
}

function notePagePath(filePath) {
  return path.posix.join('pages/notes', notePageName(filePath));
}

function resolveNoteLink(target, linkMap) {
  const normalized = normalizeVaultPath(target).replace(/\.md$/iu, '.md');
  return linkMap.get(normalized) ?? linkMap.get(path.posix.basename(normalized));
}

function renderInline(
  value,
  linkMap = new Map(),
  resolveMedia = (target) => target,
  resolveLink = (target) => target,
) {
  let text = String(value ?? '');
  const fragments = [];
  const hold = (html) => {
    const token = `\uE000${fragments.length}\uE001`;
    fragments.push(html);
    return token;
  };
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/gu, (_, alt, target) => (
    hold(`<img src="${escapeHtml(resolveMedia(target))}" alt="${escapeHtml(alt)}">`)
  ));
  text = text.replace(/!\[\[([^\]]+)\]\]/gu, (_, target) => {
    const source = target.split('|', 1)[0].trim();
    if (/\.(?:avif|gif|jpe?g|png|svg|webp)$/iu.test(source)) {
      return hold(`<img src="${escapeHtml(resolveMedia(source))}" alt="${escapeHtml(path.posix.basename(source))}">`);
    }
    return hold(`<span class="note-embed">${escapeHtml(source)}</span>`);
  });
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, (_, target, label) => {
    const href = resolveNoteLink(target.trim(), linkMap);
    return href
      ? hold(`<a href="${escapeHtml(href)}">${escapeHtml(label ?? target)}</a>`)
      : label ?? target;
  });
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/gu, (_, label, target) => (
    hold(`<a href="${escapeHtml(resolveLink(target))}">${escapeHtml(label)}</a>`)
  ));
  text = escapeHtml(text)
    .replace(/`([^`]+)`/gu, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>')
    .replace(/__([^_]+)__/gu, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/gu, '<em>$1</em>');
  return text.replace(/\uE000(\d+)\uE001/gu, (_, index) => fragments[Number(index)]);
}

export function renderMarkdown(markdown, {
  linkMap = new Map(),
  demoteH1 = false,
  resolveMedia = (target) => target,
  resolveLink = (target) => target,
} = {}) {
  const lines = String(markdown ?? '').replace(/\r\n?/gu, '\n').split('\n');
  const output = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const fence = line.match(/^\s*(```+|~~~+)\s*([^\s]*)\s*$/u);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !new RegExp(`^\\s*${fence[1]}\\s*$`, 'u').test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const language = fence[2] ? ` class="language-${escapeHtml(fence[2])}"` : '';
      output.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/u);
    if (heading) {
      const level = demoteH1 && heading[1].length === 1 ? 2 : heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2], linkMap, resolveMedia, resolveLink)}</h${level}>`);
      index += 1;
      continue;
    }
    if (/^\s*[-*+]\s+/u.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*+]\s+/u.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^\s*[-*+]\s+/u, ''), linkMap, resolveMedia, resolveLink)}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (/^\s*>\s?/u.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*>\s?/u.test(lines[index])) {
        items.push(renderInline(lines[index].replace(/^\s*>\s?/u, ''), linkMap, resolveMedia, resolveLink));
        index += 1;
      }
      output.push(`<blockquote>${items.join('<br>')}</blockquote>`);
      continue;
    }
    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(lines[index + 1])) {
      const cells = (value) => value.trim().replace(/^\|/u, '').replace(/\|$/u, '').split('|').map((cell) => cell.trim());
      const headers = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      output.push(`<table><thead><tr>${headers.map((cell) => `<th>${renderInline(cell, linkMap, resolveMedia, resolveLink)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] ?? '', linkMap, resolveMedia, resolveLink)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^\s*(?:#{1,6}\s|[-*+]\s|>\s?|```|~~~)/u.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    output.push(`<p>${paragraph.map((value) => renderInline(value, linkMap, resolveMedia, resolveLink)).join('<br>')}</p>`);
  }
  return output.join('\n');
}

function notePageTemplate(note, body) {
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(note.title)} · RK3568</title><link rel="stylesheet" href="../../site.css"></head><body><div class="page-shell"><nav class="site-nav" data-site-nav aria-label="网站导航"><a class="site-nav__brand" href="../../index.html">RK3568 / 驾驶舱</a><div class="site-nav__links"><a href="../../index.html">驾驶舱首页</a><a href="../learning-route.html">学习路线</a><a href="../system-map.html">系统地图</a><a href="../notes.html" aria-current="page">专项笔记</a></div></nav><main id="main-content" class="note-page"><header class="hero"><p class="hero__eyebrow">GENERATED NOTE · ${escapeHtml(note.folder)}</p><h1>${escapeHtml(note.title)}</h1><p>此页面由 Markdown 知识源自动生成，适合网页阅读；编辑仍请回到 Obsidian。</p><div class="hero__actions"><a class="button" href="${escapeHtml(note.obsidianUrl)}">在 Obsidian 中打开</a></div></header><article class="note-content">${body}</article><footer class="footer"><a href="../notes.html">返回专项笔记导航</a> · <a href="../../index.html">返回驾驶舱首页</a></footer></main></div><script defer src="../../site.js"></script></body></html>`;
}

function section(markdown, heading) {
  const match = markdown.match(new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'mu'));
  return match ? match[1] : '';
}

function normalizeStatus(value) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'planned';
  if (['current', '进行中', '当前'].includes(normalized)) return 'current';
  if (['verified', '已验证', '已驗證'].includes(normalized)) return 'verified';
  if (['planned', '计划', '計劃'].includes(normalized)) return 'planned';
  return 'unknown';
}

function normalizeStageLabel(value) {
  const label = value.trim().replace(/\s+/gu, ' ');
  const match = label.match(/^(?:\u9636\u6bb5\s*)?(\d+)(?:\s*(?:[:,\uFF1A\uFF0C\u3001-]\s*|\s+)(.*))?$/u);
  if (!match) return { id: '', stageKey: 'unknown', normalizedLabel: label };
  const id = String(Number(match[1]));
  const body = match[2]?.trim() ?? '';
  return { id, stageKey: `stage-${id}`, normalizedLabel: `\u9636\u6bb5 ${id}${body ? ` ${body}` : ''}` };
}

export function parseTaskBoard(markdown) {
  const stageSection = section(markdown, '当前阶段');
  const taskSection = section(markdown, '本轮唯一任务');
  const currentStage = stageSection.match(/^\s*-\s*阶段：[\s]*(.+?)\s*$/mu)?.[1] ?? null;
  const seen = new Set();
  const currentTasks = [];

  for (const match of taskSection.matchAll(/^\s*-\s*\[([ xX])\]\s+(.+?)\s*$/gmu)) {
    const text = match[2];
    if (!seen.has(text)) {
      seen.add(text);
      currentTasks.push({ completed: match[1].toLowerCase() === 'x', text });
    }
  }

  return { currentStage, currentTasks };
}

function splitMarkdownRow(line) {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (/(?<!\\)\|\s*$/u.test(value)) value = value.replace(/(?<!\\)\|\s*$/u, '');

  const cells = [];
  let cell = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\\' && value[index + 1] === '|') {
      cell += '|';
      index += 1;
    } else if (value[index] === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += value[index];
    }
  }
  cells.push(cell.trim());
  return cells;
}

function isDelimiterRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

export function parseStageTable(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const requiredHeaders = ['阶段', '要回答的问题', '最小输出证据', '通过标准', '证据入口'];
  let inFence = false;
  let inSection = false;
  let headers = null;
  const rows = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*(?:```|~~~)/u.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!inSection) {
      if (/^##\s+阶段总表\s*$/u.test(line)) inSection = true;
      continue;
    }
    if (/^##\s+/u.test(line)) break;

    const cells = splitMarkdownRow(line);
    if (!headers) {
      if (!requiredHeaders.every((header) => cells.includes(header))) continue;
      const delimiter = splitMarkdownRow(lines[index + 1] ?? '');
      if (delimiter.length !== cells.length || !isDelimiterRow(delimiter)) continue;
      headers = cells;
      index += 1;
      continue;
    }
    if (!line.trim() || !line.includes('|')) break;
    rows.push(cells);
  }

  if (!headers) return [];
  return rows.map((cells) => {
    const values = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    const label = values['阶段'] ?? '';
    const normalized = normalizeStageLabel(label);
    return {
      id: normalized.id,
      stageKey: normalized.stageKey,
      normalizedLabel: normalized.normalizedLabel,
      label,
      question: values['要回答的问题'] ?? '',
      minimumEvidence: values['最小输出证据'] ?? '',
      criteria: values['通过标准'] ?? '',
      evidenceEntry: values['证据入口'] ?? '',
      status: normalizeStatus(values['状态'] ?? ''),
    };
  });
}

export function buildObsidianUrl(vault, filePath) {
  const normalizedPath = filePath.replace(/\\/gu, '/').replace(/\.md$/iu, '');
  return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(normalizedPath)}`;
}

async function collectHtmlFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(filePath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(filePath);
  }
  return files;
}

async function collectMarkdownFiles(rootDir, directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectMarkdownFiles(rootDir, filePath));
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(normalizeVaultPath(path.relative(rootDir, filePath)));
    }
  }
  return files;
}

async function collectMediaFiles(rootDir, directory = rootDir) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectMediaFiles(rootDir, filePath));
    else if (entry.isFile() && /\.(?:avif|gif|jpe?g|png|svg|webp)$/iu.test(entry.name)) {
      files.push(normalizeVaultPath(path.relative(rootDir, filePath)));
    }
  }
  return files;
}

async function buildMediaLookup(rootDir) {
  const files = await collectMediaFiles(rootDir);
  const byPath = new Set(files);
  const byBasename = new Map();
  for (const filePath of files) {
    const basename = path.posix.basename(filePath).normalize('NFC');
    if (!byBasename.has(basename)) byBasename.set(basename, filePath);
    else if (byBasename.get(basename) !== filePath) byBasename.set(basename, null);
  }
  return { byPath, byBasename };
}

async function activeHtmlFiles(rootDir) {
  const groups = await Promise.all(ACTIVE_HTML_ROOTS.map((relativePath) => (
    collectHtmlFiles(path.join(rootDir, ...relativePath.split('/')))
  )));
  return groups.flat();
}

function relativeSiteHref(rootDir, htmlFile, vaultPath) {
  return normalizeVaultPath(path.relative(
    path.dirname(htmlFile),
    path.join(rootDir, ...normalizeVaultPath(vaultPath).split('/')),
  ));
}

function activeNavigationKeyForFile(rootDir, htmlFile) {
  const filePath = normalizeVaultPath(path.relative(rootDir, htmlFile));
  if (filePath.startsWith('04-项目/')) return 'phase0';
  if (/\/pages\/notes\/06-任务--01-下一步任务看板\.html$/u.test(`/${filePath}`)) return 'task';
  if (filePath.endsWith('/pages/learning-route.html')) return 'route';
  if (filePath.endsWith('/pages/system-map.html')) return 'system';
  if (filePath.endsWith('/pages/phase0.html')) return 'phase0';
  if (filePath.includes('/pages/notes/')) return 'notes';
  if (filePath.endsWith('/pages/notes.html')) return 'notes';
  if (filePath.endsWith('/pages/evidence.html')) return 'evidence';
  if (filePath.endsWith('/pages/project.html')) return 'project';
  if (filePath.endsWith('/pages/environment.html')) return 'environment';
  if (filePath.endsWith('/pages/archive.html')) return 'archive';
  return 'home';
}

function staticNavigationMarkup(rootDir, htmlFile, currentStage) {
  const activeKey = activeNavigationKeyForFile(rootDir, htmlFile);
  const stage = normalizeStageLabel(currentStage ?? '');
  const links = [
    ['home', '首页', `${DASHBOARD_DIRECTORY}/index.html`],
    ['task', '当前任务', `${DASHBOARD_DIRECTORY}/${notePagePath(PATHS.taskBoard)}`],
    ['route', '学习路线', `${DASHBOARD_DIRECTORY}/pages/learning-route.html`],
    ['system', '系统地图', `${DASHBOARD_DIRECTORY}/pages/system-map.html`],
    ['phase0', 'Phase0', '04-项目/10-Phase0-可视化总入口.html'],
    ['notes', '专项笔记', `${DASHBOARD_DIRECTORY}/pages/notes.html`],
    ['evidence', '实验依据', `${DASHBOARD_DIRECTORY}/pages/evidence.html`],
  ];
  const auxiliary = [
    ['project', '项目总览', `${DASHBOARD_DIRECTORY}/pages/project.html`],
    ['environment', '开发环境', `${DASHBOARD_DIRECTORY}/pages/environment.html`],
    ['archive', '归档', `${DASHBOARD_DIRECTORY}/pages/archive.html`],
  ];
  const renderLink = ([key, label, vaultPath]) => {
    const current = key === activeKey ? ' aria-current="page"' : '';
    return `<a href="${escapeHtml(relativeSiteHref(rootDir, htmlFile, vaultPath))}" data-nav-key="${key}"${current}>${label}</a>`;
  };
  const stageHref = relativeSiteHref(
    rootDir,
    htmlFile,
    `${DASHBOARD_DIRECTORY}/pages/learning-route.html`,
  );
  return `<nav class="site-nav" data-site-nav aria-label="全站导航"><a class="site-nav__brand" href="${escapeHtml(relativeSiteHref(rootDir, htmlFile, `${DASHBOARD_DIRECTORY}/index.html`))}"><span>RK3568</span><strong>Camera 学习站</strong></a><div class="site-nav__links">${links.map(renderLink).join('')}</div><div class="site-nav__tools"><a class="site-nav__stage" href="${escapeHtml(`${stageHref}${stage.id ? `#stage-${stage.id}` : ''}`)}" title="当前学习阶段">${escapeHtml(stage.normalizedLabel || currentStage || '查看学习阶段')}</a><details class="site-nav__more"><summary>更多</summary><div class="site-nav__more-panel">${auxiliary.map(renderLink).join('')}<a href="obsidian://open?vault=RK3568&amp;file=00-%E9%A6%96%E9%A1%B5%2F00-RK3568%E5%AD%A6%E4%B9%A0%E4%B8%BB%E5%85%A5%E5%8F%A3">在 Obsidian 中打开</a></div></details></div></nav>`;
}

function contextualNavigationMarkup(rootDir, htmlFile) {
  const filePath = normalizeVaultPath(path.relative(rootDir, htmlFile));
  const fileName = path.posix.basename(filePath);
  const phase0Sequence = [
    '10-Phase0-可视化总入口.html',
    '12-Phase0-数据流动画.html',
    '13-Phase0-Camera配置全流程.html',
    '14-Phase0-驱动层全链路框架图.html',
    '15-Phase0-RK3568全系统框架图.html',
  ];
  const index = phase0Sequence.indexOf(fileName);
  if (index >= 0) {
    const previous = index > 0
      ? `<a href="./${escapeHtml(phase0Sequence[index - 1])}">← 上一页</a>`
      : '<span>从总入口开始</span>';
    const next = index < phase0Sequence.length - 1
      ? `<a href="./${escapeHtml(phase0Sequence[index + 1])}">下一页 →</a>`
      : '<span>Phase0 主序列完成</span>';
    return `<div class="context-nav" aria-label="Phase0 页面顺序"><strong>Phase0 页面顺序</strong>${previous}${next}</div>`;
  }
  if (fileName === '16-IMX415-三层驱动调用流程.html') {
    const noteHref = relativeSiteHref(
      rootDir,
      htmlFile,
      `${DASHBOARD_DIRECTORY}/${notePagePath('06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md')}`,
    );
    return `<div class="context-nav" aria-label="IMX415 学习上下文"><strong>IMX415 专项</strong><a href="./10-Phase0-可视化总入口.html">← Phase0 总入口</a><a href="${escapeHtml(noteHref)}">源码对照笔记 →</a></div>`;
  }
  return '';
}

async function rewriteStaticNavigation(rootDir, currentStage) {
  const htmlFiles = await activeHtmlFiles(rootDir);
  for (const htmlFile of htmlFiles) {
    const original = await readFile(htmlFile, 'utf8');
    const withoutGeneratedContext = original.replace(
      /<div class="context-nav"[^>]*>[\s\S]*?<\/div>/giu,
      '',
    );
    let updated = withoutGeneratedContext.replace(
      /<nav\b[^>]*data-site-nav[^>]*>[\s\S]*?<\/nav>/iu,
      `${staticNavigationMarkup(rootDir, htmlFile, currentStage)}${contextualNavigationMarkup(rootDir, htmlFile)}`,
    );
    if (!updated.includes('class="page-shell"') && !/<body\b[^>]*\bsite-nav-offset\b/iu.test(updated)) {
      updated = updated.replace(/<body\b([^>]*)>/iu, (full, attributes) => {
        const classMatch = attributes.match(/\bclass=(["'])(.*?)\1/iu);
        if (classMatch) {
          return full.replace(classMatch[0], `class=${classMatch[1]}${classMatch[2]} site-nav-offset${classMatch[1]}`);
        }
        return `<body${attributes} class="site-nav-offset">`;
      });
    }
    if (updated !== original) await writeFile(htmlFile, updated, 'utf8');
  }
}

async function writeStaticNoteDirectory(rootDir, notes) {
  const notesPage = path.join(rootDir, ...`${DASHBOARD_DIRECTORY}/pages/notes.html`.split('/'));
  let html;
  try {
    html = await readFile(notesPage, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  const visibleNotes = notes.filter(({ filePath }) => (
    !filePath.startsWith('99-归档/')
    && !filePath.startsWith('08-附录/图源/')
    && !filePath.startsWith('08-附录/Skills/')
  ));
  const groups = new Map();
  for (const note of visibleNotes) {
    const folder = note.folder.split('/', 1)[0] || '其他';
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder).push(note);
  }
  const directory = [...groups].map(([folder, items]) => (
    `<section class="note-directory__group" data-note-group><h3>${escapeHtml(folder)} · ${items.length}</h3><div class="note-directory__list">${items.map((note) => {
      const webTarget = path.posix.join(DASHBOARD_DIRECTORY, note.webPath);
      const href = relativeSiteHref(rootDir, notesPage, webTarget);
      const searchText = `${note.title} ${note.filePath}`.toLowerCase();
      return `<article class="note-directory__item" data-note-item data-note-search-text="${escapeHtml(searchText)}"><a class="note-directory__main-link" href="${escapeHtml(href)}">${escapeHtml(note.title)}</a><span>${escapeHtml(note.filePath)}</span><a class="note-directory__edit-link" href="${escapeHtml(note.obsidianUrl)}">编辑</a></article>`;
    }).join('')}</div></section>`
  )).join('');
  html = html.replace(
    /<h2 id="all-notes-title">[\s\S]*?<\/div><label class="note-search">/u,
    '<h2 id="all-notes-title">当前学习内容</h2><p>只展示 Camera 驱动主线；历史归档和制图源文件不在这里干扰学习。</p></div><label class="note-search">',
  );
  html = html.replace(
    /<!-- NOTE_DIRECTORY_START -->[\s\S]*?<!-- NOTE_DIRECTORY_END -->/u,
    `<!-- NOTE_DIRECTORY_START --><div class="note-directory" data-note-directory>${directory}</div><!-- NOTE_DIRECTORY_END -->`,
  );
  html = html.replace(
    /<p class="note-directory__count" data-note-count aria-live="polite">[\s\S]*?<\/p>/u,
    `<p class="note-directory__count" data-note-count aria-live="polite">${visibleNotes.length} / ${visibleNotes.length} 篇当前内容</p>`,
  );
  await writeFile(notesPage, html, 'utf8');
}

async function sharedAssetVersion(rootDir, outputFile) {
  const assetPaths = [
    path.join(rootDir, ...`${DASHBOARD_DIRECTORY}/site.css`.split('/')),
    path.join(rootDir, ...`${DASHBOARD_DIRECTORY}/site.js`.split('/')),
    path.join(rootDir, ...`${DASHBOARD_DIRECTORY}/app.js`.split('/')),
    outputFile,
  ];
  const contents = await Promise.all(assetPaths.map(async (filePath) => {
    try {
      return await readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return '';
      throw error;
    }
  }));
  return createHash('sha1').update(contents.join('\n')).digest('hex').slice(0, 10);
}

async function rewriteSharedAssetVersions(rootDir, version) {
  const htmlFiles = await activeHtmlFiles(rootDir);
  for (const htmlFile of htmlFiles) {
    const original = await readFile(htmlFile, 'utf8');
    const updated = original.replace(
      /((?:href|src)=["'][^"']*?(?:site\.css|site\.js|vault-data\.js|app\.js))(?:\?v=[^"'#]*)?(["'])/giu,
      `$1?v=${version}$2`,
    );
    if (updated !== original) await writeFile(htmlFile, updated, 'utf8');
  }
}

async function linkedMarkdownPaths(rootDir) {
  const htmlFiles = await activeHtmlFiles(rootDir);
  const sources = [];
  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8');
    for (const match of html.matchAll(/href=["']([^"']+\.md(?:#[^"']*)?)["']/giu)) {
      const href = match[1].split(/[?#]/u, 1)[0];
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/iu.test(href)) continue;
      const target = path.resolve(path.dirname(htmlFile), href);
      const relativePath = normalizeVaultPath(path.relative(rootDir, target));
      if (relativePath.endsWith('.md') && !relativePath.startsWith('../')) sources.push(relativePath);
    }
  }
  return sources;
}

async function noteSources(rootDir) {
  const activeNotes = (await Promise.all(ACTIVE_NOTE_ROOTS.map((relativePath) => (
    collectMarkdownFiles(rootDir, path.join(rootDir, ...relativePath.split('/')))
  )))).flat().sort(compareCodePoints);
  return [...new Set([
    ...DOMAIN_MAP.map(([, filePath]) => filePath),
    ...QUICK_LINKS.map(([, filePath]) => filePath),
    ...EXTRA_NOTE_PATHS,
    ...activeNotes,
    ...(await linkedMarkdownPaths(rootDir)).filter((filePath) => !PRESERVED_MARKDOWN_PATHS.has(filePath)),
  ])].filter((filePath) => !PRESERVED_MARKDOWN_PATHS.has(filePath));
}

async function buildNoteCatalog(rootDir, vaultName = DEFAULT_VAULT_NAME) {
  const sources = await noteSources(rootDir);
  const byPath = new Map();
  const byBasename = new Map();
  const notes = [];
  const warnings = [];
  for (const filePath of sources) {
    const normalizedPath = normalizeVaultPath(filePath);
    const webPath = notePagePath(normalizedPath);
    const note = {
      filePath: normalizedPath,
      webPath,
      obsidianUrl: buildObsidianUrl(vaultName, normalizedPath),
      title: path.posix.basename(normalizedPath, '.md'),
      folder: path.posix.dirname(normalizedPath),
      contents: '',
    };
    try {
      const contents = await readFile(
        path.join(rootDir, ...normalizedPath.split('/')),
        'utf8',
      );
      if (!webPublishEnabled(contents)) continue;
      note.contents = contents;
      notes.push(note);
      byPath.set(normalizedPath, webPath);
      byBasename.set(path.posix.basename(normalizedPath), webPath);
    } catch (error) {
      if (error.code === 'ENOENT') warnings.push(`Missing note source: ${normalizedPath}`);
      else throw error;
    }
  }
  const linkMap = new Map([...byPath, ...byBasename]);
  return { notes, byPath, byBasename, linkMap, warnings };
}

async function writeNotePages(rootDir, notes, linkMap) {
  const outputDirectory = path.join(rootDir, ...NOTE_PAGE_DIRECTORY.split('/'));
  await mkdir(outputDirectory, { recursive: true });
  const expectedPageNames = new Set(notes.map(({ filePath }) => notePageName(filePath)));
  const existingPages = await readdir(outputDirectory, { withFileTypes: true });
  await Promise.all(existingPages
    .filter((entry) => (
      entry.isFile()
      && entry.name.endsWith('.html')
      && !expectedPageNames.has(entry.name)
    ))
    .map((entry) => rm(path.join(outputDirectory, entry.name))));
  const mediaLookup = await buildMediaLookup(rootDir);
  const pageLinkMap = new Map([...linkMap].map(([key, webPath]) => [
    key,
    path.posix.relative(
      NOTE_PAGE_DIRECTORY,
      path.posix.join(DASHBOARD_DIRECTORY, webPath),
    ),
  ]));
  for (const note of notes) {
    const pageFile = path.join(outputDirectory, notePageName(note.filePath));
    const contents = note.contents.replace(/^\s*#\s+.+?\s*(?:\r?\n){1,2}/u, '');
    const sourceDirectory = path.posix.dirname(note.filePath);
    const parseTarget = (target) => {
      const normalized = target.trim().replace(/^<|>$/gu, '').replace(/\\/gu, '/');
      const match = normalized.match(/^([^?#]+)([?#].*)?$/u);
      if (!match) return null;
      return {
        path: match[1],
        suffix: match[2] ?? '',
        vaultPath: path.posix.normalize(path.posix.join(sourceDirectory, match[1])),
      };
    };
    const resolveMedia = (target) => {
      const cleanTarget = target.trim().replace(/^<|>$/gu, '');
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/iu.test(cleanTarget)) return cleanTarget;
      const parsed = parseTarget(cleanTarget);
      if (!parsed) return target;
      const basename = path.posix.basename(parsed.vaultPath).normalize('NFC');
      const vaultPath = mediaLookup.byPath.has(parsed.vaultPath)
        ? parsed.vaultPath
        : mediaLookup.byBasename.get(basename) ?? parsed.vaultPath;
      const relativePath = path.posix.relative(NOTE_PAGE_DIRECTORY, vaultPath);
      return `${relativePath}${parsed.suffix}`;
    };
    const resolveLink = (target) => {
      const cleanTarget = target.trim().replace(/^<|>$/gu, '');
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/iu.test(cleanTarget)) return cleanTarget;
      const parsed = parseTarget(cleanTarget);
      if (!parsed) return target;
      if (/\.md$/iu.test(parsed.path)) {
        const generated = pageLinkMap.get(parsed.vaultPath)
          ?? pageLinkMap.get(path.posix.basename(parsed.vaultPath));
        if (generated) return `${generated}${parsed.suffix}`;
      }
      const relativePath = path.posix.relative(NOTE_PAGE_DIRECTORY, parsed.vaultPath);
      return `${relativePath}${parsed.suffix}`;
    };
    const body = renderMarkdown(contents, {
      linkMap: pageLinkMap,
      demoteH1: true,
      resolveMedia,
      resolveLink,
    });
    await writeFile(pageFile, notePageTemplate(note, body), 'utf8');
  }
}

async function rewriteSiteMarkdownLinks(rootDir, noteCatalog) {
  const siteRoot = path.join(rootDir, ...'00-首页/学习驾驶舱'.split('/'));
  const htmlFiles = await activeHtmlFiles(rootDir);
  for (const htmlFile of htmlFiles) {
    const original = await readFile(htmlFile, 'utf8');
    const updated = original.replace(/(href=["'])([^"']+\.md(?:#[^"']*)?)(["'])/giu, (full, prefix, href, suffix) => {
      const target = href.split(/[?#]/u, 1)[0];
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/iu.test(target)) return full;
      const absolute = path.resolve(path.dirname(htmlFile), target);
      const sourcePath = normalizeVaultPath(path.relative(rootDir, absolute));
      if (sourcePath === '00-首页/00-RK3568学习主入口.md') {
        const generated = path.join(siteRoot, 'index.html');
        const relative = normalizeVaultPath(path.relative(path.dirname(htmlFile), generated));
        const hash = href.slice(target.length);
        return `${prefix}${relative}${hash}${suffix}`;
      }
      const webPath = noteCatalog.byPath.get(sourcePath);
      if (!webPath) return full;
      const generated = path.join(rootDir, ...NOTE_PAGE_DIRECTORY.split('/'), notePageName(sourcePath));
      const relative = normalizeVaultPath(path.relative(path.dirname(htmlFile), generated));
      const hash = href.slice(target.length);
      return `${prefix}${relative}${hash}${suffix}`;
    });
    if (updated !== original) await writeFile(htmlFile, updated, 'utf8');
  }
}

async function readOptional(rootDir, relativePath, description) {
  try {
    return {
      contents: await readFile(path.join(rootDir, ...relativePath.split('/')), 'utf8'),
      warnings: [],
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        contents: '',
        warnings: [`Missing optional ${description}: ${relativePath}`],
      };
    }
    else throw error;
  }
}

function evidenceType(fileName) {
  if (/\.(?:jpg|jpeg|png|gif|webp|svg)$/iu.test(fileName)) return 'image';
  if (/\.(?:mp4|webm|mov|mkv)$/iu.test(fileName)) return 'video';
  return 'file';
}

function evidenceMediaType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webm': 'video/webm',
    '.webp': 'image/webp',
  }[extension] ?? 'application/octet-stream';
}

function compareCodePoints(left, right) {
  const leftPoints = [...left.normalize('NFC')].map((value) => value.codePointAt(0));
  const rightPoints = [...right.normalize('NFC')].map((value) => value.codePointAt(0));
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) return leftPoints[index] - rightPoints[index];
  }
  return leftPoints.length - rightPoints.length;
}

function normalizeEvidenceName(target) {
  const normalized = target
    .trim()
    .replace(/^<|>$/gu, '')
    .split('|', 1)[0]
    .replace(/\\/gu, '/')
    .split(/[?#]/u, 1)[0];
  return normalized.split('/').at(-1).normalize('NFC');
}

function isEvidenceFileName(name) {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mkv)$/iu.test(name);
}

function extractEvidenceTargets(markdown) {
  const targets = [];
  for (const match of markdown.matchAll(/!\[\[([^\]]+)\]\]/gu)) {
    targets.push(normalizeEvidenceName(match[1]));
  }
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    targets.push(normalizeEvidenceName(match[1]));
  }
  for (const match of markdown.matchAll(/(?:^|[\s`"'(<\[])([^\s`"'()<>\[\]|]+\.(?:jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mkv))(?=$|[\s`"'<>),\]|，。；：])/gimu)) {
    targets.push(normalizeEvidenceName(match[1]));
  }
  return targets.filter(isEvidenceFileName);
}

function splitEvidenceSections(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const sections = [{ heading: '', lines: [] }];
  let inFence = false;

  for (const line of lines) {
    if (/^\s*(?:```|~~~)/u.test(line)) inFence = !inFence;
    const heading = !inFence ? line.match(/^###\s+(.+?)\s*$/u) : null;
    if (heading) {
      sections.push({ heading: heading[1], lines: [] });
    } else {
      sections.at(-1).lines.push(line);
    }
  }
  return sections;
}

function evidenceStage(section) {
  for (let index = 0; index < section.lines.length; index += 1) {
    const field = section.lines[index].match(/^\s*用到阶段：\s*(.*?)\s*$/u);
    if (!field) continue;
    if (field[1]) return { label: field[1], explicit: true };
    for (const candidate of section.lines.slice(index + 1)) {
      const value = candidate.trim();
      if (!value || /^(?:```|~~~)/u.test(value)) continue;
      return { label: value, explicit: true };
    }
    return { label: 'unknown', explicit: true };
  }
  return section.heading.match(/^(阶段\s*\d+.+)$/u)?.[1].trim() ?? 'unknown';
}

function normalizeEvidenceStage(label) {
  const normalized = normalizeStageLabel(label);
  if (normalized.stageKey !== 'unknown') return normalized;

  const semantic = label.trim().replace(/\s+/gu, ' ').toLowerCase();
  if (/opencv|默认摄像头|读取\s*camera/iu.test(semantic)) {
    return { id: '4', stageKey: 'stage-4', normalizedLabel: '阶段 4 OpenCV/GStreamer' };
  }
  if (/rknn/iu.test(semantic)) {
    const hasInferenceFlow = /camera|推理|inference/iu.test(semantic);
    return hasInferenceFlow
      ? { id: '6', stageKey: 'stage-6', normalizedLabel: '阶段 6 Camera + RKNN' }
      : { id: '5', stageKey: 'stage-5', normalizedLabel: '阶段 5 RKNN 最小例程' };
  }
  if (/streaming|rtmp|hls/iu.test(semantic)) {
    return { id: '8', stageKey: 'stage-8', normalizedLabel: '阶段 8 RTMP/HLS' };
  }
  if (/mipi\s*(?:display|显示)|(?:display|显示)\s*mipi/iu.test(semantic)) {
    return { id: '7', stageKey: 'stage-7', normalizedLabel: '阶段 7 MIPI 显示' };
  }
  return normalized;
}

async function indexEvidence(rootDir, markdown) {
  const warnings = [];
  let entries;
  try {
    entries = await readdir(path.join(rootDir, ...PATHS.evidenceAssets.split('/')), { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        evidence: [],
        warnings: [`Missing optional evidence assets: ${PATHS.evidenceAssets}`],
      };
    }
    throw error;
  }

  const assets = new Map();
  for (const entry of entries
    .filter((value) => value.isFile() && !value.name.startsWith('.'))
    .sort((left, right) => compareCodePoints(left.name, right.name))) {
    const normalizedName = entry.name.normalize('NFC');
    if (!assets.has(normalizedName)) assets.set(normalizedName, normalizedName);
  }

  const stages = new Map();
  for (const section of splitEvidenceSections(markdown)) {
    const stageResult = evidenceStage(section);
    const stageInfo = typeof stageResult === 'string'
      ? { label: stageResult, explicit: false }
      : stageResult;
    const stageLabel = stageInfo.label;
    const stage = normalizeEvidenceStage(stageLabel === 'unknown' ? section.heading : stageLabel);
    const contents = section.lines.join('\n');
    const sectionTargets = new Set(extractEvidenceTargets(contents));
    for (const name of sectionTargets) {
      if (!assets.has(name)) continue;
      if (!stages.has(name) || stages.get(name).stageKey === 'unknown') {
        stages.set(name, { label: stageLabel, explicit: stageInfo.explicit, ...stage });
      }
    }
  }

  const evidence = [...assets.values()]
    .sort(compareCodePoints)
    .map((name) => {
      const vaultPath = path.posix.join(PATHS.evidenceAssets, name);
      return {
        name,
        type: evidenceType(name),
        mediaType: evidenceMediaType(name),
        assetPath: path.posix.relative(DASHBOARD_DIRECTORY, vaultPath),
        vaultPath,
        sourcePath: PATHS.evidenceIndex,
        stageLabel: stages.get(name)?.label ?? 'unknown',
        evidenceStageKey: stages.get(name)?.stageKey ?? 'unknown',
      };
    });
  for (const item of evidence) {
    if (item.evidenceStageKey === 'unknown' && (item.stageLabel === 'unknown' || stages.get(item.name)?.explicit)) {
      warnings.push(`Evidence has unknown stage: ${item.name}`);
    }
  }

  return { evidence, warnings };
}

export async function buildDashboardData(rootDir, vaultName = DEFAULT_VAULT_NAME) {
  const sources = await Promise.all([
    readOptional(rootDir, PATHS.taskBoard, 'task board'),
    readOptional(rootDir, PATHS.acceptance, 'acceptance table'),
    readOptional(rootDir, PATHS.evidenceIndex, 'evidence index'),
  ]);
  const [taskBoard, acceptance, evidenceIndex] = sources.map(({ contents }) => contents);
  const warnings = sources.flatMap((source) => source.warnings);
  const { currentStage, currentTasks } = parseTaskBoard(taskBoard);
  const stages = parseStageTable(acceptance);
  const currentId = currentStage ? normalizeStageLabel(currentStage).id : '';

  for (const stage of stages) {
    if (stage.id === currentId) stage.status = 'current';
    if (stage.stageKey === 'unknown') warnings.push(`Unknown stage format: ${stage.label}`);
    if (stage.status === 'unknown') warnings.push(`Unknown stage status: ${stage.label}`);
  }

  const evidenceResult = await indexEvidence(rootDir, evidenceIndex);
  warnings.push(...evidenceResult.warnings);
  const noteCatalog = await buildNoteCatalog(rootDir, vaultName);
  warnings.push(...noteCatalog.warnings);
  const link = ([name, filePath]) => ({
    name,
    filePath,
    url: buildObsidianUrl(vaultName, filePath),
    webPath: noteCatalog.byPath.get(normalizeVaultPath(filePath)) ?? notePagePath(filePath),
  });

  return {
    currentStage,
    currentTasks,
    stages,
    domains: DOMAIN_MAP.map(link),
    evidence: evidenceResult.evidence,
    quickLinks: QUICK_LINKS.map(link),
    notes: noteCatalog.notes
      .map(({ filePath, folder, obsidianUrl, title, webPath }) => ({
        title,
        folder,
        filePath,
        webPath,
        url: obsidianUrl,
      }))
      .sort((left, right) => compareCodePoints(left.filePath, right.filePath)),
    warnings: [...new Set(warnings)],
  };
}

export async function writeDashboardData(rootDir, outputFile) {
  const data = await buildDashboardData(rootDir);
  const noteCatalog = await buildNoteCatalog(rootDir);
  await writeNotePages(rootDir, noteCatalog.notes, noteCatalog.linkMap);
  await rewriteSiteMarkdownLinks(rootDir, noteCatalog);
  await writeStaticNoteDirectory(rootDir, noteCatalog.notes);
  await rewriteStaticNavigation(rootDir, data.currentStage);
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `window.RK3568_VAULT_DATA = ${JSON.stringify(data, null, 2)};\n`, 'utf8');
  await rewriteSharedAssetVersions(rootDir, await sharedAssetVersion(rootDir, outputFile));
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  let rootDir = process.cwd();
  if (args[0]?.startsWith('-') && args[0] !== '--root') {
    process.stderr.write(`Unknown option: ${args[0]}\n`);
    process.exitCode = 2;
    return;
  }
  if (args[0] === '--root') {
    if (!args[1]) {
      process.stderr.write('Missing value for --root\n');
      process.exitCode = 2;
      return;
    }
    rootDir = args[1];
    if (args[2]) {
      process.stderr.write(`Unexpected argument: ${args[2]}\n`);
      process.exitCode = 2;
      return;
    }
  } else if (args[0]) {
    rootDir = args[0];
    if (args[1]) {
      process.stderr.write(`Unexpected argument: ${args[1]}\n`);
      process.exitCode = 2;
      return;
    }
  }
  try {
    if (!(await stat(rootDir)).isDirectory()) throw new Error('not a directory');
  } catch {
    process.stderr.write(`Root directory not found: ${rootDir}\n`);
    process.exitCode = 2;
    return;
  }
  const outputFile = path.join(rootDir, '00-首页', '学习驾驶舱', 'generated', 'vault-data.js');
  await writeDashboardData(rootDir, outputFile);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
