# 阶段 08 V4L2 函数调用链专题网页设计

## 1. 背景

当前阶段 08 页面 `04-项目/23-V4L2-VB2用户态取流.html` 已经具备三张总览图：

- Video Node 注册与 ioctl 分发；
- 控制请求向上游启动、完成帧返回用户态；
- 单个 VB2 Buffer 的所有权与状态变化。

现有页面适合作为阶段总览，但没有完整对应 Day1–Day6 用户程序，也没有把下列函数关系分开说明：

```text
应用源码中的直接调用
V4L2/VB2 根据函数表发生的框架回调
DMA 完成后的数据与 Buffer 所有权变化
```

结果是读者理解了概念，却仍难以拿着 Source Insight 按函数逐步追踪。

## 2. 目标

保留阶段 08 总览页，新增三个聚焦的专题网页，把用户态实验代码、V4L2/VB2 通用框架和 RKISP 驱动回调串成可追踪的调用链。

完成后，读者应能回答：

1. 应用代码中的当前函数直接调用了谁；
2. 哪一步进入 V4L2 Core，哪一步进入 VB2；
3. 哪条线是直接函数调用，哪条线只是函数指针或对象关系；
4. Buffer 在应用、VB2、RKISP/DMA 之间怎样流转；
5. 100 帧、FPS、sequence gap 和第二次运行分别验证什么。

## 3. 信息架构

阶段 08 使用“一页总览、三页专题”的结构：

```text
23-V4L2-VB2用户态取流.html
│  阶段总览、核心概念和三个专题入口
│
├─ 24-V4L2用户程序初始化与Buffer映射.html
│  open → S_FMT → REQBUFS → QUERYBUF → mmap
│
├─ 25-V4L2-QBUF到DQBUF取流闭环.html
│  QBUF → STREAMON → poll → DQBUF → QBUF
│
└─ 26-V4L2连续100帧统计与资源清理.html
   capture_frames → update_stats → print_summary
   错误 → cleanup → STREAMOFF/munmap/REQBUFS(0)/close
```

`23` 继续作为课程阶段 08 的入口，不重复承载三个专题页的全部细节。`24 → 25 → 26` 是推荐阅读顺序，但每页也能独立打开。

## 4. 页面内容

### 4.1 阶段总览页：23

保留现有三张图和已有结论，只增加：

- “从实验代码开始追”的三个专题入口；
- 每个入口明确对应 Day1–Day6 的哪部分；
- 页面底部由“直接跳阶段 09”调整为“进入专题 24”并保留阶段 09 出口；
- 指向 Day6 README、验收记录和程序源码的链接。

### 4.2 专题 24：初始化与 Buffer 映射

本页回答“开流前应用究竟做了什么”。

图一：应用代码直接调用顺序。

```text
main()
├─ open()
├─ set_format()
│  └─ xioctl(VIDIOC_S_FMT)
├─ request_buffers()
│  └─ xioctl(VIDIOC_REQBUFS)
└─ map_buffers()
   ├─ xioctl(VIDIOC_QUERYBUF)
   └─ mmap()
```

图二：ioctl 从 V4L2 Core 分发到 RKISP/VB2。

```text
ioctl(fd, VIDIOC_S_FMT)
→ video_ioctl2()
→ __video_do_ioctl()
→ rkisp_s_fmt_vid_cap_mplane()

ioctl(fd, VIDIOC_REQBUFS / QUERYBUF)
→ video_ioctl2()
→ __video_do_ioctl()
→ vb2_ioctl_reqbufs() / vb2_ioctl_querybuf()
→ VB2 Core
```

图三：对象与地址关系。

```text
VB2/驱动 Buffer
↕ QUERYBUF 返回 length + offset
mmap 建立用户虚拟地址映射
↕
应用 mapped_buffer.start[] / length[]
```

本页必须明确：`mmap()` 建立映射，不等于复制一帧，也不代表已有有效图像。

### 4.3 专题 25：QBUF 到 DQBUF 闭环

本页回答“帧怎样真正进入 Buffer，再回到应用”。

图一：应用 10/100 帧循环中的直接调用。

```text
queue_all_buffers()
→ queue_one_buffer()
→ xioctl(VIDIOC_QBUF)

start_streaming()
→ xioctl(VIDIOC_STREAMON)

capture_frames()
→ wait_until_frame_ready()
→ poll()
→ xioctl(VIDIOC_DQBUF)
→ queue_one_buffer()
```

图二：STREAMON 框架回调与 RKISP 启动。

```text
VIDIOC_STREAMON
→ video_ioctl2()
→ vb2_ioctl_streamon()
→ vb2_core_streamon()
→ vb2_start_streaming()
⇢ rkisp_start_streaming()       框架通过 vb2_ops 回调
→ rkisp_stream_start()
⇢ rkisp_pipeline_set_stream()   通过 pipeline 函数指针/上游 subdev ops
```

图三：一帧完成后的反向路径。

```text
Sensor / D-PHY / CSI / ISP 产生并处理一帧
→ RKISP MI/DMA 写 ACTIVE Buffer
→ 帧结束 IRQ
→ rkisp_mi_v21_isr()
→ vb2_buffer_done(DONE)
→ 唤醒等待 DQBUF 的应用
→ VIDIOC_DQBUF 返回 index / sequence / timestamp / bytesused
```

本页必须明确：控制调用从应用向内核和上游推进，真实帧完成后再通过 Buffer 状态返回应用；两者不是同一方向、也不是同一条普通函数调用链。

### 4.4 专题 26：100 帧统计与统一清理

本页回答“怎样把能取一帧升级成可验收的小工具”。

图一：100 帧统计调用链。

```text
main()
→ capture_frames()
   ├─ wait_until_frame_ready()
   ├─ xioctl(VIDIOC_DQBUF)
   ├─ total_bytesused()
   ├─ clock_gettime(CLOCK_MONOTONIC)
   ├─ update_stats()
   └─ queue_one_buffer()
→ print_summary()
```

图二：Buffer 下标与帧序号的双循环。

```text
buf.index：0 → 1 → 2 → 3 → 0 → ...
sequence ：2 → 3 → 4 → 5 → 6 → ... → 101
```

图三：统一错误出口和逆序清理。

```text
任意初始化/取帧步骤失败
              ↘
成功完成100帧 → cleanup:
                  └─ cleanup_capture()
                     ├─ VIDIOC_STREAMOFF（已经开流才执行）
                     ├─ munmap（只撤销成功的映射）
                     ├─ VIDIOC_REQBUFS(count=0)
                     ├─ free()
                     └─ close()
```

本页使用真实板端结果：100 帧、约 30 FPS、sequence `2..101`、gap `0`、timeout `0`、bytesused `12441600`，并解释 100 个采样点只有 99 个首尾时间间隔。

## 5. 统一视觉语义

三个专题页沿用现有深色风格，但以可读性优先：

| 视觉元素 | 含义 |
|---|---|
| 灰蓝实线箭头 | 源码中的直接函数调用 |
| 紫色虚线箭头 | 函数指针、ops 表、对象关联或框架回调 |
| 绿色箭头 | 帧数据、Buffer 所有权或 DONE Buffer 返回 |
| 青色节点 | 用户程序或 V4L2 通用入口 |
| 紫色节点 | VB2 通用框架 |
| 橙色节点 | RKISP 驱动与硬件控制 |
| 绿色节点 | 完成帧、统计结果或成功证据 |

图形约束：

- 每张图只表达一个核心关系，不把注册、开流、IRQ 和清理塞进同一张图；
- 图中正文最小字号为 16px；
- 函数节点同时给出函数名、中文职责和源码文件；
- 连线不得穿过节点正文；
- 不使用局部放大按钮和内部滚动框；
- 桌面端使用 SVG，窄屏使用对应的纵向 HTML 调用链，避免 SVG 整体缩小后无法阅读。

## 6. 源码与笔记链接

专题页链接到以下权威材料：

- Day1–Day3 初始化实验源码；
- Day4 `capture_10_frames.c`；
- Day5 `capture_one_frame.c` 与图像证据；
- Day6 `capture_100_frames.c`、`capture.log`、`fps-result.txt` 与验收记录；
- `02-源码陪读/08-V4L2用户态取流` 的生命周期、对象与数据链、调试验收三篇笔记；
- E 盘内核学习副本中的 V4L2 ioctl、Videobuf2 和 RKISP Capture 源码位置。

网页不复制整段内核源码，只保留 Source Insight 所需的“文件 + 搜索符号 + 本函数只看什么”。详细逐行解释继续放在 Obsidian 源码陪读中。

## 7. 导航

所有页面顶部显示：

```text
学习首页 | 完整路线 | 项目 | 资料与实验 | 当前阶段08
```

专题内部底部导航：

```text
23 总览 → 24 初始化 → 25 取流闭环 → 26 稳定性与清理 → 阶段09
```

`23` 中同时保留“跳过专题直接进入阶段09”的次要入口，避免专题页变成课程主线的强制新阶段。

## 8. 验收标准

### 内容正确性

- 每条实线都能在源码中找到直接调用语句；
- 每条虚线都明确标注通过哪张 ops 表、哪个函数指针或哪个框架发生回调；
- 数据线不冒充普通 C 函数调用；
- Day6 实测数字与保存的 `capture.log`、`fps-result.txt` 一致；
- 所有“能证明/不能证明”均与现有板端证据相符。

### 导航与链接

- `23 → 24 → 25 → 26` 连续跳转正确；
- 三个专题均能返回阶段08总览、课程路线和对应 Obsidian 笔记；
- 本地 `file:///` 直接打开时不依赖服务器；
- 仓库链接检查无新增死链。

### 视觉

- 在 390、768、1024、1440 像素宽度下检查；
- 无文字重叠、连线穿字、横向裁切和小到不可读的说明；
- 桌面 SVG 与窄屏纵向调用链表达相同关系；
- 页面不出现内部滚动容器。

### 仓库

- 执行项目现有构建/检查脚本；
- 执行 `node tools/check-vault-links.mjs`；
- 执行 `git diff --check`；
- 保留用户现有脏工作区，不覆盖无关修改；
- 本轮不自动 commit、不 push。

## 9. 后续扩展

阶段08完成并验证后，将“一页总览 + 必要专题页”的模式逐步应用到阶段00–07。是否拆专题以认知负担为准，不追求每个函数单独一页，也不批量生成缺少真实源码关系的空页面。
