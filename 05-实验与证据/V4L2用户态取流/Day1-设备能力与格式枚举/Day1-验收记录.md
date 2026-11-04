---
doc-type: evidence
title: V4L2 用户态编程 Day 1 验收记录
course-stage: "08"
learning-status: completed
evidence-status: verified
updated: 2026-08-29
---

# V4L2 用户态编程 Day 1 验收记录

## 今天已经实际完成

- 使用 `v4l2-ctl` 查询板端 `/dev/video0` 的能力、当前格式和格式列表。
- 编写并交叉编译 `query_device.c`，在 RK3568 上运行成功。
- 程序依次调用 `VIDIOC_QUERYCAP`、`VIDIOC_ENUM_FMT`、`VIDIOC_G_FMT`。
- 自动验收结果：`Day 1 query_device acceptance: PASS`。
- 当前事实：`rkisp_mainpath`、3840×2160、NV12、Multiplanar API、`num_planes=1`。

实验说明：[[05-实验与证据/V4L2用户态取流/Day1-设备能力与格式枚举/README|代码阅读、编译与运行说明]]

## 先按这个顺序看代码

```text
main()
  → open("/dev/video0", O_RDWR)
  → query_capabilities()
       └─ ioctl(VIDIOC_QUERYCAP)
  → enumerate_formats()
       └─ ioctl(VIDIOC_ENUM_FMT)，改变 index 反复查询
  → get_current_format()
       └─ ioctl(VIDIOC_G_FMT)
  → close()
```

第一遍只确认：**应用把哪一个结构体地址交给哪个 ioctl，驱动又回填了哪些字段。**

## 你的 Day 1 验收题

### 1. `/dev/video0` 为什么不是 IMX415 Sensor？

我的回答：Sensor 是最底层的，需要通过好几层映射之后才到 mainpath 节点。

评价：方向基本正确，但“最底层”和“映射”不够准确。IMX415 更适合称为整条图像管线的上游数据源；图像不是被简单映射成 `/dev/video0`，而是经过 D-PHY、CSI 和 ISP 的接收、传输与处理后，由 mainpath Video Node 通过 Buffer 交给应用。

> [!success]- 正确答案（回答后再展开）
> `/dev/video0` 的 driver 是 `rkisp_v5`，card/entity 是 `rkisp_mainpath`，它是 RKISP 处理后给应用取帧的 Video Node。IMX415 是上游 Sensor subdev，不直接作为 `/dev/video0` 给应用读取图像 Buffer。

### 2. `VIDIOC_QUERYCAP` 查询的是什么？

我的回答：IMX415。

评价：错误。程序执行的是 `open("/dev/video0")`，所以得到的 `fd` 指向 `rkisp_mainpath`。随后对这个 `fd` 执行 `VIDIOC_QUERYCAP`，查询的是 `/dev/video0` 这个 Video Node 的能力，不会越过 RKISP 去查询 IMX415。

> [!success]- 正确答案（回答后再展开）
> 查询当前 Video Node 向用户态声明的能力，例如驱动名、设备名、总线信息，以及是否支持 Capture、Multiplanar API 和 Streaming。它不是查询 IMX415 的芯片 ID。

### 3. `Video Capture Multiplanar` 对代码意味着什么？

我的回答：有录像、拍照的能力；不能说明 NV12 一定有两个内存 Plane。

评价：后一半正确，前一半需要修正。`Video Capture` 表示节点能够把视频帧采集到内存；拍照或录像是应用拿到帧以后选择保存一帧还是连续保存，不是这个能力位直接区分的。`Multiplanar` 说明程序必须使用 MPlane API。

> [!success]- 正确答案（回答后再展开）
> ioctl 使用 `V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE`；格式字段使用 `fmt.fmt.pix_mp`；后续 Buffer ioctl 还要提供 `struct v4l2_plane[]`。它不代表当前格式一定返回多个内存 Plane；本板 NV12 当前就是 `num_planes=1`。

### 4. FourCC 为 NV12 说明什么？

我的回答：NV12，不是 IMX415 直接输出的 RAW10，是转换过后的数据。

评价：正确。还可以补充：NV12 属于 YUV 4:2:0 半平面格式，内存中先保存 Y 分量，后面保存交错排列的 UV 分量；当前转换工作由 RKISP 完成。

> [!success]- 正确答案（回答后再展开）
> 当前 Video Node 输出 YUV 4:2:0 半平面格式：先保存 Y，再保存交错 UV。它是 RKISP 给应用的输出格式，不是 IMX415 在 MIPI 链路上传输的 RAW10 Bayer。

### 5. 查询成功为什么不能证明能够抓到图？

我的回答：不清楚。

评价：查询能力和格式时，驱动只需返回软件中保存的能力表和当前配置，不要求 Sensor 此刻真的输出图像。要证明能够抓帧，至少还要申请并映射 Buffer、把 Buffer 入队、启动数据流、取回一帧完成 Buffer，并检查 `bytesused`、`sequence` 和图像内容。

> [!success]- 正确答案（回答后再展开）
> 查询只证明节点存在、驱动能响应并返回能力或格式。程序还没有申请 Buffer、QBUF、STREAMON 或 DQBUF，因此不能证明整条 Camera 管线正在持续出帧。

## Day 1 验收结论

- 编程实验：通过。
- 板端自动验收：通过。
- 五道题：已回答并完成纠正。
- 仍需加强：区分“驱动返回静态能力/配置”和“硬件管线已经产生真实帧”。
- 下一步：Day 2 使用 `VIDIOC_S_FMT` 请求 NV12，并只相信驱动回填结果。
