const byId = (id) => document.getElementById(id);
const asArray = (value) => Array.isArray(value) ? value : [];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function cleanMarkdown(value) {
  return String(value ?? '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/gu, '$2')
    .replace(/\[\[([^\]]+)\]\]/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1');
}

function empty(container, message) {
  container.replaceChildren(element('p', 'empty-state', message));
}

function renderCurrentState(vaultData) {
  const container = byId('current-state');
  const stageCard = element('article', 'state-card state-card--stage');
  stageCard.append(element('span', 'state-card__label', '当前阶段'));
  stageCard.append(element('h2', '', cleanMarkdown(vaultData.currentStage) || '暂无阶段数据'));

  const taskCard = element('article', 'state-card state-card--tasks');
  taskCard.append(element('h2', 'state-card__label', '本轮唯一任务'));
  const tasks = asArray(vaultData.currentTasks);
  if (!tasks.length) {
    taskCard.append(element('p', 'empty-state', '任务看板尚未提供当前任务。'));
  } else {
    const list = element('ul', 'task-list');
    for (const task of tasks) {
      const item = element('li', task.completed ? 'is-complete' : '', cleanMarkdown(task.text));
      if (task.completed) item.setAttribute('aria-label', `已完成：${cleanMarkdown(task.text)}`);
      list.append(item);
    }
    taskCard.append(list);
  }
  container.replaceChildren(stageCard, taskCard);
}

function renderStages(vaultData) {
  const container = byId('stage-map');
  const stages = asArray(vaultData.stages);
  if (!stages.length) return empty(container, '尚未生成阶段地图。');

  const statusLabels = { current: '当前', verified: '已验证', planned: '计划中', unknown: '未标注' };
  const fragment = document.createDocumentFragment();
  for (const stage of stages) {
    const status = Object.hasOwn(statusLabels, stage.status) ? stage.status : 'unknown';
    const card = element('article', `stage-card stage-card--${status}`);
    const top = element('div', 'stage-card__top');
    top.append(element('h3', '', cleanMarkdown(stage.label) || `阶段 ${stage.id ?? '—'}`));
    top.append(element('span', `status-badge status-badge--${status}`, statusLabels[status]));
    const details = element('dl');
    for (const [label, value] of [
      ['要回答的问题', stage.question],
      ['最小证据', stage.minimumEvidence],
      ['通过标准', stage.criteria],
    ]) {
      details.append(element('dt', '', label), element('dd', '', cleanMarkdown(value) || '未提供'));
    }
    card.append(top, details);
    fragment.append(card);
  }
  container.replaceChildren(fragment);
}

function pipelineNodes(vaultData) {
  const taskText = asArray(vaultData.currentTasks).map((task) => cleanMarkdown(task.text));
  const boundaryTask = taskText.find((text) => /说明.+边界/u.test(text));
  const sequence = boundaryTask?.match(/说明\s*(.+?)的边界/u)?.[1];
  if (sequence) return sequence.split(/[、，,]|和/u).map((item) => item.trim()).filter(Boolean);
  return asArray(vaultData.domains).map((domain) => domain.name).filter(Boolean);
}

function renderPipeline(vaultData) {
  const container = byId('pipeline-flow');
  const nodes = pipelineNodes(vaultData);
  if (!nodes.length) return empty(container, '当前数据尚未描述 AI Camera 链路。');
  const list = element('ol', 'pipeline-list');
  nodes.forEach((node) => list.append(element('li', '', node)));
  const note = element('p', 'pipeline-note', cleanMarkdown(vaultData.currentStage));
  container.replaceChildren(list, note);
}

function obsidianButton(label, item, className = 'button') {
  const button = element('button', className, label);
  button.type = 'button';
  button.addEventListener('click', () => openObsidian(item.url, item.filePath));
  return button;
}

function renderDomains(vaultData) {
  const container = byId('domain-grid');
  const domains = asArray(vaultData.domains);
  if (!domains.length) return empty(container, '尚未生成技术领域入口。');
  const fragment = document.createDocumentFragment();
  domains.forEach((domain, index) => {
    const card = element('article', 'domain-card');
    card.append(element('span', 'domain-card__index', String(index + 1).padStart(2, '0')));
    card.append(element('h3', '', domain.name));
    card.append(element('p', '', domain.filePath));
    card.append(obsidianButton(`打开 ${domain.name}`, domain, ''));
    fragment.append(card);
  });
  container.replaceChildren(fragment);
}

function renderEvidence(vaultData) {
  const container = byId('evidence-grid');
  const evidence = asArray(vaultData.evidence);
  byId('evidence-count').textContent = `${evidence.length} 项本地证据`;
  if (!evidence.length) return empty(container, '尚未生成图片或视频证据。');

  const fragment = document.createDocumentFragment();
  for (const item of evidence) {
    const unknown = !item.stageLabel || item.stageLabel === 'unknown';
    const stageLabel = unknown ? '未标注' : cleanMarkdown(item.stageLabel);
    const card = element('article', 'evidence-card');
    let media;
    if (item.type === 'video') {
      media = element('video');
      media.controls = true;
      media.preload = 'metadata';
      media.title = `${stageLabel}：${item.name}`;
      if (item.mediaType) {
        const source = element('source');
        source.src = item.assetPath;
        source.type = item.mediaType;
        media.append(source);
      } else {
        media.src = item.assetPath;
      }
    } else {
      media = element('img');
      media.src = item.assetPath;
      media.alt = `${stageLabel}的实验图像：${item.name}`;
      media.loading = 'lazy';
      media.decoding = 'async';
    }
    const mediaBox = element('div', 'evidence-card__media');
    mediaBox.append(media);
    const body = element('div', 'evidence-card__body');
    body.append(element('h3', '', item.name));
    body.append(element('p', unknown ? 'unknown-label' : '', stageLabel));
    const open = element('a', 'media-open', '在新窗口打开媒体');
    open.href = item.assetPath;
    open.target = '_blank';
    open.rel = 'noopener';
    open.setAttribute('aria-label', `打开证据媒体 ${item.name}`);
    body.append(open);
    card.append(mediaBox, body);
    fragment.append(card);
  }
  container.replaceChildren(fragment);
}

function renderQuickLinks(vaultData) {
  const container = byId('quick-link-grid');
  const links = asArray(vaultData.quickLinks);
  if (!links.length) return empty(container, '尚未生成 Obsidian 快速入口。');
  const actionNames = new Set(['taskBoard', 'dailyRecord', 'acceptance']);
  const labels = {
    taskBoard: '打开任务看板',
    dailyRecord: '记录今日进度',
    acceptance: '查看阶段验收',
    activeRoute: '打开学习路线',
    project: '打开项目说明',
    demo: '打开演示手册',
    evidenceMoc: '打开证据入口',
    outputMoc: '打开输出入口',
  };
  const ordered = [...links].sort((left, right) => Number(actionNames.has(right.name)) - Number(actionNames.has(left.name)));
  const fragment = document.createDocumentFragment();
  for (const item of ordered) {
    const className = actionNames.has(item.name) ? 'quick-button' : 'quick-button quick-button--secondary';
    fragment.append(obsidianButton(labels[item.name] || item.name, item, className));
  }
  container.replaceChildren(fragment);
}

function renderDiagnostics(vaultData) {
  const warnings = asArray(vaultData.warnings);
  const details = byId('diagnostics-details');
  const summary = details.querySelector('summary');
  summary.textContent = warnings.length ? `诊断信息（${warnings.length} 条）` : '诊断信息（无警告）';
  const list = byId('diagnostics-list');
  if (!warnings.length) {
    list.replaceChildren(element('li', '', '生成数据未报告警告。'));
    return;
  }
  list.replaceChildren(...warnings.map((warning) => element('li', '', warning)));
}

function copyFallbackPath(path) {
  const status = byId('copy-status');
  const legacyCopy = () => {
    const input = document.createElement('textarea');
    input.value = path;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('copy unavailable');
  };
  const operation = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText(path)
    : Promise.resolve().then(legacyCopy);
  operation.then(() => { status.textContent = '已复制'; }).catch(() => { status.textContent = '请手动选择路径复制'; });
}

function openObsidian(url, fallbackPath) {
  const fallback = byId('obsidian-fallback');
  const path = String(fallbackPath || '未提供路径');
  byId('fallback-path').textContent = path;
  byId('copy-status').textContent = '';
  fallback.hidden = false;
  byId('fallback-copy').onclick = () => copyFallbackPath(path);
  if (typeof url === 'string' && url.startsWith('obsidian://')) window.location.href = url;
}

function handleObsidianAction(event) {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest('[data-obsidian-url][data-fallback-path]');
  if (!trigger) return;
  openObsidian(trigger.dataset.obsidianUrl, trigger.dataset.fallbackPath);
}

function showFatalError(error) {
  const alert = byId('data-alert');
  alert.hidden = false;
  alert.textContent = `驾驶舱数据无法加载：${error.message}`;
  for (const id of ['current-state', 'stage-map', 'pipeline-flow', 'domain-grid', 'evidence-grid', 'quick-link-grid']) {
    empty(byId(id), '暂无可显示的数据。请先在仓库根目录重新生成驾驶舱数据。');
  }
  renderDiagnostics({ warnings: [error.message] });
}

function start() {
  const data = window.RK3568_VAULT_DATA;
  try {
    if (!data || typeof data !== 'object') throw new Error('未找到 window.RK3568_VAULT_DATA');
    renderCurrentState(data);
    renderStages(data);
    renderPipeline(data);
    renderDomains(data);
    renderEvidence(data);
    renderQuickLinks(data);
    renderDiagnostics(data);
  } catch (error) {
    showFatalError(error instanceof Error ? error : new Error(String(error)));
  }
}

function initialize() {
  byId('fallback-close').addEventListener('click', () => { byId('obsidian-fallback').hidden = true; });
  document.addEventListener('click', handleObsidianAction);
  start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
