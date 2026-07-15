(function () {
  'use strict';

  function renderSiteState() {
    var data = window.RK3568_VAULT_DATA || {};
    var currentStage = data.currentStage;
    var currentTasks = Array.isArray(data.currentTasks) ? data.currentTasks : [];
    var evidence = Array.isArray(data.evidence) ? data.evidence : [];
    var currentTask = currentTasks.find(function (task) {
      return task && task.completed !== true;
    });
    var stageNodes = document.querySelectorAll('[data-current-stage]');
    var taskNodes = document.querySelectorAll('[data-current-task]');
    var evidenceNodes = document.querySelectorAll('[data-evidence-count]');

    stageNodes.forEach(function (node) {
      node.textContent = currentStage || '尚未生成当前阶段';
    });
    taskNodes.forEach(function (node) {
      node.textContent = currentTask && currentTask.text ? currentTask.text : '当前没有未完成任务';
    });
    evidenceNodes.forEach(function (node) {
      node.textContent = String(evidence.length);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSiteState);
  } else {
    renderSiteState();
  }
}());
