---
doc-type: evidence
title: V4L2 用户态编程 Day 6 连续取帧验收记录
course-stage: "08"
learning-status: in-progress
evidence-status: verified
updated: 2026-08-30
---

# V4L2 用户态编程 Day 6 连续取帧验收记录

## 今天已经实际完成

- 在 RK3568 板端从 `/dev/video0` 连续取得 100 帧 3840×2160 NV12。
- 4 个 MMAP Buffer 以 `0 → 1 → 2 → 3` 的顺序循环复用。
- 保存每帧的 `index`、`sequence`、`timestamp`、`bytesused` 和 `flags`。
- 用应用侧单调时钟统计 100 帧之间的 99 个时间间隔。
- 检查 sequence 缺口、poll 超时和 bytesused 范围。
- 完成统一错误出口与 `STREAMOFF → munmap → REQBUFS(0) → free → close`。
- 自动验收连续执行两遍均成功：`29.985 FPS`、`29.957 FPS`。

完整源码：[[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture_100_frames.c|capture_100_frames.c]]

板端日志：[[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture.log|capture.log]]

FPS 汇总：[[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/fps-result.txt|fps-result.txt]]

学习入口：[[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/README|推荐观看顺序]]

## 一、本次实际结果

```text
格式             ：NV12 3840×2160
内存 Plane       ：1
Buffer 数量      ：4
连续完成帧数     ：100
统计时长         ：3.300023 秒
实际帧率         ：30.000 FPS
sequence         ：2 → 101
sequence gap     ：0
poll timeout     ：0
bytesused 最小值 ：12441600
bytesused 最大值 ：12441600
```

100 个帧采样点之间只有 99 个间隔，所以程序采用：

```text
FPS = (100 - 1) / (最后一帧时刻 - 第一帧时刻)
    = 99 / 3.300023
    ≈ 30.000
```

不是用 `100 / 3.3`。计时从第一帧到达时才开始，第一帧之前的启动等待不属于这 99 个帧间隔。

## 二、两个递增编号不要混淆

日志开头是：

```text
frame[000] index=0 sequence=2
frame[001] index=1 sequence=3
frame[002] index=2 sequence=4
frame[003] index=3 sequence=5
frame[004] index=0 sequence=6
```

它们的含义不同：

| 字段 | 谁维护 | 含义 |
|---|---|---|
| `frame[000..099]` | 当前测试程序 | 本程序本轮成功处理了第几帧 |
| `buf.index` | VB2/驱动队列 | 当前完成的是 4 个 Buffer 中的哪一个 |
| `buf.sequence` | 驱动 | Camera 流中的帧序号，用于观察不连续 |

白话理解：

```text
4 个 Buffer = 4 个可以反复使用的周转箱
100 个 sequence = 100 批依次到达的货物
```

不是“一帧永久占用一个 Buffer”。应用 DQBUF 处理完后立即 QBUF，驱动便能把同一个周转箱用于后续新帧。

## 三、100 帧循环里发生了什么

```text
poll(fd)
  │ 只等待：队列中是否出现 DONE Buffer
  ▼
VIDIOC_DQBUF
  │ 驱动把一个完成 Buffer 的所有权交给应用
  ├─ index：去哪个 mmap 地址读
  ├─ sequence：检查帧编号是否连续
  ├─ timestamp：驱动记录的帧时间
  └─ bytesused：当前帧有效字节数
  ▼
update_stats()
  │ 更新首尾时间、缺口、最小/最大有效长度
  ▼
VIDIOC_QBUF
  │ 应用用完，把空 Buffer 还给驱动
  └─ 下一帧继续循环
```

在 30 FPS 下，平均约每 33.3 ms 完成一帧。应用不需要每秒重新申请 30 个 Buffer，而是让有限 Buffer 在驱动和应用之间不断交换所有权。

Buffer 也不是越多越好：数量太少容易因应用处理抖动让驱动无容器可写；数量太多会增加内存占用，并可能增加排队延迟。当前 4 个 Buffer 足以完成本次直接取帧测试。

## 四、错误路径为什么统一进入 cleanup

初始化可能停在任何一步：

```text
open 成功，但 S_FMT 失败
REQBUFS 成功，但某个 mmap 失败
STREAMON 成功，但 DQBUF 失败
100 帧成功，但 STREAMOFF 失败
```

如果每个函数直接 `exit()`，后面已取得的资源可能没有机会释放。Day6 把状态保存在 `capture_context`：

```c
struct capture_context {
    int fd;
    struct mapped_buffer *buffers;
    unsigned int buffer_count;
    bool queue_allocated;
    bool streaming;
};
```

任何失败都返回到 `main()` 的同一个 `cleanup:` 标签。`cleanup_capture()` 根据标志只释放已经成功取得的资源，并按逆序处理：

```text
STREAMOFF
→ munmap 每个已映射 Plane
→ REQBUFS(count=0) 释放 VB2 队列
→ free 应用登记表
→ close fd
```

`goto cleanup` 在这里不是随意跳转，而是 C 系统程序中常见的集中资源回收方式。自动脚本连续运行程序两次，就是为了发现“第一次成功、退出没清干净、第二次失败”的问题。

## 五、能证明什么，不能证明什么

当前证据能够证明：

- 在约 3.3 秒观察窗口内，`/dev/video0` 连续返回了 100 个完成 Buffer。
- 应用观察到的 sequence 从 2 连续增长到 101，没有序号缺口。
- 100 帧的 `bytesused` 都是 12441600，没有空帧或长度波动。
- 本轮没有 poll 超时，实测帧率接近配置目标 30 FPS。
- 程序完整退出后可以立刻再次运行，正常路径的资源释放有效。

当前证据不能单独证明：

- 数小时或数天运行仍然零丢帧、零超时。
- Sensor、MIPI 和 ISP 内部从未发生过任何可恢复错误。
- 每一帧图像内容、曝光和颜色都正确；图像内容由 Day5 的 PNG 验证。
- 应用做复杂算法时仍能保持 30 FPS；本程序每帧只统计元数据并立即 QBUF。
- 断线、驱动报错或强制杀进程等异常情形都已覆盖。

## 六、你的 Day6 验收题

### 1. 程序只申请了 4 个 Buffer，为什么仍然能连续取得 100 帧？

我的回答：

四个 Buffer 轮转复用。

> [!success]- 正确答案（回答后再展开）
> Buffer 是循环复用的容器，不是一帧绑定一个永久 Buffer。驱动写满后应用 DQBUF，应用处理完再 QBUF 归还；同一组 Buffer 可以不断承载后续帧。

### 2. `buf.index` 和 `buf.sequence` 分别表示什么？为什么日志中的 index 会重复，而 sequence 持续增加？

我的回答：

`buf.index` 表示 Buffer 在有限队列中的位置；`buf.sequence` 是驱动给当前帧记录的连续帧序号。index 因为 Buffer 被循环复用而重复，sequence 随着新帧持续增加。

> [!success]- 正确答案（回答后再展开）
> index 是当前完成 Buffer 在有限队列中的下标，用于找到对应 mmap 地址，所以会循环复用；sequence 是驱动维护的帧序号，用于观察帧顺序和缺口，因此随新帧持续增加。

### 3. `STREAMON` 返回 0，与“100 帧、sequence gap=0、poll timeout=0”相比，各自能证明什么？

我的回答：

`STREAMON` 只能证明开流操作成功，不能保证一定已经出图。连续取得 100 帧，且 sequence 没有缺口、poll 没有超时，说明当前测试时间内实际取流成功并且保持连续。

> [!success]- 正确答案（回答后再展开）
> STREAMON 返回 0 只证明启动调用链没有立即报错；后者证明在当前约 3.3 秒窗口中持续得到了完成 Buffer，并且应用观察到的序号连续、等待未超时。

### 4. 为什么程序用 99 除以第一帧到最后一帧的时长，而不是用 100？

我的回答：

开始时不懂；解释后明白：10 帧的第一帧到第 10 帧之间有 9 个间隔，因此 100 帧对应 99 个间隔。

> [!success]- 正确答案（回答后再展开）
> 100 个帧时刻之间只有 99 个相邻时间间隔。计时从第一帧时刻开始，到第 100 帧时刻结束，因此应使用 99 个间隔计算平均 FPS。

### 5. 为什么验收脚本要把程序连续运行两次？

我的回答：

最开始认为是为了让数据更加权威、准确。补充后理解：更主要是验证第一次退出时是否正确完成 `STREAMOFF`、`munmap`、`REQBUFS(0)` 和 `close`；如果资源残留，第二次打开或开流可能失败。

> [!success]- 正确答案（回答后再展开）
> 为了发现正常退出时遗漏 STREAMOFF、munmap、REQBUFS(0) 或 close 等清理造成的残留占用。第二次仍能立即开流，说明正常路径的资源回收至少通过了重复运行验证。
