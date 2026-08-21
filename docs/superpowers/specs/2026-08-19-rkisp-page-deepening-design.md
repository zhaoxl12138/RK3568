# RKISP 第 07 页流程图深化设计

## 目标

直接深化 `04-项目/22-RKISP-从RAW到VideoNode.html`，使它从“RKISP 概览页”升级为可配合第 07 章源码陪读使用的五图入口。保留现有视觉风格、课程导航和前三张图，不创建替代网页。

## 页面结构

页面顶部增加“五张图阅读顺序”，并为每张图增加稳定锚点：

1. 总览：HW、逻辑实例、内部管线、Video Node。
2. 生命周期：两个 Platform Driver、两个独立 probe、`drvdata` 对象桥。
3. 数据格式：RAW10、ISP 总线格式、NV12 内存格式与证据阶梯。
4. Async 建链：外部 D-PHY subdev 如何进入 RKISP，`bound` 与 `complete` 分别做什么，`rkisp_create_links()` 在哪里汇合。
5. 开流与回帧：用户 `VIDIOC_STREAMON` 如何经 V4L2/VB2 反向启动 RKISP 和上游；硬件帧如何经 IRQ、DMA、`vb2_buffer_done()` 回到 `VIDIOC_DQBUF`。

## 图 4：Async 建链

按四条泳道表达：

- 外部对象：D-PHY 调用 `v4l2_async_register_subdev()`。
- RKISP notifier：解析 endpoint，生成 waiting 条件，注册 notifier。
- V4L2 Async Core：匹配 fwnode，依次回调 `.bound()`，全部满足后回调 `.complete()`。
- RKISP 汇合：`subdev_notifier_complete()` 直接调用 `rkisp_create_links()`，建立 D-PHY → CSI → ISP 的 Media Link。

实线表示直接调用或真实回调顺序；虚线表示 fwnode 等待条件和对象关联。图中明确：`bound` 只是收集一个外部 subdev，`complete` 才表示 notifier 的目标全部到齐；建图成功不证明像素流。

## 图 5：开流与回帧

把控制流和帧返回分成上下两条方向相反的链：

```text
控制流：应用 → V4L2 ioctl → VB2 → rkisp_start_streaming()
       → rkisp_stream_start() + pipe.set_stream(true)
       → rkisp_pipeline_set_stream() → 各 subdev s_stream

帧返回：Sensor/CSI/ISP → MI/DMA IRQ → 当前 buffer 完成
       → vb2_buffer_done() → VIDIOC_DQBUF
```

图中必须显示函数表分发关系：`rkisp_v4l2_ioctl_ops`、`rkisp_vb2_ops.start_streaming`、`pipe.set_stream` 与 subdev `ops->video->s_stream`。明确 `STREAMON` 返回 0 只说明启动调用链没有立即报错，连续 `DQBUF` 才是帧到达用户态的证据。

## 可读性与验收

- 节点同时显示中文职责、源码文件和搜索符号。
- 不使用图内滚动条或局部缩放按钮，继续用响应式 SVG 和浏览器整体缩放。
- 顶部五图导航、上一阶段、下一阶段和 Obsidian 源码陪读入口保持有效。
- 自动测试断言两张新图、关键符号、证据边界和本地链接。
