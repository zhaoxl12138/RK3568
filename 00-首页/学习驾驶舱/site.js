(function () {
  'use strict';

  var courseRuntime = window.RK3568_COURSE || { currentStage: '', stages: [] };
  var courseCurrentStageId = courseRuntime.currentStage;
  var courseStages = courseRuntime.stages;

  function cleanMarkdown(value) {
    return String(value || '')
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
  }

  function getSiteRootUrl() {
    var scripts = document.getElementsByTagName('script');
    var i;
    for (i = scripts.length - 1; i >= 0; i -= 1) {
      if (/\/site\.js(?:[?#].*)?$/.test(scripts[i].src || '')) {
        return new URL('./', scripts[i].src);
      }
    }
    return new URL('./', window.location.href);
  }

  function findQuickLink(quickLinks, name) {
    var i;
    for (i = 0; i < quickLinks.length; i += 1) {
      if (quickLinks[i] && quickLinks[i].name === name) return quickLinks[i];
    }
    return null;
  }

  function currentCourseStage() {
    var i;
    for (i = 0; i < courseStages.length; i += 1) {
      if (courseStages[i].id === courseCurrentStageId) return courseStages[i];
    }
    return courseStages[0];
  }

  function decodedPathname() {
    try {
      return decodeURIComponent(window.location.pathname);
    } catch {
      return window.location.pathname;
    }
  }

  function decodedUrlPath(urlValue) {
    try {
      return decodeURIComponent(urlValue.pathname).replace(/\\/g, '/').replace(/\/$/, '');
    } catch (error) {
      return urlValue.pathname.replace(/\\/g, '/').replace(/\/$/, '');
    }
  }

  function courseStageStatus(stage) {
    var currentIndex = parseInt(courseCurrentStageId, 10);
    var stageIndex = parseInt(stage.id, 10);
    if (stage.id === courseCurrentStageId) return 'is-current';
    if (stageIndex < currentIndex) return 'is-complete';
    return 'is-planned';
  }

  function courseMaturityLabel(stage) {
    var labels = {
      placeholder: '草稿',
      'in-progress': '学习中',
      validated: '已验证',
      published: '已发布',
    };
    return labels[stage.maturity] || '草稿';
  }

  function noteRole(note) {
    var filePath = String(note.filePath || '');
    if (filePath.indexOf('01-课程主线/') === 0) return '课程正文';
    if (filePath.indexOf('02-源码陪读/') === 0) return '源码陪读';
    if (filePath.indexOf('05-实验与证据/') === 0) return '实板证据';
    if (filePath.indexOf('09-输出沉淀/') === 0) return '面试输出';
    if (filePath.indexOf('06-任务/') === 0) return '执行与复盘';
    return '专题参考';
  }

  function findCourseStageForPage(siteRoot, pageUrl) {
    var currentPath = decodedUrlPath(pageUrl || new URL(window.location.href));
    var i;
    for (i = 0; i < courseStages.length; i += 1) {
      if (decodedUrlPath(new URL(courseStages[i].path, siteRoot)) === currentPath) {
        return { index: i, stage: courseStages[i] };
      }
    }
    return null;
  }

  function appendNavigationLink(container, item, activeKey, siteRoot) {
    var anchor = document.createElement('a');
    anchor.href = new URL(item.path, siteRoot).href;
    anchor.textContent = item.label;
    anchor.setAttribute('data-nav-key', item.key);
    if (item.key === activeKey) anchor.setAttribute('aria-current', 'page');
    container.appendChild(anchor);
    return anchor;
  }

  function appendCourseMenuItem(container, stage, siteRoot, viewedStage) {
    var anchor = document.createElement('a');
    var number = document.createElement('span');
    var title = document.createElement('strong');
    var maturity = document.createElement('small');
    var status = courseStageStatus(stage);
    anchor.className = 'course-menu__item ' + status;
    anchor.href = new URL(stage.path, siteRoot).href;
    number.textContent = stage.id;
    title.textContent = stage.title;
    maturity.textContent = courseMaturityLabel(stage);
    anchor.appendChild(number);
    anchor.appendChild(title);
    anchor.appendChild(maturity);
    if (viewedStage && viewedStage.id === stage.id) {
      anchor.classList.add('is-viewing');
      anchor.setAttribute('aria-current', 'step');
    }
    container.appendChild(anchor);
  }

  function renderCourseNavigation() {
    var siteRoot = getSiteRootUrl();
    var pageStageInfo = findCourseStageForPage(siteRoot);
    var viewedStage = pageStageInfo ? pageStageInfo.stage : null;
    var currentStage = currentCourseStage();
    var pathname = decodedPathname();
    var activeKey = 'home';
    var primaryItems = [
      { key: 'home', label: '学习首页', path: 'index.html' },
      { key: 'route', label: '完整路线', path: 'pages/learning-route.html' },
      { key: 'project', label: '项目', path: 'pages/project.html' },
    ];
    var referenceItems = [
      { key: 'evidence', label: '实验依据', path: 'pages/evidence.html' },
      { key: 'notes', label: '专项笔记', path: 'pages/notes.html' },
      { key: 'environment', label: '开发环境', path: 'pages/environment.html' },
      { key: 'phase0', label: '可视化参考', path: 'pages/phase0.html' },
      { key: 'archive', label: '归档', path: 'pages/archive.html' },
    ];
    var navigationNodes = document.querySelectorAll('[data-site-nav]');
    var i;
    var j;

    if (pageStageInfo || /\/pages\/learning-route\.html$/.test(pathname)) activeKey = 'route';
    else if (/\/pages\/project\.html$/.test(pathname)) activeKey = 'project';

    if (!document.querySelector('.page-shell')) document.body.classList.add('site-nav-offset');

    for (i = 0; i < navigationNodes.length; i += 1) {
      var navigation = navigationNodes[i];
      var brand = document.createElement('a');
      var links = document.createElement('div');
      var courseMenu = document.createElement('details');
      var courseSummary = document.createElement('summary');
      var coursePanel = document.createElement('div');
      var referenceMenu = document.createElement('details');
      var referenceSummary = document.createElement('summary');
      var referencePanel = document.createElement('div');
      var tools = document.createElement('div');
      var stageLink = document.createElement('a');

      navigation.className = 'site-nav';
      navigation.setAttribute('aria-label', 'RK3568 Camera 课程导航');
      navigation.textContent = '';

      brand.className = 'site-nav__brand';
      brand.href = new URL('index.html', siteRoot).href;
      brand.innerHTML = '<span>RK3568</span><strong>Camera 课程</strong>';
      navigation.appendChild(brand);

      links.className = 'site-nav__links';
      for (j = 0; j < primaryItems.length; j += 1) {
        appendNavigationLink(links, primaryItems[j], activeKey, siteRoot);
      }
      navigation.appendChild(links);

      courseMenu.className = 'site-nav__more course-menu';
      courseSummary.textContent = '课程目录';
      courseMenu.appendChild(courseSummary);
      coursePanel.className = 'site-nav__more-panel course-menu__grid';
      for (j = 0; j < courseStages.length; j += 1) {
        appendCourseMenuItem(coursePanel, courseStages[j], siteRoot, viewedStage);
      }
      courseMenu.appendChild(coursePanel);
      navigation.appendChild(courseMenu);

      referenceMenu.className = 'site-nav__more reference-menu';
      referenceSummary.textContent = '资料与实验';
      referenceSummary.setAttribute('data-nav-key', 'reference');
      if (activeKey === 'home' && !/\/index\.html$/.test(pathname) && !/学习驾驶舱\/$/.test(pathname)) {
        referenceSummary.setAttribute('aria-current', 'page');
      }
      referenceMenu.appendChild(referenceSummary);
      referencePanel.className = 'site-nav__more-panel reference-menu__panel';
      for (j = 0; j < referenceItems.length; j += 1) {
        appendNavigationLink(referencePanel, referenceItems[j], '', siteRoot);
      }
      referenceMenu.appendChild(referencePanel);
      navigation.appendChild(referenceMenu);

      tools.className = 'site-nav__tools';
      stageLink.className = 'site-nav__stage course-status';
      stageLink.href = new URL(currentStage.path, siteRoot).href;
      stageLink.textContent = '当前 ' + currentStage.id + ' · ' + currentStage.title;
      stageLink.title = '当前学习阶段';
      if (viewedStage && viewedStage.id === currentStage.id) stageLink.setAttribute('aria-current', 'page');
      tools.appendChild(stageLink);
      navigation.appendChild(tools);
    }
  }

  function renderSiteNavigation() {
    renderCourseNavigation();
  }

  function renderNoteDirectory() {
    var container = document.querySelector('[data-note-directory]');
    if (!container) return;

    var data = window.RK3568_VAULT_DATA || {};
    var notes = Array.isArray(data.notes) ? data.notes : [];
    var search = document.querySelector('[data-note-search]');
    var count = document.querySelector('[data-note-count]');
    var siteRoot = getSiteRootUrl();
    var groups = {};
    var groupOrder = ['课程正文', '源码陪读', '实板证据', '面试输出', '执行与复盘', '专题参考'];
    var rows = [];
    var i;

    container.textContent = '';
    for (i = 0; i < notes.length; i += 1) {
      var note = notes[i];
      if (!note || !note.webPath) continue;
      if (String(note.filePath || '').indexOf('08-附录/模板/') === 0) continue;
      var role = noteRole(note);
      if (!groups[role]) groups[role] = [];
      groups[role].push(note);
    }

    if (!groupOrder.length) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = '暂时没有可用的网页内容。';
      container.appendChild(empty);
      if (count) count.textContent = '0 篇网页内容';
      return;
    }

    for (i = 0; i < groupOrder.length; i += 1) {
      var groupName = groupOrder[i];
      if (!groups[groupName] || !groups[groupName].length) continue;
      var group = document.createElement('section');
      var heading = document.createElement('h3');
      var list = document.createElement('div');
      var groupNotes = groups[groupName];
      var j;

      group.className = 'note-directory__group';
      group.setAttribute('data-note-group', '');
      heading.textContent = groupName + ' · ' + groupNotes.length;
      list.className = 'note-directory__list';
      group.appendChild(heading);
      group.appendChild(list);

      for (j = 0; j < groupNotes.length; j += 1) {
        var item = groupNotes[j];
        var row = document.createElement('article');
        var mainLink = document.createElement('a');
        var meta = document.createElement('span');
        var editLink = document.createElement('a');

        row.className = 'note-directory__item';
        row.setAttribute('data-note-item', '');
        row.setAttribute(
          'data-note-search-text',
          cleanMarkdown((item.title || '') + ' ' + (item.filePath || '')).toLowerCase(),
        );
        mainLink.className = 'note-directory__main-link';
        mainLink.href = new URL(item.webPath, siteRoot).href;
        mainLink.textContent = item.title || item.filePath;
        meta.textContent = item.filePath || item.folder || '';
        if (item.url) {
          editLink.className = 'note-directory__edit-link';
          editLink.href = item.url;
          editLink.textContent = '编辑';
        }
        row.appendChild(mainLink);
        row.appendChild(meta);
        if (item.url) row.appendChild(editLink);
        list.appendChild(row);
        rows.push(row);
      }
      container.appendChild(group);
    }

    function applyNoteFilter() {
      var query = search ? search.value.trim().toLowerCase() : '';
      var visible = 0;
      var groupsOnPage = container.querySelectorAll('[data-note-group]');
      var groupIndex;
      for (i = 0; i < rows.length; i += 1) {
        var matches = !query || rows[i].getAttribute('data-note-search-text').indexOf(query) !== -1;
        rows[i].hidden = !matches;
        if (matches) visible += 1;
      }
      for (groupIndex = 0; groupIndex < groupsOnPage.length; groupIndex += 1) {
        groupsOnPage[groupIndex].hidden = !groupsOnPage[groupIndex].querySelector('[data-note-item]:not([hidden])');
      }
      if (count) count.textContent = visible + ' / ' + rows.length + ' 篇网页内容';
    }

    if (search) search.addEventListener('input', applyNoteFilter);
    applyNoteFilter();
  }

  function createCourseStageLink(stage, siteRoot, className) {
    var anchor = document.createElement('a');
    anchor.className = className || '';
    anchor.href = new URL(stage.path, siteRoot).href;
    anchor.textContent = stage.id + ' ' + stage.title;
    return anchor;
  }

  function renderCourseProgress(container, viewedStage, siteRoot) {
    var i;
    container.textContent = '';
    for (i = 0; i < courseStages.length; i += 1) {
      var stage = courseStages[i];
      var anchor = createCourseStageLink(stage, siteRoot, 'course-progress__step');
      anchor.classList.add(courseStageStatus(stage));
      anchor.setAttribute('title', stage.id + ' ' + stage.title);
      anchor.setAttribute('aria-label', '阶段 ' + stage.id + '：' + stage.title);
      anchor.textContent = stage.id;
      if (viewedStage && viewedStage.id === stage.id) {
        anchor.classList.add('is-viewing');
        anchor.setAttribute('aria-current', 'step');
      }
      container.appendChild(anchor);
    }
  }

  function appendAdjacentLink(container, stage, direction, siteRoot) {
    var anchor = document.createElement('a');
    var label = document.createElement('span');
    var title = document.createElement('strong');
    anchor.className = 'course-adjacent__link course-adjacent__link--' + direction;
    anchor.href = new URL(stage.path, siteRoot).href;
    label.textContent = direction === 'previous' ? '← 上一阶段' : '下一阶段 →';
    title.textContent = stage.id + ' ' + stage.title;
    anchor.appendChild(label);
    anchor.appendChild(title);
    container.appendChild(anchor);
  }

  function renderCourseContext() {
    var siteRoot = getSiteRootUrl();
    var pageInfo = findCourseStageForPage(siteRoot);
    var navigation = document.querySelector('[data-site-nav]');
    var main = document.querySelector('#main-content') || document.querySelector('main');
    var context;
    var breadcrumb;
    var contextMain;
    var location;
    var objective;
    var progress;
    var adjacent;
    var routeLink;
    var footer;
    var footerInner;

    if (!pageInfo || !navigation || !main || document.querySelector('[data-course-context]')) return;

    context = document.createElement('section');
    context.className = 'course-context';
    context.setAttribute('data-course-context', '');
    context.setAttribute('aria-label', '课程位置与进度');

    contextMain = document.createElement('div');
    contextMain.className = 'course-context__inner';
    breadcrumb = document.createElement('p');
    breadcrumb.className = 'course-context__eyebrow';
    breadcrumb.textContent = 'RK3568 CAMERA 学习路线';
    location = document.createElement('h2');
    location.className = 'course-context__location';
    location.textContent = '当前位置：阶段 ' + pageInfo.stage.id + ' / ' + pageInfo.stage.title;
    objective = document.createElement('p');
    objective.className = 'course-context__objective';
    objective.textContent = pageInfo.stage.objective;
    progress = document.createElement('nav');
    progress.className = 'course-progress';
    progress.setAttribute('aria-label', 'RK3568 Camera 学习进度');
    renderCourseProgress(progress, pageInfo.stage, siteRoot);
    adjacent = document.createElement('div');
    adjacent.className = 'course-adjacent';
    if (pageInfo.index > 0) {
      appendAdjacentLink(adjacent, courseStages[pageInfo.index - 1], 'previous', siteRoot);
    } else {
      adjacent.appendChild(document.createElement('span')).className = 'course-adjacent__spacer';
    }
    routeLink = document.createElement('a');
    routeLink.className = 'course-adjacent__route';
    routeLink.href = new URL('pages/learning-route.html', siteRoot).href;
    routeLink.textContent = '返回完整学习路线';
    adjacent.appendChild(routeLink);
    if (pageInfo.index < courseStages.length - 1) {
      appendAdjacentLink(adjacent, courseStages[pageInfo.index + 1], 'next', siteRoot);
    } else {
      adjacent.appendChild(document.createElement('span')).className = 'course-adjacent__spacer';
    }

    contextMain.appendChild(breadcrumb);
    contextMain.appendChild(location);
    contextMain.appendChild(objective);
    contextMain.appendChild(progress);
    contextMain.appendChild(adjacent);
    context.appendChild(contextMain);
    document.body.classList.add('has-course-context');
    navigation.parentNode.insertBefore(context, navigation.nextSibling);

    footer = document.createElement('nav');
    footer.className = 'course-footer-nav';
    footer.setAttribute('aria-label', '课程上下阶段导航');
    footerInner = document.createElement('div');
    footerInner.className = 'course-footer-nav__inner';
    if (pageInfo.index > 0) {
      appendAdjacentLink(footerInner, courseStages[pageInfo.index - 1], 'previous', siteRoot);
    } else {
      footerInner.appendChild(document.createElement('span')).className = 'course-adjacent__spacer';
    }
    routeLink = document.createElement('a');
    routeLink.className = 'course-adjacent__route';
    routeLink.href = new URL('pages/learning-route.html', siteRoot).href;
    routeLink.textContent = '返回学习路线';
    footerInner.appendChild(routeLink);
    if (pageInfo.index < courseStages.length - 1) {
      appendAdjacentLink(footerInner, courseStages[pageInfo.index + 1], 'next', siteRoot);
    } else {
      footerInner.appendChild(document.createElement('span')).className = 'course-adjacent__spacer';
    }
    footer.appendChild(footerInner);
    main.appendChild(footer);
  }

  function renderCourseRoute() {
    var containers = document.querySelectorAll('[data-course-route]');
    var siteRoot = getSiteRootUrl();
    var i;
    var j;
    for (i = 0; i < containers.length; i += 1) {
      containers[i].textContent = '';
      containers[i].classList.add('course-route');
      var scope = document.createElement('p');
      scope.className = 'course-route__scope';
      scope.textContent = 'Camera 驱动核心：00–08 + 11；岗位加分扩展：09–10。';
      containers[i].appendChild(scope);
      for (j = 0; j < courseStages.length; j += 1) {
        var stage = courseStages[j];
        var card = document.createElement('article');
        var header = document.createElement('div');
        var number = document.createElement('span');
        var state = document.createElement('span');
        var title = document.createElement('h3');
        var objective = document.createElement('p');
        var link = createCourseStageLink(stage, siteRoot, 'course-route__link');
        var status = courseStageStatus(stage);
        card.className = 'course-route__card ' + status;
        card.id = 'stage-' + stage.id;
        header.className = 'course-route__header';
        number.className = 'course-route__number';
        number.textContent = stage.id;
        state.className = 'course-route__state';
        state.textContent = (status === 'is-current' ? '当前 · ' : '') + courseMaturityLabel(stage);
        title.textContent = stage.title;
        objective.textContent = stage.objective;
        link.textContent = status === 'is-current' ? '从当前阶段继续 →' : '进入本阶段 →';
        header.appendChild(number);
        header.appendChild(state);
        card.appendChild(header);
        card.appendChild(title);
        card.appendChild(objective);
        card.appendChild(link);
        containers[i].appendChild(card);
      }
    }
  }

  function renderSiteState() {
    var data = window.RK3568_VAULT_DATA || {};
    var currentStage = currentCourseStage();
    var currentTasks = Array.isArray(data.currentTasks) ? data.currentTasks : [];
    var evidence = Array.isArray(data.evidence) ? data.evidence : [];
    var quickLinks = Array.isArray(data.quickLinks) ? data.quickLinks : [];
    var currentTask = null;
    var taskBoard = findQuickLink(quickLinks, 'taskBoard');
    var siteRoot = getSiteRootUrl();
    var routePath = new URL('pages/learning-route.html', siteRoot).href;
    var i;
    var stageNodes = document.querySelectorAll('[data-current-stage]');
    var taskNodes = document.querySelectorAll('[data-current-task]');
    var taskLinks = document.querySelectorAll('[data-current-task-link]');
    var evidenceNodes = document.querySelectorAll('[data-evidence-count]');
    var currentStageLinks = document.querySelectorAll('[data-current-stage-link]');
    var currentCourseNodes = document.querySelectorAll('[data-course-current]');
    var objectiveNodes = document.querySelectorAll('[data-course-objective]');
    var nextNodes = document.querySelectorAll('[data-course-next]');

    if (!currentStageLinks.length) {
      currentStageLinks = document.querySelectorAll('.hero__actions a[href="#start"]');
    }

    for (i = 0; i < currentTasks.length; i += 1) {
      if (currentTasks[i] && currentTasks[i].completed !== true) {
        currentTask = currentTasks[i];
        break;
      }
    }
    for (i = 0; i < stageNodes.length; i += 1) {
      stageNodes[i].textContent = '阶段 ' + currentStage.id + '：' + currentStage.title;
    }
    for (i = 0; i < currentStageLinks.length; i += 1) {
      currentStageLinks[i].setAttribute('data-current-stage-link', '');
      currentStageLinks[i].href = new URL(currentStage.path, siteRoot).href;
    }
    for (i = 0; i < currentCourseNodes.length; i += 1) {
      currentCourseNodes[i].textContent = currentStage.id + ' · ' + currentStage.title;
    }
    for (i = 0; i < objectiveNodes.length; i += 1) {
      objectiveNodes[i].textContent = currentStage.objective;
    }
    for (i = 0; i < nextNodes.length; i += 1) {
      nextNodes[i].textContent = '进入阶段 ' + currentStage.id + '：' + currentStage.title;
      if (nextNodes[i].tagName === 'A') nextNodes[i].href = new URL(currentStage.path, siteRoot).href;
    }
    for (i = 0; i < taskNodes.length; i += 1) {
      taskNodes[i].textContent = currentTask && currentTask.text
        ? cleanMarkdown(currentTask.text)
        : '当前没有未完成任务';
    }
    for (i = 0; i < taskLinks.length; i += 1) {
      if (taskBoard && taskBoard.webPath) {
        taskLinks[i].href = new URL(taskBoard.webPath, siteRoot).href;
      }
    }
    for (i = 0; i < evidenceNodes.length; i += 1) {
      evidenceNodes[i].textContent = String(evidence.length);
    }
  }

  function initializeSite() {
    renderSiteNavigation();
    renderCourseContext();
    renderCourseRoute();
    renderNoteDirectory();
    renderSiteState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSite);
  } else {
    initializeSite();
  }
}());
