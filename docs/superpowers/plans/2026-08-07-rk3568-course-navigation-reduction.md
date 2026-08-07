# RK3568 Course Navigation Finalization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改变 00–11 课程顺序和正文的前提下，统一顶栏、修正课程前后跳转并保持 Phase0 为参考资料。

**Architecture:** `site.js` 继续作为课程表、顶栏、课程目录、当前阶段和上下阶段链接的唯一数据源；静态 HTML 只提供无 JavaScript 回退。`site.css` 只调整窄屏导航，不重做视觉风格。

**Tech Stack:** 静态 HTML、CSS、ES5 兼容 JavaScript、Node.js `node:test`、`file://` 与本地 HTTP 浏览器验证。

## Task 1: Lock the approved navigation contract

- [x] 保持 `COURSE_STAGES` 的 00–11 顺序和目标文件不变。
- [x] 顶栏一级入口为“学习首页、完整路线、项目、资料与实验、当前阶段”。
- [x] “课程目录”保留为 00–11 下拉菜单。
- [x] “资料与实验”收纳实验依据、笔记、环境、可视化参考和归档。
- [x] 项目入口固定到 `project.html`，不参与课程顺序。

## Task 2: Verify every mainline page

- [x] 课程目录只高亮当前打开的阶段。
- [x] 每页上一阶段、返回完整学习路线、下一阶段均由课程数组生成。
- [x] 顶部当前阶段固定指向 04，并在阶段 04 页面高亮。
- [x] 首尾阶段正确省略不存在的上一阶段或下一阶段。
- [x] 重点验证 03 → 04 → 05 不经过 Phase0、任务页或无关笔记。

## Task 3: Keep the overview/reference boundary

- [x] `system-map.html` 明确为“阶段 00 · 系统总览”。
- [x] `phase0.html` 明确为“可视化参考”，不生成课程上下文。
- [x] 首页将旧“总览地图”参考链接改名为“可视化参考”。
- [x] 不删除 Phase0 页面，不新增课程阶段，不重写课程正文。

## Task 4: Responsive and regression verification

- [x] 手机端当前阶段入口独占一行，不再隐藏。
- [x] 390px 宽度下课程目录可展开 12 项且无横向溢出。
- [x] 更新有效 HTML 的共享资源缓存标识。
- [x] 运行全部 Node 测试、知识库链接检查和 `git diff --check`。
- [x] 通过真实浏览器逐页验证 00–11 导航。

## Publish

- [ ] 只暂存本轮站点、测试和设计文档；排除 `.obsidian/app.json`、`$out/`、`tmp/`。
- [ ] 为更新 PR #1 创建提交并推送当前分支。
