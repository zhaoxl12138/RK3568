(function () {
  'use strict';

  function cleanMarkdown(value) {
    return String(value || '')
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/gu, '$2')
      .replace(/\[\[([^\]]+)\]\]/gu, '$1')
      .replace(/`([^`]+)`/gu, '$1');
  }

  function renderState() {
    var data = window.RK3568_VAULT_DATA || {};
    var tasks = Array.isArray(data.currentTasks) ? data.currentTasks : [];
    var task = tasks.find(function (item) { return item && item.completed !== true; });
    document.querySelectorAll('[data-current-stage]').forEach(function (node) {
      node.textContent = cleanMarkdown(data.currentStage) || '尚未生成当前阶段';
    });
    document.querySelectorAll('[data-current-task]').forEach(function (node) {
      node.textContent = task && task.text ? cleanMarkdown(task.text) : '当前没有未完成任务';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderState);
  } else {
    renderState();
  }
}());
