# RK3568 Camera 文档元数据规范

本规范把“学习进度、实板证据、网页发布”拆成三个互不替代的维度，避免一个 `completed` 同时表示看过、掌握、验证和发布。

## 必填字段

```yaml
---
id: course-04-dphy
doc-type: course
title: MIPI CSI-2 与 D-PHY
course-stage: "04"
learning-status: in-progress
evidence-status: partial
publish-status: published
updated: 2026-08-10
---
```

## 枚举

- `doc-type`: `course`、`source-reading`、`evidence`、`task`、`reference`、`interview-output`
- `learning-status`: `not-started`、`in-progress`、`understood`、`review-needed`
- `evidence-status`: `none`、`partial`、`verified`、`superseded`
- `publish-status`: `private`、`draft`、`published`
- `course-stage`: 仅课程相关文档使用两位字符串 `"00"`–`"11"`

`id` 在仓库中必须唯一。`week`、`day`、`competency-id` 只能描述任务或能力，不能替代 `course-stage`。

## 发布兼容规则

- `publish-status: private` 不生成网页。
- 迁移期间，旧字段 `web-publish: false` 等价于 `publish-status: private`。
- Excalidraw 图源、Skill、`docs/`、`tools/` 属于内部资源，不进入学习目录，也不计为知识孤岛。

## 文档职责

- `course`: 唯一课程正文，保存稳定知识。
- `source-reading`: 辅助追源码，解释函数调用和框架回调。
- `evidence`: 保存命令、原始输出、环境快照和可证明/不可证明结论。
- `task`: 只保存当前动作、期限和验收链接。
- `reference`: 数据手册、原理图索引、术语等参考材料。
- `interview-output`: 面试表达和项目讲解，不复制整章正文。
