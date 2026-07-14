import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PATHS = {
  taskBoard: '06-任务/01-下一步任务看板.md',
  acceptance: '07-专项笔记/系统/AI Camera分阶段验收标准.md',
  evidenceIndex: '05-实验与证据/实验产物/01-实验产物索引.md',
  evidenceAssets: '05-实验与证据/实验产物/assets',
};

const DOMAIN_MAP = [
  ['Camera', '07-专项笔记/Camera-V4L2/IMX415驱动调试与最小demo路线.md'],
  ['OpenCV', '07-专项笔记/OpenCV/OpenCV读取Camera记录.md'],
  ['RKNN', '07-专项笔记/AI-RKNN/官方AI例程运行记录.md'],
  ['Display', '07-专项笔记/Display-MIPI/MIPI屏显示链路.md'],
  ['Streaming', '07-专项笔记/Streaming/RTMP-HLS推流记录.md'],
  ['System', '07-专项笔记/系统/AI Camera系统数据流与模块边界.md'],
];

const QUICK_LINKS = [
  ['taskBoard', PATHS.taskBoard],
  ['activeRoute', '01-主线/02-从零到Python MVP学习路线.md'],
  ['dailyRecord', '05-实验与证据/02-每日进度记录.md'],
  ['acceptance', PATHS.acceptance],
  ['project', '04-项目/01-RK3568 YOLOv8n AI Camera项目.md'],
  ['demo', '04-项目/03-Python MVP演示手册.md'],
  ['evidenceMoc', '05-实验与证据/00-实验与证据入口.md'],
  ['outputMoc', '09-输出沉淀/00-输出沉淀入口.md'],
];

function section(markdown, heading) {
  const match = markdown.match(new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'mu'));
  return match ? match[1] : '';
}

function normalizeStatus(value) {
  const normalized = value.trim().toLowerCase();
  if (['current', '进行中', '当前'].includes(normalized)) return 'current';
  if (['verified', '已验证', '已驗證'].includes(normalized)) return 'verified';
  if (['planned', '计划', '計劃'].includes(normalized)) return 'planned';
  return 'unknown';
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
    return {
      id: label.match(/^\d+/u)?.[0] ?? '',
      label,
      question: values['要回答的问题'] ?? '',
      minimumEvidence: values['最小输出证据'] ?? '',
      criteria: values['通过标准'] ?? '',
      evidenceEntry: values['证据入口'] ?? '',
      status: normalizeStatus(values['状态'] ?? ''),
    };
  }).filter((stage) => stage.id);
}

export function buildObsidianUrl(vault, filePath) {
  const normalizedPath = filePath.replace(/\\/gu, '/').replace(/\.md$/iu, '');
  return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(normalizedPath)}`;
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
    if (field[1]) return field[1];
    for (const candidate of section.lines.slice(index + 1)) {
      const value = candidate.trim();
      if (!value || /^(?:```|~~~)/u.test(value)) continue;
      return value;
    }
  }
  return section.heading.match(/^(阶段\s*\d+.+)$/u)?.[1].trim() ?? 'unknown';
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
  for (const entry of entries.filter((value) => value.isFile()).sort((left, right) => compareCodePoints(left.name, right.name))) {
    const normalizedName = entry.name.normalize('NFC');
    if (!assets.has(normalizedName)) assets.set(normalizedName, normalizedName);
  }

  const stages = new Map();
  const referenced = new Set();
  for (const section of splitEvidenceSections(markdown)) {
    const stageLabel = evidenceStage(section);
    const contents = section.lines.join('\n');
    const sectionTargets = new Set(extractEvidenceTargets(contents));
    for (const name of sectionTargets) {
      referenced.add(name);
      if (!assets.has(name)) continue;
      if (!stages.has(name) || stages.get(name) === 'unknown') stages.set(name, stageLabel);
    }
  }

  for (const name of [...referenced].filter((value) => !assets.has(value)).sort(compareCodePoints)) {
    warnings.push(`Missing optional evidence asset: ${name}`);
  }

  const evidence = [...assets.values()]
    .sort(compareCodePoints)
    .map((name) => ({
      name,
      type: evidenceType(name),
      sourcePath: PATHS.evidenceIndex,
      stageLabel: stages.get(name) ?? 'unknown',
    }));
  for (const item of evidence) {
    if (item.stageLabel === 'unknown') warnings.push(`Evidence has unknown stage: ${item.name}`);
  }

  return { evidence, warnings };
}

export async function buildDashboardData(rootDir) {
  const sources = await Promise.all([
    readOptional(rootDir, PATHS.taskBoard, 'task board'),
    readOptional(rootDir, PATHS.acceptance, 'acceptance table'),
    readOptional(rootDir, PATHS.evidenceIndex, 'evidence index'),
  ]);
  const [taskBoard, acceptance, evidenceIndex] = sources.map(({ contents }) => contents);
  const warnings = sources.flatMap((source) => source.warnings);
  const { currentStage, currentTasks } = parseTaskBoard(taskBoard);
  const stages = parseStageTable(acceptance);
  const currentId = currentStage?.match(/阶段\s*(\d+)/u)?.[1];

  for (const stage of stages) {
    if (stage.id === currentId) stage.status = 'current';
    if (stage.status === 'unknown') warnings.push(`Unknown stage status: ${stage.label}`);
  }

  const evidenceResult = await indexEvidence(rootDir, evidenceIndex);
  warnings.push(...evidenceResult.warnings);
  const vault = path.basename(path.resolve(rootDir));
  const link = ([name, filePath]) => ({ name, filePath, url: buildObsidianUrl(vault, filePath) });

  return {
    currentStage,
    currentTasks,
    stages,
    domains: DOMAIN_MAP.map(link),
    evidence: evidenceResult.evidence,
    quickLinks: QUICK_LINKS.map(link),
    warnings: [...new Set(warnings)],
  };
}

export async function writeDashboardData(rootDir, outputFile) {
  const data = await buildDashboardData(rootDir);
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `window.RK3568_VAULT_DATA = ${JSON.stringify(data, null, 2)};\n`, 'utf8');
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
