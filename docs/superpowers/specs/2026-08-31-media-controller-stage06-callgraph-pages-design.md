# 阶段 06 Media Controller 调用关系专题页设计

## 目标

保留 `21-MediaController-Entity-Pad-Link.html` 作为阶段总览，新增三个可连续阅读的专题页，解决总览页信息密度过高、对象关系与 Async 时序容易混淆的问题。

## 推荐拆分

1. `30-Media对象Entity-Pad-Link.html`
   - 区分 `media_device`、`media_entity`、`media_pad`、`media_link`。
   - 展示 `media_entity_pads_init()` 的字段变化，以及 `media_create_pad_link()` 创建正向 link、backlink、reverse 的过程。
   - 明确 Media Graph 是软件拓扑，不搬运 RAW。
2. `31-V4L2-Async双向注册与匹配.html`
   - 分开“notifier 先到”和“subdev 先到”两条时序。
   - 展示 `notifier_list`、`subdev_list`、`waiting`、`done` 的对象类型和迁移。
   - 汇合到 `v4l2_async_match_notify()`，区分直接调用和 `.bound()` 框架回调。
3. `32-Bound-Complete与MediaGraph建链.html`
   - 区分 D-PHY 局部 `.bound()` 与 RKISP 根 `.complete()`。
   - 展示 D-PHY 同时拥有 notifier 和 sd 的上下游桥接角色。
   - 将 `media_create_pad_link()`、`rkisp_create_links()` 与 `media-ctl -p` 的证据边界连起来。

## 导航

```text
21 总览 → 30 对象 → 31 Async 双顺序 → 32 bound/complete → 22 RKISP
```

每页保留返回阶段 06 总览的入口，并在窄屏使用纵向 `mobile-flow`，不使用局部滚动或放大按钮。

## 表达约定

- 灰蓝实线：当前函数体中的直接调用。
- 紫色虚线：总线/V4L2/Async 的框架回调或函数指针调用。
- 绿色线：数据流、对象关联或链表迁移。
- 每张图同时给出中文职责、源码文件、关键函数、白话解释和“能证明/不能证明”。

## 不做的事情

- 不重写阶段 06 四篇 Markdown。
- 不删除总览页原有图。
- 不把 Media Link 描述为物理数据通路。
- 不改变 00–11 课程顺序或当前阶段 08。
