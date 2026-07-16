(function () {
  'use strict';

  function cleanMarkdown(value) {
    return String(value || '')
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
  }

  function renderSiteState() {
    var data = window.RK3568_VAULT_DATA || {};
    var currentStage = cleanMarkdown(data.currentStage);
    var stages = Array.isArray(data.stages) ? data.stages : [];
    var currentTasks = Array.isArray(data.currentTasks) ? data.currentTasks : [];
    var evidence = Array.isArray(data.evidence) ? data.evidence : [];
    var quickLinks = Array.isArray(data.quickLinks) ? data.quickLinks : [];
    var currentTask = null;
    var taskBoard = null;
    var i;
    var stageNodes = document.querySelectorAll('[data-current-stage]');
    var taskNodes = document.querySelectorAll('[data-current-task]');
    var taskLinks = document.querySelectorAll('[data-current-task-link]');
    var evidenceNodes = document.querySelectorAll('[data-evidence-count]');
    var stageCardNodes = document.querySelectorAll('[data-stage]');
    var currentStageId = null;

    for (i = 0; i < stages.length; i += 1) {
      if (stages[i] && stages[i].status === 'current' && stages[i].id !== undefined) {
        currentStageId = String(stages[i].id);
        break;
      }
    }

    for (i = 0; i < currentTasks.length; i += 1) {
      if (currentTasks[i] && currentTasks[i].completed !== true) {
        currentTask = currentTasks[i];
        break;
      }
    }
    for (i = 0; i < quickLinks.length; i += 1) {
      if (quickLinks[i] && quickLinks[i].name === 'taskBoard') {
        taskBoard = quickLinks[i];
        break;
      }
    }
    for (i = 0; i < stageNodes.length; i += 1) {
      stageNodes[i].textContent = currentStage || '尚未生成当前阶段';
    }
    for (i = 0; i < stageCardNodes.length; i += 1) {
      var stageCard = stageCardNodes[i];
      var stageId = stageCard.getAttribute('data-stage');
      var isCurrent = currentStageId !== null && stageId === currentStageId;
      var badge = stageCard.querySelector('.badge');
      stageCard.setAttribute('data-current', isCurrent ? 'true' : 'false');
      if (isCurrent) {
        stageCard.classList.add('card--current');
        if (badge) badge.classList.add('badge--current');
      } else {
        stageCard.classList.remove('card--current');
        if (badge) badge.classList.remove('badge--current');
      }
      if (badge) badge.textContent = '阶段 ' + stageId + (isCurrent ? ' · 当前' : '');
    }
    for (i = 0; i < taskNodes.length; i += 1) {
      taskNodes[i].textContent = currentTask && currentTask.text ? cleanMarkdown(currentTask.text) : '当前没有未完成任务';
    }
    for (i = 0; i < taskLinks.length; i += 1) {
      if (taskBoard && taskBoard.url) taskLinks[i].href = taskBoard.url;
    }
    for (i = 0; i < evidenceNodes.length; i += 1) {
      evidenceNodes[i].textContent = String(evidence.length);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSiteState);
  } else {
    renderSiteState();
  }
}());
