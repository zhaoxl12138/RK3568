---
doc-type: evidence
title: V4L2 用户态编程 Day 4 验收记录
course-stage: "08"
learning-status: in-progress
evidence-status: verified
updated: 2026-08-30
---

# V4L2 用户态编程 Day 4 验收记录

## 今天已经实际完成

- 将 4 个 MMAP Buffer 全部通过 `VIDIOC_QBUF` 交给驱动。
- 使用 `VIDIOC_STREAMON` 启动 Capture 队列和 Camera 管线。
- 使用带 2 秒超时的 `poll()` 等待完成帧，避免异常时无限阻塞。
- 连续执行 10 次 `VIDIOC_DQBUF`，打印 `index`、`sequence`、`timestamp`、`flags` 和 `bytesused`。
- 每次处理完成后重新 `QBUF`，维持 Buffer 循环。
- 使用 `VIDIOC_STREAMOFF` 停止管线，再依次释放映射和驱动 Buffer。
- 板端自动验收：`Day 4 QBUF/STREAMON/DQBUF acceptance: PASS`。

完整源码：[[05-实验与证据/V4L2用户态取流/Day4-QBUF与连续取帧/capture_10_frames.c|capture_10_frames.c]]

完整输出：[[05-实验与证据/V4L2用户态取流/Day4-QBUF与连续取帧/capture-10.log|capture-10.log]]

实验说明：[[05-实验与证据/V4L2用户态取流/Day4-QBUF与连续取帧/README|四个关键动作与推荐观看顺序]]

## 一、Day4 相比 Day3 真正多了什么

Day3 的结尾是：

```text
驱动已经建立 4 个 Buffer
→ 应用已经 mmap 得到 4 个用户虚拟地址
→ 但 Buffer 仍由应用持有
→ Camera 管线尚未启动
→ 没有有效帧证据
```

Day4 新增的是 **Buffer 所有权循环和真实开流**：

```text
应用持有空 Buffer
        │
        │ VIDIOC_QBUF
        ▼
驱动队列：QUEUED
        │ 驱动选中它供硬件写入
        ▼
ACTIVE
        │ ISP/MI/DMA 完成一帧
        ▼
DONE
        │
        │ VIDIOC_DQBUF
        ▼
应用重新持有完成 Buffer
        │ 读取 index / bytesused / 映射地址
        │
        └─ VIDIOC_QBUF → 进入下一轮
```

白话解释：应用不是向驱动“索要一张临时图片”，而是提前准备几个可重复使用的容器。容器在应用和驱动之间循环，图像数据写进这些容器。

## 二、第一遍只追这条控制流

```text
queue_all_buffers()
        │ 对 buffer[0..3] 分别调用
        ▼
VIDIOC_QBUF
        │ 空 Buffer 所有权交给驱动
        ▼
VIDIOC_STREAMON
        │ 启动 Capture 队列及上游管线
        ▼
poll(fd, timeout=2000ms)
        │ 只等待“有完成 Buffer 可取”
        ▼
VIDIOC_DQBUF
        │ 驱动交还一个 DONE Buffer
        ▼
打印 index / sequence / timestamp / flags / bytesused
        │ Day4 不保存图像
        ▼
VIDIOC_QBUF
        │ 将用完的 Buffer 再次交给驱动
        └──────── 重复 10 帧
        ▼
VIDIOC_STREAMOFF
```

不要先钻进 `xioctl()`、`mmap()` 和清理函数。它们分别是通用封装、Day3 内容和资源收尾，不是 Day4 新知识。

## 三、结合代码理解四个关键动作

### 1. `QBUF`：交出去的是空 Buffer

```c
buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
buf.memory = V4L2_MEMORY_MMAP;
buf.index = index;
buf.length = num_planes;
buf.m.planes = planes;

ioctl(fd, VIDIOC_QBUF, &buf);
```

这里的 `index` 指定交出 `buffer[0]`、`buffer[1]`……中的哪一个。对于 Capture 队列，第一次 `QBUF` 交给驱动的是**等待写入的空容器**，不是应用已经准备好的图像。

### 2. `STREAMON`：启动调用链，不等于已经拿到帧

```c
enum v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
ioctl(fd, VIDIOC_STREAMON, &type);
```

`STREAMON` 返回 0 只能证明开流调用链没有立即报错。真实帧还要等待硬件完成写入，再由 `DQBUF` 返回；因此不能看到 `STREAMON=0` 就宣称“已经出图”。

### 3. `poll()`：等事件，不取 Buffer

```c
pfd.fd = fd;
pfd.events = POLLIN | POLLPRI;
poll(&pfd, 1, 2000);
```

`poll` 的作用是等待 Video Node 变为可读，也就是通常已有完成 Buffer 可供 `DQBUF`。它不会复制图像，也不会改变 Buffer 所有权。2 秒超时让断流问题能够明确暴露，而不是让程序永远卡住。

### 4. `DQBUF`：取回一个完成 Buffer

```c
buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
buf.memory = V4L2_MEMORY_MMAP;
buf.length = VIDEO_MAX_PLANES;
buf.m.planes = planes;

ioctl(fd, VIDIOC_DQBUF, &buf);
```

调用成功后重点读取：

| 字段 | 本次含义 |
|---|---|
| `buf.index` | 哪一个映射 Buffer 完成，应用应访问 `buffers[index]` |
| `buf.sequence` | 驱动记录的帧序号，可检查当前样本是否连续 |
| `buf.timestamp` | 当前帧时间戳，不应直接理解成墙上时钟时间 |
| `buf.flags` | Buffer 状态、时间戳类型、错误等标记位 |
| `planes[p].bytesused` | 当前帧在该 Plane 中实际有效的数据字节数 |

应用处理完成后必须重新执行：

```c
ioctl(fd, VIDIOC_QBUF, &buf);
```

否则可供驱动写入的 Buffer 会越来越少，最终全部被应用占住，连续采集就会停止。

## 四、板端输出怎样读

本次关键结果：

```text
driver buffers   : 4
queued buffers   : 4
stream status    : ON

index     : 0 → 1 → 2 → 3 → 0 → 1 → 2 → 3 → 0 → 1
sequence  : 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
bytesused : 每帧均为 12441600

captured frames  : 10
stream status    : OFF
```

`12441600` 正好等于：

```text
3840 × 2160 × 3 / 2 = 12441600
```

这与 8-bit NV12 的理论帧大小一致。`sequence=2..11` 在本次取得的 10 帧内连续；它能证明该样本内没有序号跳变，但不能据此证明长时间运行永不丢帧。

## 五、Buffer 多大，以及录像时怎样循环

### 1. Buffer 大小由协商后的图像格式决定

应用先执行 `VIDIOC_S_FMT`，驱动根据最终接受的宽高、像素格式、stride 和对齐要求回填：

```text
fmt.fmt.pix_mp.plane_fmt[p].sizeimage
```

对于当前 3840×2160、8-bit NV12：

```text
一帧理论数据量
= 3840 × 2160 × 1.5
= 12441600 字节
```

本板实际返回：

```text
planes[0].length = 12441600   // 这个 Plane 的分配容量
planes[0].bytesused = 12441600 // 当前帧实际有效数据量
```

应用通过 `REQBUFS(count=4)` 请求数量；在 MMAP 模式下，RKISP/VB2 根据前面协商的 `sizeimage` 为每个 Buffer 准备足够容量。应用不需要在 `REQBUFS` 中再次填写 12441600。

当前 4 个 Buffer 合计约占：

```text
12441600 × 4 = 49766400 字节，约 47.5 MiB
```

这里的大小不是每帧临时变化的。通常是在设置格式、建立队列时确定；如果更换分辨率或像素格式，一般要先 `STREAMOFF`，释放原队列，重新 `S_FMT` 和 `REQBUFS`。

补充区别：NV12 这类未压缩格式的 `bytesused` 通常较固定；JPEG、H.264 等压缩数据每帧大小可能不同，此时 Buffer 分配的是最大容量，而每帧真正有效长度看 `bytesused`。

### 2. 录像时 Buffer 会一直循环，但不是把内存清零

可以先把状态简化成“空 → 满 → 空”，但工程上更准确的是所有权和有效性的循环：

```text
应用持有，可交给驱动
        │ QBUF
        ▼
QUEUED：排队等待
        ▼
ACTIVE：硬件正在写入
        ▼
DONE：一帧已经写完
        │ DQBUF
        ▼
应用持有并读取有效帧
        │ 处理完成后再次 QBUF
        └────────────────→ 下一轮
```

重新 `QBUF` 并不会先把整块内存清零。旧帧数据可能仍在里面，只是应用已经放弃该帧的所有权；下一次硬件使用这个 Buffer 时，会用新帧覆盖有效区域。

录像时通常准备多个 Buffer 组成循环池。例如当前有 4 个：一个可能正在由 DMA 写入，几个在驱动队列中等待，一个可能刚刚 DONE 或正在被应用处理。这样硬件和应用可以并行工作。

如果应用 `DQBUF` 后长期不重新 `QBUF`，驱动可用的 Buffer 会越来越少；全部被应用占住后，即使 Sensor 仍在送数据，也没有容器接收新帧，最终会停顿、超时或丢帧。

### 3. 30 FPS 与 Buffer 数量

30 FPS 表示理想情况下硬件每约 33.3 ms 完成一帧。因此持续处理每一帧时，应用每秒通常也会完成约 30 轮 `DQBUF → 处理 → QBUF`。

这不表示 CPU 每秒把整帧复制两次。图像主要由 DMA 写入已经映射的 Buffer；`QBUF/DQBUF` 主要改变 Buffer 所有权和队列状态，应用通过 mmap 地址读取同一块底层内存。

Buffer 数量不是越多越好：

| 数量情况 | 影响 |
|---|---|
| 太少 | 应用稍慢就会耗尽驱动可写 Buffer，容易停顿或丢帧 |
| 适中 | 硬件写帧与应用处理可以并行，并能吸收短时间调度抖动 |
| 太多 | 占用大量连续/DMA 内存；应用落后时队列积压，取到的帧更旧、延迟更高 |

实际数量受驱动最小队列深度、驱动允许上限和可用内存限制。应用填写的 `REQBUFS.count` 只是请求值，必须使用驱动返回的实际 `req.count`。

当前 4K NV12 每个 Buffer 为 12441600 字节：4 个约 47.5 MiB，8 个约 94.9 MiB。对于普通连续采集，3～4 个常见；是否增加要看应用单帧处理时间和抖动，而不是靠堆 Buffer 提高 Sensor 帧率。

当前板端时间戳每帧约相差 0.0333 秒，和 30 FPS 相符。4 个 Buffer 循环时，并不是每秒创建 30 个新 Buffer，而是同一组 Buffer 被反复复用。

## 六、能证明什么，不能证明什么

当前证据能够证明：

- `/dev/video0` 能启动 Capture 流。
- 驱动能够完成 Buffer 的 `QBUF → ACTIVE → DONE → DQBUF` 循环。
- 应用连续取回 10 个非空 Buffer。
- 本次 10 帧的 `sequence` 连续，`bytesused` 与 4K NV12 理论大小一致。

当前证据仍不能证明：

- NV12 中的画面内容、亮度和颜色正确。
- 宽高、stride 或色彩解释绝对没有错误。
- 长时间运行不会丢帧、超时或内存泄漏。
- 自动曝光、自动白平衡和画质效果正确。

这些需要 Day5 保存并查看图像，以及后续稳定性实验。

## 七、你的 Day4 验收题

### 1. 对 Capture 队列来说，第一次 `QBUF` 交给驱动的是空 Buffer，还是一张已经完成的图像？

我的回答：

是空的。

> [!success]- 正确答案（回答后再展开）
> 交出去的是等待硬件写入的空 Buffer。`QBUF` 把它的使用权交给驱动，随后驱动选择它成为 ACTIVE Buffer，并由 ISP/MI/DMA 写入一帧。

### 2. `VIDIOC_STREAMON` 返回 0，为什么还不能单独证明已经有图像帧？

我的回答：

只能证明开流动作是正常的，不能证明已经从 Sensor 取到数据。

> [!success]- 正确答案（回答后再展开）
> 返回 0 只说明启动队列和上游管线的调用链没有立即失败。要证明已有帧，还需要 `poll` 就绪、`DQBUF` 成功、非零 `bytesused`，并进一步检查保存后的图像内容。

### 3. 谁把 Buffer 从 ACTIVE 变为 DONE？`poll()` 会做这件事吗？

我的回答：

不清楚。

> [!success]- 正确答案（回答后再展开）
> 一帧由 ISP/MI/DMA 写入完成后，RKISP 驱动在帧完成/中断处理路径中把 VB2 Buffer 标记为 DONE。`poll()` 只等待并报告“已有完成 Buffer 可取”，它不完成 DMA，也不改变 Buffer 状态。

### 4. `DQBUF` 取回的到底是什么？应用怎样找到这一帧的内存？

我的回答：

`DQBUF` 取回的是完成 Buffer 的描述和所有权，不是另外复制的一张图；应用通过 `buf.index` 找到已经 mmap 的内存。

> [!success]- 正确答案（回答后再展开）
> `DQBUF` 取回的是一个已经完成的 Buffer 描述及其所有权，不是额外复制的一份图像。应用读取 `buf.index`，再访问 Day3 保存的 `buffers[buf.index].start[plane]` 映射地址；有效长度看 `planes[plane].bytesused`。

### 5. 为什么处理完一帧后还要再次 `QBUF`？如果一直不归还会怎样？

我的回答：

驱动端会报错吧。

> [!success]- 正确答案（回答后再展开）
> Buffer 数量是有限的。应用 DQBUF 后会占有它，只有重新 QBUF 才能让驱动再次使用。若持续取走但不归还，可写空 Buffer 会逐渐耗尽，最终管线没有容器接收新帧，连续采集停止或超时。
