---
doc-type: evidence
title: V4L2 用户态编程 Day 2 验收记录
course-stage: "08"
learning-status: completed
evidence-status: verified
updated: 2026-08-30
---

# V4L2 用户态编程 Day 2 验收记录

## 今天已经实际完成

- 使用 `V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE`。
- 向 `/dev/video0` 请求 NV12、3840×2160、`V4L2_FIELD_NONE`。
- 调用 `VIDIOC_S_FMT`，并重新读取同一个 `fmt` 对象中的驱动回填值。
- 在 RK3568 上运行成功：`Day 2 set_format acceptance: PASS`。

```text
应用请求：NV12 3840x2160
驱动接受：NV12 3840x2160
num_planes：1
bytesperline：3840
sizeimage：12441600
```

实验说明：[[05-实验与证据/V4L2用户态取流/Day2-设置NV12格式/README|Day 2 关键代码与白话解释]]

## 今天只需要认识这一条线

```text
应用填写 struct v4l2_format fmt
        ↓
ioctl(fd, VIDIOC_S_FMT, &fmt)
        ↓
V4L2 Core 将请求交给 rkisp_v5
        ↓
驱动检查格式、分辨率和对齐要求
        ↓
驱动把实际结果写回同一个 fmt
        ↓
应用读取回填结果，作为后续申请 Buffer 的依据
```

## 你的 Day 2 验收题

### 1. `fmt` 是什么对象？

我的回答：应用创建的格式描述结构体。

评价：正确。补充一点：`fmt` 是结构体变量本身，`&fmt` 是该变量的内存地址。应用和驱动通过这块内存完成“双向传递”：调用前是应用请求，调用成功后是驱动回填结果。

> [!success]- 正确答案（回答后再展开）
> `fmt` 是用户态定义的 `struct v4l2_format` 变量，用来承载格式请求和驱动回填结果。它不是图像帧，也不是 Buffer；`&fmt` 才是 ioctl 传递给驱动的结构体地址。

### 2. `VIDIOC_S_FMT` 成功是否已经分配 Buffer？

我的回答：不能证明出流，只是确认参数是否支持的请求。

评价：正确。还要明确回答 Buffer：`S_FMT` 不会分配图像 Buffer；分配由后续 `VIDIOC_REQBUFS` 完成，开流由 `VIDIOC_STREAMON` 完成。

> [!success]- 正确答案（回答后再展开）
> 没有。`S_FMT` 只完成格式协商；Buffer 要到 Day 3 通过 `VIDIOC_REQBUFS` 申请，再通过 `QUERYBUF` 和 `mmap` 建立用户空间映射。

### 3. 为什么必须读取驱动回填值？

我的回答：不能直接使用请求值，因为这是双向数据交换。

评价：方向正确，但还需要说明驱动为什么会回填：应用给的是期望值，驱动可能按硬件能力、格式表和对齐规则修改它。后续申请 Buffer 时如果仍使用旧值，可能导致内存大小或行跨度计算错误。

> [!success]- 正确答案（回答后再展开）
> 应用填写的是期望值，驱动可能根据硬件能力、格式表和对齐要求修改宽高、像素格式、Plane 数、行跨度或 Buffer 大小。后续内存操作必须以驱动实际接受并回填的结果为准。

### 4. NV12 的 Y 与 UV 如何排列？

我的回答：不清楚。

评价：NV12 的一个图像 Buffer 前面是完整分辨率的 Y 亮度区，后面是以 `UVUV...` 交错排列的色度区。Y 区大小是 `width × height`，UV 区因为 4:2:0 采样占 Y 区的一半，因此总大小是 `width × height × 1.5`。

> [!success]- 正确答案（回答后再展开）
> NV12 是 YUV 4:2:0 半平面格式，先连续保存完整分辨率的 Y 平面，再保存宽高各减半、以 UVUV 方式交错排列的色度数据。总大小通常约为 `width × height × 1.5`。

### 5. NV12 内存布局与 V4L2 `num_planes` 为什么不能直接画等号？

我的回答：不能直接画等号，可以在一个内存空间中按顺序使用，先放 Y，再放 UV。

评价：正确。NV12 描述图像内容如何排列，`num_planes` 描述驱动给应用多少块独立内存。当前只有一个内存 Plane，但该内存内部同时包含 Y 区和 UV 区。

> [!success]- 正确答案（回答后再展开）
> NV12 的像素格式语义包含 Y 区和 UV 区，但 V4L2 驱动可以用一个内存 Plane 连续承载两部分，也可以用 NV12M 等格式拆成多个内存 Plane。本板返回 `num_planes=1`，所以不能看到 NV12 就固定创建两个 V4L2 Plane。

## Day 2 验收结论

- 格式设置实验：通过。
- 板端自动验收：通过。
- 五道题：已回答并完成纠正。
- 已掌握：`fmt` 的双向传递、`S_FMT` 与开流的区别、驱动回填值、NV12 大小计算、图像区域与内存 Plane 的区别。
- 下一步：Day 3 使用 `REQBUFS`、`QUERYBUF` 和 `mmap` 建立图像 Buffer。
