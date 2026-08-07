(function () {
  'use strict';

  var COURSE_CURRENT_STAGE = '04';
  var COURSE_STAGES = [
    {
      id: '00',
      title: '总览',
      path: 'pages/system-map.html',
      objective: '先建立 IMX415、D-PHY、CSI、RKISP 与 /dev/videoX 的完整系统地图。',
    },
    {
      id: '01',
      title: 'Linux Driver Model',
      path: '../../04-项目/15-Linux设备模型与总线分层.html',
      objective: '分清 bus、device、driver、Platform Driver、I2C Core 和 I2C Driver。',
    },
    {
      id: '02',
      title: 'DTS 与设备发现',
      path: 'pages/notes/06-任务--IMX415-DTS 解读 -2026年7月31日.html',
      objective: '从原理图对到 DTS，并说明节点怎样变成运行时设备和 I2C client。',
    },
    {
      id: '03',
      title: 'IMX415 Sensor',
      path: '../../04-项目/16-IMX415-三层驱动调用流程.html',
      objective: '讲清驱动注册、compatible 匹配、probe、上电、读 ID 与 V4L2 注册。',
    },
    {
      id: '04',
      title: 'MIPI CSI-2 / D-PHY',
      path: '../../04-项目/17-DPHY-从DTS到MediaGraph.html',
      objective: '从 DTS endpoint 追到 D-PHY 和 Media Graph，解释 RAW 数据如何进入 SoC。',
    },
    {
      id: '05',
      title: 'V4L2 Subdev',
      path: '../../04-项目/19-IMX415-v4l2-subdev注册与开流.html',
      objective: '理解 Sensor 如何注册格式、controls、开流回调以及 Source Pad。',
    },
    {
      id: '06',
      title: 'Media Controller',
      path: 'pages/notes/05-实验与证据--2026-07-28-直连板端读取IMX415配置.html',
      objective: '读懂 entity、pad、link 和 media-ctl 输出，并沿数据链逐节点验证。',
    },
    {
      id: '07',
      title: 'RKISP',
      path: '../../04-项目/18-RK3568-Camera从DTS到videoX真实启动时序.html',
      objective: '解释 RAW Bayer 如何进入 RKISP，并经 mainpath/selfpath 形成可取流节点。',
    },
    {
      id: '08',
      title: 'V4L2 用户态取流',
      path: 'pages/notes/07-专项笔记--Camera-V4L2--V4L2命令行抓帧记录.html',
      objective: '掌握格式协商、buffer queue、STREAMON 和 v4l2-ctl 抓帧验证。',
    },
    {
      id: '09',
      title: 'GStreamer / OpenCV',
      path: 'pages/notes/07-专项笔记--OpenCV--OpenCV读取Camera记录.html',
      objective: '把 V4L2 输出接入 GStreamer 和 OpenCV，并定位格式与转换问题。',
    },
    {
      id: '10',
      title: 'RKNN / YOLO',
      path: 'pages/notes/07-专项笔记--系统--AI Camera系统数据流与模块边界.html',
      objective: '理解 Camera 帧进入预处理、RKNN 推理和结果输出时的模块边界。',
    },
    {
      id: '11',
      title: 'Camera Bring-up 排障',
      path: 'pages/notes/07-专项笔记--系统--AI Camera故障排查索引.html',
      objective: '按供电、I2C、MIPI、Media、ISP、V4L2 分层定位新 Sensor 点亮故障。',
    },
  ];

  window.RK3568_COURSE = {
    currentStage: COURSE_CURRENT_STAGE,
    stages: COURSE_STAGES,
  };

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
    for (i = 0; i < COURSE_STAGES.length; i += 1) {
      if (COURSE_STAGES[i].id === COURSE_CURRENT_STAGE) return COURSE_STAGES[i];
    }
    return COURSE_STAGES[0];
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
    var currentIndex = parseInt(COURSE_CURRENT_STAGE, 10);
    var stageIndex = parseInt(stage.id, 10);
    if (stage.id === COURSE_CURRENT_STAGE) return 'is-current';
    if (stageIndex < currentIndex) return 'is-complete';
    return 'is-planned';
  }

  function findCourseStageForPage(siteRoot, pageUrl) {
    var currentPath = decodedUrlPath(pageUrl || new URL(window.location.href));
    var i;
    for (i = 0; i < COURSE_STAGES.length; i += 1) {
      if (decodedUrlPath(new URL(COURSE_STAGES[i].path, siteRoot)) === currentPath) {
        return { index: i, stage: COURSE_STAGES[i] };
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
    var status = courseStageStatus(stage);
    anchor.className = 'course-menu__item ' + status;
    if (viewedStage && viewedStage.id === stage.id) anchor.classList.add('is-viewing');
    anchor.href = new URL(stage.path, siteRoot).href;
    number.textContent = stage.id;
    title.textContent = stage.title;
    anchor.appendChild(number);
    anchor.appendChild(title);
    container.appendChild(anchor);
  }

  function renderCourseNavigation() {
    var siteRoot = getSiteRootUrl();
    var pageStageInfo = findCourseStageForPage(siteRoot);
    var viewedStage = pageStageInfo ? pageStageInfo.stage : null;
    var currentStage = currentCourseStage();
    var pathname = decodedPathname();
    var activeKey = /\/pages\/learning-route\.html$/.test(pathname) ? 'route' : 'home';
    var primaryItems = [
      { key: 'home', label: '学习首页', path: 'index.html' },
      { key: 'route', label: '完整路线', path: 'pages/learning-route.html' },
    ];
    var referenceItems = [
      { key: 'system', label: '总览地图', path: 'pages/system-map.html' },
      { key: 'evidence', label: '实验依据', path: 'pages/evidence.html' },
      { key: 'notes', label: '专项笔记', path: 'pages/notes.html' },
      { key: 'environment', label: '开发环境', path: 'pages/environment.html' },
      { key: 'phase0', label: '可视化参考', path: 'pages/phase0.html' },
      { key: 'archive', label: '归档', path: 'pages/archive.html' },
    ];
    var navigationNodes = document.querySelectorAll('[data-site-nav]');
    var i;
    var j;

    if (!document.querySelector('.page-shell')) document.body.classList.add('site-nav-offset');

    for (i = 0; i < navigationNodes.length; i += 1) {
      var navigation = navigationNodes[i];
      var brand = document.createElement('a');
      var links = document.createElement('div');
      var tools = document.createElement('div');
      var stageLink = document.createElement('a');
      var courseMenu = document.createElement('details');
      var courseSummary = document.createElement('summary');
      var coursePanel = document.createElement('div');
      var referenceMenu = document.createElement('details');
      var referenceSummary = document.createElement('summary');
      var referencePanel = document.createElement('div');

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
      for (j = 0; j < COURSE_STAGES.length; j += 1) {
        appendCourseMenuItem(coursePanel, COURSE_STAGES[j], siteRoot, viewedStage);
      }
      courseMenu.appendChild(coursePanel);
      navigation.appendChild(courseMenu);

      referenceMenu.className = 'site-nav__more reference-menu';
      referenceSummary.textContent = '资料与实验';
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
    var groupOrder = [];
    var rows = [];
    var i;

    container.textContent = '';
    for (i = 0; i < notes.length; i += 1) {
      var note = notes[i];
      if (!note || !note.webPath) continue;
      var folder = String(note.folder || '其他').split('/')[0] || '其他';
      if (!groups[folder]) {
        groups[folder] = [];
        groupOrder.push(folder);
      }
      groups[folder].push(note);
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
    for (i = 0; i < COURSE_STAGES.length; i += 1) {
      var stage = COURSE_STAGES[i];
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
      appendAdjacentLink(adjacent, COURSE_STAGES[pageInfo.index - 1], 'previous', siteRoot);
    } else {
      adjacent.appendChild(document.createElement('span')).className = 'course-adjacent__spacer';
    }
    routeLink = document.createElement('a');
    routeLink.className = 'course-adjacent__route';
    routeLink.href = new URL('pages/learning-route.html', siteRoot).href;
    routeLink.textContent = '返回完整学习路线';
    adjacent.appendChild(routeLink);
    if (pageInfo.index < COURSE_STAGES.length - 1) {
      appendAdjacentLink(adjacent, COURSE_STAGES[pageInfo.index + 1], 'next', siteRoot);
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
      appendAdjacentLink(footerInner, COURSE_STAGES[pageInfo.index - 1], 'previous', siteRoot);
    } else {
      footerInner.appendChild(document.createElement('span')).className = 'course-adjacent__spacer';
    }
    routeLink = document.createElement('a');
    routeLink.className = 'course-adjacent__route';
    routeLink.href = new URL('pages/learning-route.html', siteRoot).href;
    routeLink.textContent = '返回学习路线';
    footerInner.appendChild(routeLink);
    if (pageInfo.index < COURSE_STAGES.length - 1) {
      appendAdjacentLink(footerInner, COURSE_STAGES[pageInfo.index + 1], 'next', siteRoot);
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
      for (j = 0; j < COURSE_STAGES.length; j += 1) {
        var stage = COURSE_STAGES[j];
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
        state.textContent = status === 'is-current' ? '当前' : (status === 'is-complete' ? '已完成' : '待学习');
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
