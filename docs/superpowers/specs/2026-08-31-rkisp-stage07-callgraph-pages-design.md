# 阶段 07 RKISP 函数调用链专题网页设计

## 1. 背景与选择

阶段 07 总览页 `04-项目/22-RKISP-从RAW到VideoNode.html` 已经包含五张总图，但 RKISP 同时涉及两套 Platform Driver、两类对象、内部 Media 对象、外部 Async 建链、Video Node、STREAMON 和 IRQ，单页认知负担明显高于前面阶段。

沿用阶段 08 已验证的“一页总览 + 三页专题”模式。对比方案如下：

- 只继续扩写 22：文件更少，但总图会再次变长，源码入口仍混在一起；
- 每个函数一页：定位精确，但页面数量失控且割裂上下文；
- **三页专题（采用）**：按对象桥、节点注册、运行时取流三个工程问题拆分，既保留上下文又能逐函数追踪。

用户已授权后续采用默认推荐方案。本轮保留 22 作为阶段入口，不改变 00–11 课程顺序，不删除已有图。

## 2. 信息架构

```text
22-RKISP-从RAW到VideoNode.html
│  阶段 07 总览、五张总图、三个专题入口
│
├─ 27-RKISP双Platform驱动与对象桥.html
│  module_init → 注册两个 driver → 两次 Platform probe
│  rkisp_hw_dev ↔ rkisp_device 的 phandle/drvdata 指针桥
│
├─ 28-RKISP内部节点注册与外部Async建链.html
│  rkisp_register_platform_subdevs → ISP/CSI subdev
│  stream vdev → video_register_device → /dev/videoX
│  notifier complete → rkisp_create_links
│
└─ 29-RKISP开流与帧完成中断.html
   VB2 回调 rkisp_start_streaming
   本地 MI/DMA 准备 → pipeline.set_stream → 上游 s_stream
   frame-end IRQ → mi_frame_end → vb2_buffer_done
```

推荐阅读顺序是 `22 → 27 → 28 → 29 → 23（阶段 08）`。

## 3. 专题 27：双 Platform Driver 与对象桥

### 图 1：一个 module init 发布两个 driver

```text
module_init(rkisp_hw_drv_init)
→ rkisp_hw_drv_init()
├─ platform_driver_register(&rkisp_hw_drv)
└─ platform_driver_register(&rkisp_plat_drv)
```

必须明确：`platform_driver_register()` 只是向 Platform 总线框架发布 driver；`rkisp_hw_probe()` 不直接调用 `rkisp_plat_probe()`。

### 图 2：Platform 总线分别完成两次匹配

```text
HW DTS node ↔ rkisp_hw_drv.of_match_table
             ⇢ rkisp_hw_probe(HW pdev)
                └─ dev_set_drvdata(HW dev, hw_dev)

rkisp-vir DTS node ↔ rkisp_plat_drv.of_match_table
                   ⇢ rkisp_plat_probe(logic pdev)
```

紫色虚线表示总线框架匹配和回调，不画成普通 C 直接调用。

### 图 3：逻辑对象怎样取回 HW 对象

```text
rkisp_plat_probe(isp_dev)
→ rkisp_attach_hw(isp_dev)
  → of_parse_phandle(logic node, "rockchip,hw", 0)
  → of_find_device_by_node(HW node)
  → platform_get_drvdata(HW pdev)
  → isp_dev->hw_dev = hw
  → hw->isp[] = isp_dev
```

对象桥传递同一个 `rkisp_hw_dev *` 指针，不复制寄存器、IRQ、clock 或 reset 资源。一个物理 HW 对象可以通过 `hw->isp[]` 关联逻辑实例，因此不能先入为主地理解成永远一对一。

## 4. 专题 28：内部节点注册与外部 Async 建链

### 图 1：逻辑 probe 的内部注册汇合点

```text
rkisp_plat_probe()
→ v4l2_device_register()
→ media_device_register()
→ rkisp_register_platform_subdevs()
  ├─ rkisp_register_isp_subdev()
  ├─ rkisp_register_csi_subdev()
  ├─ rkisp_register_bridge_subdev()
  └─ rkisp_register_stream_vdevs()
```

图中区分 `rkisp_device` 根对象、ISP/CSI `v4l2_subdev`、stream `video_device`，不要把它们都叫“设备节点”。

### 图 2：mainpath/selfpath 怎样成为 `/dev/videoX`

```text
rkisp_register_stream_vdevs()
→ rkisp_register_stream_v21()
→ rkisp_register_stream_vdev(stream)
  ├─ vdev->fops = &rkisp_fops
  ├─ vdev->ioctl_ops = &rkisp_v4l2_ioctl_ops
  ├─ vdev->queue = &node->buf_queue
  └─ video_register_device(vdev, VFL_TYPE_GRABBER, -1)
```

前三条是字段赋值/对象关系，不是函数调用。`video_register_device()` 才是 Video Node 发布点。`/dev/videoX` 出现不等于 Sensor、D-PHY 外部 link 已经完整，更不等于能 DQBUF。

### 图 3：外部对象何时进入 RKISP Media Graph

```text
RKISP notifier 注册并保存等待条件
⇢ Sensor / D-PHY subdev 独立注册
⇢ bound()：逐个匹配对象
⇢ subdev_notifier_complete()：所需对象到齐
→ rkisp_create_links()：创建外部 Media Link
```

必须把“内部对象注册汇合”和“外部 Async complete 汇合”画成两个不同时间点。内部 stream node 可以先出现，外部完整拓扑随后才完成。

## 5. 专题 29：开流与帧完成中断

### 图 1：VB2 怎样进入 RKISP

```text
VIDIOC_STREAMON
→ V4L2 / VB2 Core
⇢ q->ops->start_streaming
⇢ rkisp_start_streaming(queue, count)
```

本页从 RKISP 回调入口开始解释，V4L2/VB2 通用分发细节链接到阶段 08 专题 25，不重复整页内容。

### 图 2：本地 DMA 与上游开流的真实顺序

```text
rkisp_start_streaming()
├─ rkisp_stream_start(stream)            [直接调用：配置本地 MI/DMA]
└─ dev->pipe.set_stream(..., true)       [函数指针]
   ⇢ rkisp_pipeline_set_stream()
      ⇢ ISP / CSI / D-PHY / Sensor s_stream(1)
```

不能把两条动作画成完全并行。对当前 v2.1 源码，先准备 RKISP 本地采集路径，再通过 pipeline 回调启动上游。

### 图 3：真实帧完成后的返回路径

```text
Sensor RAW → D-PHY → CSI → ISP → MI/DMA Buffer
→ rkisp_mi_v21_isr()
→ mi_frame_end(stream)
→ vb2_buffer_done(vb2_buf, VB2_BUF_STATE_DONE)
→ VB2 done_list / wake_up
→ 阶段 08 的 VIDIOC_DQBUF
```

`STREAMON` 返回 0 只证明启动链无立即错误；frame-end IRQ 和 `vb2_buffer_done(DONE)` 证明驱动完成 Buffer；持续 DQBUF 和 sequence 递增才是用户态稳定取流证据。

## 6. 统一视觉与源码定位

复用 `04-项目/assets/v4l2-callgraph.css`，不再创建一套近似 CSS。每页满足：

- 灰蓝实线：源码直接调用；
- 紫色虚线：Platform/V4L2/VB2 框架回调、函数指针或字段关系；
- 绿色线：对象共享、RAW 数据或完成 Buffer；
- 每张 SVG 只讲一个关系，至少有对应的窄屏 `mobile-flow`；
- 正文字号 16px，SVG 主函数 18px、说明 16px；
- 不使用内部滚动、局部缩放按钮和横向拖动；
- 每页只列 3 组 Source Insight 入口：文件、搜索符号、这一处看什么；
- 详细逐行注释继续留在 `02-源码陪读/07-RKISP`，网页不复制长代码。

## 7. 导航与验收

22 总览增加三个真实专题链接，专题页底部按 `27 → 28 → 29 → 23` 连续跳转，并都能返回 22。

自动验收新增：

- 三个文件存在、UTF-8、共享导航与共享 CSS 正确；
- 22 的专题入口是真实 `<a>`，不是注释或文本；
- 每页都包含 direct/callback/data 三类 SVG 边和窄屏纵向链；
- 专题 27 锁定双 driver、双 probe、phandle/drvdata 对象桥；
- 专题 28 锁定内部 subdev、Video Node 和外部 Async 两个汇合点；
- 专题 29 锁定 RKISP 本地启动、上游 s_stream、IRQ 与 Buffer DONE；
- 全量构建、全量测试、链接检查和 `git diff --check` 通过；
- 保留当前脏工作区，不提交、不 push。

## 8. 非目标

- 不把 RKISPP、3A/IQ 算法、HDR readback 和全部 rawwr/rawrd 分支塞进本轮；
- 不重写 22 已有五张图；
- 不改变阶段 07/08 的课程边界：07 讲 RKISP 内部，08 讲用户态/VB2；
- 不批量为每个函数生成页面。
