import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ARCHIVE_DIR = '99-归档';
const ARCHIVE_INDEX = '99-归档/00-归档说明.md';
const TASK_BOARD = '06-任务/01-下一步任务看板.md';
const IGNORED_WALK_DIRS = new Set(['.git', 'node_modules']);
const WIKILINK_PATTERN = /!?\[\[([^\]]+)\]\]/g;

function toVaultPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function withoutFragment(target) {
  return target.split('#', 1)[0];
}

function normalizeTarget(target) {
  return path.posix.normalize(target.replaceAll('\\', '/').replace(/^\/+/, ''));
}

function isActiveDocument(filePath) {
  const [topLevel] = filePath.split('/');
  return topLevel !== '.obsidian' && topLevel !== 'docs' && topLevel !== ARCHIVE_DIR;
}

function isValidatedDocument(filePath) {
  return filePath.split('/')[0] !== 'docs';
}

function isOrphanExempt(filePath) {
  const basename = path.posix.basename(filePath);
  return (
    filePath === 'README.md'
    || filePath === TASK_BOARD
    || /^00-.*入口\.md$/u.test(basename)
    || filePath.split('/').includes('generated')
  );
}

function isArchivePath(filePath) {
  return filePath === ARCHIVE_DIR || filePath.startsWith(`${ARCHIVE_DIR}/`);
}

function isIgnoredMarkdownTarget(target) {
  return (
    target.startsWith('#')
    || /^(?:https?|file|obsidian):\/\//iu.test(target)
  );
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function markdownLinkTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (trimmed.startsWith('<')) {
    const closingBracket = trimmed.indexOf('>');
    if (closingBracket !== -1) return trimmed.slice(1, closingBracket);
  }
  return trimmed.split(/\s+["']/u, 1)[0];
}

function stripFencedCode(contents) {
  let fence;

  return contents.split('\n').map((line) => {
    if (!fence) {
      const opening = line.match(/^ {0,3}(`{3,}|~{3,})/u);
      if (!opening) return line;
      fence = { character: opening[1][0], length: opening[1].length };
      return '';
    }

    const trimmed = line.trimStart();
    const closingRun = trimmed.match(/^(`+|~+)/u)?.[1];
    if (
      closingRun
      && closingRun[0] === fence.character
      && closingRun.length >= fence.length
      && trimmed.slice(closingRun.length).trim() === ''
    ) {
      fence = undefined;
    }
    return '';
  }).join('\n');
}

function markdownLinkDestinations(contents) {
  const destinations = [];

  for (let index = 0; index < contents.length - 1; index += 1) {
    if (contents[index] !== ']' || contents[index + 1] !== '(') continue;

    const start = index + 2;
    let firstCharacter = start;
    while (contents[firstCharacter] === ' ' || contents[firstCharacter] === '\t') {
      firstCharacter += 1;
    }

    if (contents[firstCharacter] === '<') {
      let angleEnd = -1;
      let escaped = false;
      for (let cursor = firstCharacter + 1; cursor < contents.length; cursor += 1) {
        const character = contents[cursor];
        if (character === '\n' || character === '\r') break;
        if (escaped) {
          escaped = false;
          continue;
        }
        if (character === '\\') {
          escaped = true;
          continue;
        }
        if (character === '>') {
          angleEnd = cursor;
          break;
        }
      }

      if (angleEnd === -1) continue;

      let outerEnd = angleEnd + 1;
      while (/\s/u.test(contents[outerEnd] ?? '')) outerEnd += 1;
      const titleDelimiter = contents[outerEnd];
      if (titleDelimiter === '"' || titleDelimiter === "'") {
        outerEnd += 1;
        let titleEscaped = false;
        while (outerEnd < contents.length) {
          const character = contents[outerEnd];
          if (titleEscaped) titleEscaped = false;
          else if (character === '\\') titleEscaped = true;
          else if (character === titleDelimiter) {
            outerEnd += 1;
            break;
          }
          outerEnd += 1;
        }
        while (/\s/u.test(contents[outerEnd] ?? '')) outerEnd += 1;
      }

      if (contents[outerEnd] === ')') {
        destinations.push(contents.slice(start, angleEnd + 1));
        index = outerEnd;
      }
      continue;
    }

    let depth = 1;
    let escaped = false;
    for (let cursor = start; cursor < contents.length; cursor += 1) {
      const character = contents[cursor];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === '\\') {
        escaped = true;
        continue;
      }
      if (character === '(') depth += 1;
      if (character !== ')') continue;

      depth -= 1;
      if (depth === 0) {
        destinations.push(contents.slice(start, cursor));
        index = cursor;
        break;
      }
    }
  }

  return destinations;
}

function unescapeMarkdownDestination(target) {
  return target.replace(/\\([\\()])/gu, '$1');
}

function addIssue(collection, seen, issue) {
  const key = `${issue.source}\0${issue.target}`;
  if (!seen.has(key)) {
    seen.add(key);
    collection.push(issue);
  }
}

function sortIssues(issues) {
  issues.sort((left, right) => (
    left.source.localeCompare(right.source, 'zh-CN')
    || left.target.localeCompare(right.target, 'zh-CN')
  ));
}

async function collectFiles(rootDir) {
  const files = [];

  async function walk(relativeDir) {
    const absoluteDir = path.join(rootDir, relativeDir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
      if (entry.isDirectory()) {
        if (!IGNORED_WALK_DIRS.has(entry.name)) await walk(relativePath);
      } else if (entry.isFile()) {
        files.push(toVaultPath(relativePath));
      }
    }
  }

  await walk('');
  return files.sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

function createWikilinkResolver(allFiles) {
  const exactFiles = new Set(allFiles);
  const byBasename = new Map();

  for (const filePath of allFiles) {
    const basename = path.posix.basename(filePath);
    const keys = new Set([basename]);
    if (basename.toLowerCase().endsWith('.md')) keys.add(basename.slice(0, -3));

    for (const key of keys) {
      const matches = byBasename.get(key) ?? [];
      matches.push(filePath);
      byBasename.set(key, matches);
    }
  }

  return (rawTarget, source) => {
    const target = normalizeTarget(rawTarget);
    const hasExplicitPath = /[\\/]/u.test(rawTarget);
    const sourceDir = path.posix.dirname(source);
    if (hasExplicitPath) {
      const candidates = [target];
      if (!path.posix.extname(target)) candidates.push(`${target}.md`);
      if (sourceDir !== '.') {
        candidates.push(normalizeTarget(path.posix.join(sourceDir, target)));
        if (!path.posix.extname(target)) {
          candidates.push(normalizeTarget(path.posix.join(sourceDir, `${target}.md`)));
        }
      }

      for (const candidate of candidates) {
        if (exactFiles.has(candidate)) return candidate;
      }
      return undefined;
    }

    const basename = path.posix.basename(target);
    const basenameMatches = byBasename.get(basename) ?? [];
    return basenameMatches.length === 1 ? basenameMatches[0] : undefined;
  };
}

function resolveRelativeLink(rawTarget, source, allFiles) {
  const decoded = decodeTarget(withoutFragment(unescapeMarkdownDestination(rawTarget)));
  if (!decoded) return undefined;

  const sourceDir = path.posix.dirname(source);
  const target = decoded.startsWith('/')
    ? normalizeTarget(decoded)
    : normalizeTarget(path.posix.join(sourceDir, decoded));

  if (allFiles.has(target)) return target;
  if (!path.posix.extname(target) && allFiles.has(`${target}.md`)) return `${target}.md`;
  return undefined;
}

export async function scanVault(rootDir) {
  const absoluteRoot = path.resolve(rootDir);
  const allFiles = await collectFiles(absoluteRoot);
  const allFileSet = new Set(allFiles);
  const markdownFiles = allFiles.filter((filePath) => filePath.toLowerCase().endsWith('.md'));
  const activeDocuments = markdownFiles.filter(isActiveDocument);
  const activeDocumentSet = new Set(activeDocuments);
  const incomingActiveLinks = new Set();
  const resolveWikilink = createWikilinkResolver(allFiles);
  const brokenWikiLinks = [];
  const brokenRelativeLinks = [];
  const activeToArchiveLinks = [];
  const seenBrokenWiki = new Set();
  const seenBrokenRelative = new Set();
  const seenArchiveLinks = new Set();

  for (const source of markdownFiles.filter(isValidatedDocument)) {
    const rawContents = await readFile(path.join(absoluteRoot, ...source.split('/')), 'utf8');
    const contents = stripFencedCode(rawContents);
    const sourceIsActive = activeDocumentSet.has(source);

    for (const match of contents.matchAll(WIKILINK_PATTERN)) {
      const target = match[1].split('|', 1)[0].split('#', 1)[0].trim();
      if (!target) continue;

      const resolved = resolveWikilink(target, source);
      if (!resolved) {
        addIssue(brokenWikiLinks, seenBrokenWiki, { source, target });
        continue;
      }

      if (sourceIsActive && activeDocumentSet.has(resolved) && resolved !== source) {
        incomingActiveLinks.add(resolved);
      }
      if (sourceIsActive && isArchivePath(resolved) && resolved !== ARCHIVE_INDEX) {
        addIssue(activeToArchiveLinks, seenArchiveLinks, { source, target: resolved });
      }
    }

    for (const rawTarget of markdownLinkDestinations(contents)) {
      const target = markdownLinkTarget(rawTarget);
      if (!target || isIgnoredMarkdownTarget(target)) continue;

      const resolved = resolveRelativeLink(target, source, allFileSet);
      if (!resolved) {
        addIssue(brokenRelativeLinks, seenBrokenRelative, { source, target });
        continue;
      }

      if (sourceIsActive && activeDocumentSet.has(resolved) && resolved !== source) {
        incomingActiveLinks.add(resolved);
      }
      if (sourceIsActive && isArchivePath(resolved) && resolved !== ARCHIVE_INDEX) {
        addIssue(activeToArchiveLinks, seenArchiveLinks, { source, target: resolved });
      }
    }
  }

  sortIssues(brokenWikiLinks);
  sortIssues(brokenRelativeLinks);
  sortIssues(activeToArchiveLinks);

  return {
    markdownFiles,
    brokenWikiLinks,
    brokenRelativeLinks,
    activeToArchiveLinks,
    orphanActiveDocs: activeDocuments
      .filter((filePath) => !isOrphanExempt(filePath) && !incomingActiveLinks.has(filePath))
      .sort((left, right) => left.localeCompare(right, 'zh-CN')),
  };
}

function printHumanResult(result) {
  console.log(`Markdown files: ${result.markdownFiles.length}`);
  console.log(`Broken wikilinks: ${result.brokenWikiLinks.length}`);
  console.log(`Broken relative links: ${result.brokenRelativeLinks.length}`);
  console.log(`Active-to-archive links: ${result.activeToArchiveLinks.length}`);
  console.log(`Orphan active docs (warnings): ${result.orphanActiveDocs.length}`);
}

class CliUsageError extends Error {}

function parseCliArgs(args) {
  let json = false;
  const positionalArgs = [];

  for (const argument of args) {
    if (argument === '--json') {
      json = true;
    } else if (argument.startsWith('-')) {
      throw new CliUsageError(`Unknown option: ${argument}`);
    } else {
      positionalArgs.push(argument);
    }
  }

  if (positionalArgs.length > 1) {
    throw new CliUsageError('Expected at most one vault path');
  }

  return { json, rootDir: positionalArgs[0] ?? '.' };
}

async function runCli() {
  const { json, rootDir } = parseCliArgs(process.argv.slice(2));
  const result = await scanVault(rootDir);

  if (json) console.log(JSON.stringify(result, null, 2));
  else printHumanResult(result);

  if (
    result.brokenWikiLinks.length > 0
    || result.brokenRelativeLinks.length > 0
    || result.activeToArchiveLinks.length > 0
  ) {
    process.exitCode = 1;
  }
}

const isMainModule = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  runCli().catch((error) => {
    if (error instanceof CliUsageError) {
      console.error(error.message);
      process.exitCode = 2;
    } else {
      console.error(error);
      process.exitCode = 1;
    }
  });
}
