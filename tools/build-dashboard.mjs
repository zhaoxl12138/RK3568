import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
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

export function parseStageTable(markdown) {
  const table = section(markdown, '阶段总表');
  const lines = table.split(/\r?\n/u).filter((line) => line.trim().startsWith('|'));
  if (lines.length < 3) return [];

  const headers = lines[0].split('|').slice(1, -1).map((value) => value.trim());
  return lines.slice(2).map((line) => {
    const cells = line.split('|').slice(1, -1).map((value) => value.trim());
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

async function readOptional(rootDir, relativePath, warnings, description) {
  try {
    return await readFile(path.join(rootDir, ...relativePath.split('/')), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') warnings.push(`Missing optional ${description}: ${relativePath}`);
    else throw error;
    return '';
  }
}

function evidenceType(fileName) {
  if (/\.(?:jpg|jpeg|png|gif|webp|svg)$/iu.test(fileName)) return 'image';
  if (/\.(?:mp4|webm|mov|mkv)$/iu.test(fileName)) return 'video';
  return 'file';
}

async function indexEvidence(rootDir, markdown, warnings) {
  if (!markdown) return [];
  const sourcePath = PATHS.evidenceIndex;
  const lines = markdown.split(/\r?\n/u);
  let stageLabel = 'unknown';
  const evidence = [];
  const linkedNames = new Set();

  for (const line of lines) {
    const isHeading = /^#{3,}\s+/u.test(line);
    const heading = line.match(/^#{3,}\s+(阶段\s*\d+.+)$/u);
    if (isHeading) stageLabel = heading ? heading[1].trim() : 'unknown';
    for (const match of line.matchAll(/!\[\[([^\]]+)\]\]|\[[^\]]+\]\((?:assets\/)?([^\)]+)\)/gu)) {
      const name = path.basename(match[1] ?? match[2]);
      if (linkedNames.has(name)) continue;
      linkedNames.add(name);
      const assetPath = path.join(rootDir, ...PATHS.evidenceAssets.split('/'), name);
      try {
        await access(assetPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          warnings.push(`Missing optional evidence asset: ${name}`);
          continue;
        }
        throw error;
      }
      if (stageLabel === 'unknown') warnings.push(`Evidence has unknown stage: ${name}`);
      evidence.push({ name, type: evidenceType(name), sourcePath, stageLabel });
    }
  }

  return evidence.sort((left, right) => left.name.localeCompare(right.name));
}

export async function buildDashboardData(rootDir) {
  const warnings = [];
  const [taskBoard, acceptance, evidenceIndex] = await Promise.all([
    readOptional(rootDir, PATHS.taskBoard, warnings, 'task board'),
    readOptional(rootDir, PATHS.acceptance, warnings, 'acceptance table'),
    readOptional(rootDir, PATHS.evidenceIndex, warnings, 'evidence index'),
  ]);
  const { currentStage, currentTasks } = parseTaskBoard(taskBoard);
  const stages = parseStageTable(acceptance);
  const currentId = currentStage?.match(/阶段\s*(\d+)/u)?.[1];

  for (const stage of stages) {
    if (stage.id === currentId) stage.status = 'current';
    if (stage.status === 'unknown') warnings.push(`Unknown stage status: ${stage.label}`);
  }

  const evidence = await indexEvidence(rootDir, evidenceIndex, warnings);
  if (!evidenceIndex) warnings.push('Missing optional evidence assets/index data');
  const vault = path.basename(path.resolve(rootDir));
  const link = ([name, filePath]) => ({ name, filePath, url: buildObsidianUrl(vault, filePath) });

  return {
    currentStage,
    currentTasks,
    stages,
    domains: DOMAIN_MAP.map(link),
    evidence,
    quickLinks: QUICK_LINKS.map(link),
    warnings,
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
  if (args.length > 0) {
    if (args.length !== 2 || args[0] !== '--root') {
      process.stderr.write(`Unknown option: ${args[0]}\n`);
      process.exitCode = 2;
      return;
    }
    rootDir = args[1];
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
