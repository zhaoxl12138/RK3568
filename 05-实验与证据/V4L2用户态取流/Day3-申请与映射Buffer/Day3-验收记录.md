---
doc-type: evidence
title: V4L2 用户态编程 Day 3 验收记录
course-stage: "08"
learning-status: in-progress
evidence-status: verified
updated: 2026-08-30
---

# V4L2 用户态编程 Day 3 验收记录

## 今天已经实际完成

- 使用 `VIDIOC_REQBUFS` 请求 4 个 MMAP Buffer，驱动实际返回 4 个。
- 为 Multiplanar API 准备 `struct v4l2_plane planes[VIDEO_MAX_PLANES]`。
- 对每个 Buffer 调用 `VIDIOC_QUERYBUF`，获得 Plane 数、长度和 mmap offset。
- 对 4 个 Buffer 的 `plane[0]` 分别执行 `mmap()`。
- 退出前执行 `munmap()`，再用 `REQBUFS(count=0)` 释放驱动队列。
- 板端自动验收：`Day 3 buffer mapping acceptance: PASS`。

实验说明：[[05-实验与证据/V4L2用户态取流/Day3-申请与映射Buffer/README|三个关键动作与边界]]

## 实测对象关系

```text
一个Video Node文件描述符 fd
└─ 一条VB2 Capture Queue
   ├─ buffer[0] ─ plane[0]：12441600字节 → 用户虚拟地址A
   ├─ buffer[1] ─ plane[0]：12441600字节 → 用户虚拟地址B
   ├─ buffer[2] ─ plane[0]：12441600字节 → 用户虚拟地址C
   └─ buffer[3] ─ plane[0]：12441600字节 → 用户虚拟地址D
```

当前只是“内存准备好并且应用能够访问”，还没有把 Buffer 排入驱动，也没有启动图像数据流。

## 结合代码看三个关键动作

完整源码：[[05-实验与证据/V4L2用户态取流/Day3-申请与映射Buffer/map_buffers.c|map_buffers.c]]

第一遍只看下面三段，不需要先看 `xioctl()`、错误处理和清理函数。

### 1. `REQBUFS`：请求驱动建立 Buffer 队列

```c
struct v4l2_requestbuffers req;

memset(&req, 0, sizeof(req));

req.count = 4;
// 应用希望获得 4 个 Buffer；这只是请求值。

req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
// 必须与 /dev/video0 的 Video Capture Multiplanar 类型一致。

req.memory = V4L2_MEMORY_MMAP;
// 选择 MMAP 内存交换方式，后面会用 mmap 建立用户态映射。

ioctl(fd, VIDIOC_REQBUFS, &req);
// fd 找到 /dev/video0；驱动建立/分配 Buffer 队列，
// 并把实际数量写回 req.count。

count = req.count;
// 后续循环必须使用驱动回填值，不能继续固定使用 4。
```

执行后，本板返回：

```text
请求值 req.count：4
回填值 req.count：4
```

这次两者相等，但 API 仍然要求应用相信回填值。

### 2. `QUERYBUF`：查询指定 Buffer 的内存信息

```c
struct v4l2_buffer buf;
struct v4l2_plane planes[VIDEO_MAX_PLANES];

memset(&buf, 0, sizeof(buf));
memset(planes, 0, sizeof(planes));

buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
buf.memory = V4L2_MEMORY_MMAP;
buf.index = index;
// index 表示本次查询 buffer[0]、buffer[1]……中的哪一个。

buf.length = VIDEO_MAX_PLANES;
buf.m.planes = planes;
// Multiplanar API 要求 m.planes 指向一组 Plane 描述结构体；
// 当前实际只有一个 Plane，但调用前仍要提供数组及容量。

ioctl(fd, VIDIOC_QUERYBUF, &buf);
// 驱动回填 buf.length（实际 Plane 数）以及每个 planes[] 的
// length、m.mem_offset 等信息；这里没有复制图像。
```

本板每次查询得到：

```text
buf.length = 1
planes[0].length = 12441600
planes[0].m.mem_offset = 当前Buffer的mmap偏移量
```

这里有两个容易混淆的 `length`：

| 字段 | 当前含义 |
|---|---|
| `buf.length` | 当前 Buffer 有几个 V4L2 内存 Plane，本板为 1 |
| `planes[0].length` | 第 0 个内存 Plane 占多少字节，本板为 12441600 |

### 3. `mmap()`：让应用得到可访问的虚拟地址

```c
buffers[index].start[plane] = mmap(
    NULL,
    planes[plane].length,
    PROT_READ | PROT_WRITE,
    MAP_SHARED,
    fd,
    planes[plane].m.mem_offset
);
```

逐项理解：

```text
NULL
→ 由内核选择当前进程中的虚拟地址

planes[plane].length
→ 映射多大的内存区域

PROT_READ | PROT_WRITE
→ 应用允许读写这段映射

MAP_SHARED
→ 应用与驱动共享同一块底层 Buffer，不创建私有副本

fd + mem_offset
→ 告诉内核要映射 /dev/video0 的哪一个 Buffer Plane
```

返回值保存到：

```c
buffers[index].start[plane]
```

它是当前进程能够访问的**用户虚拟地址**，不是 Camera 硬件地址，也不是物理地址。`mmap()` 只建立地址映射关系，不会在每一帧执行一次图像复制。

### 4. 当前完整执行顺序

```text
REQBUFS(count=4)
→ 驱动实际返回 req.count=4
→ QUERYBUF(index=0)
→ mmap buffer[0].plane[0]
→ QUERYBUF(index=1)
→ mmap buffer[1].plane[0]
→ QUERYBUF(index=2)
→ mmap buffer[2].plane[0]
→ QUERYBUF(index=3)
→ mmap buffer[3].plane[0]
→ 当前只完成内存准备，没有 QBUF、STREAMON 和有效帧
```

程序演示结束后还会执行：

```text
munmap 每一段用户虚拟地址
→ REQBUFS(count=0) 释放驱动 Buffer 队列
→ close(fd)
```

## 你的 Day 3 验收题

### 1. 应用请求 4 个 Buffer，为什么后续不能固定认为驱动一定返回 4 个？

我的回答：

> [!success]- 正确答案（回答后再展开）
> `REQBUFS` 中的 `count=4` 是应用请求值。驱动可能受最小队列深度、内存资源或自身策略影响回填不同数量，因此后续循环和数组大小必须使用 `req.count` 的实际返回值。

### 2. `VIDIOC_QUERYBUF` 查询了什么？是否把图像复制给了应用？

我的回答：

> [!success]- 正确答案（回答后再展开）
> 它查询指定 index 的 Buffer 元数据，包括内存 Plane 数量、每个 Plane 长度以及供 mmap 使用的 offset；它不复制图像，也不表示 Buffer 中已有有效帧。

### 3. `mmap()` 做了什么？它是否每帧复制一次图像？

我的回答：

> [!success]- 正确答案（回答后再展开）
> `mmap` 在当前进程的虚拟地址空间建立到驱动 Buffer 的映射。后续硬件/DMA 写入该 Buffer 后，应用通过映射地址访问同一块 Buffer；`mmap` 本身不是每帧 memcpy。

### 4. 当前 `num_planes=1`，为什么代码仍然需要 `struct v4l2_plane[]`？

我的回答：

> [!success]- 正确答案（回答后再展开）
> 因为该节点使用 Multiplanar API，`struct v4l2_buffer.m.planes` 必须指向 Plane 描述数组。数组容量支持多个 Plane，但当前驱动回填 `buf.length=1`，循环只处理 `planes[0]`。

### 5. 已经成功 mmap，为什么还不能读取并保存一帧有效图像？

我的回答：

> [!success]- 正确答案（回答后再展开）
> Buffer 还没有通过 `QBUF` 交给驱动，管线也没有 `STREAMON`。当前只建立了内存和地址关系，尚无证据表明 DMA 已向其中写入一帧；要等后续 `DQBUF` 返回完成 Buffer 才能处理有效数据。
