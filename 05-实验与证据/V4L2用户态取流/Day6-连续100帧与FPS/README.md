# Day 6：连续 100 帧、FPS 与异常清理

Day5 已经证明能够保存一张真实 NV12 图像。Day6 不再研究图像内容，而是检查应用能否持续接住 Camera 的帧，并且在退出后不留下占用状态。

```text
4 个 MMAP Buffer 先全部 QBUF
        ↓
STREAMON 启动管线
        ↓
poll 等待 DONE Buffer
        ↓
DQBUF：应用取得一帧及其 index / sequence / bytesused
        ↓
记录统计，再 QBUF 归还同一个 Buffer
        ↓
重复 100 次
        ↓
STREAMOFF → munmap → REQBUFS(0) → free → close
```

## 推荐观看顺序

1. 先看 [[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/Day6-验收记录|Day6 验收记录]] 的“本次实际结果”和“两个编号不要混淆”。
2. 再打开 [[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture_100_frames.c|capture_100_frames.c]]，按下面顺序搜索：

```text
main
→ capture_frames
→ update_stats
→ print_summary
→ cleanup_capture
```

3. 最后对照 [[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/capture.log|100 帧完整日志]] 和 [[05-实验与证据/V4L2用户态取流/Day6-连续100帧与FPS/fps-result.txt|FPS 汇总]]。

今天不要重新逐行研究 Day1–Day5 的初始化代码。只看新增的三件事：

- `sequence` 怎样发现应用观察到的帧序号缺口；
- 首帧和末帧时间怎样换算 FPS；
- 任何失败为什么都要跳到同一个 `cleanup` 出口。

## 今天最重要的三句话

> `buffer index` 表示这帧存在哪一个循环复用的容器；`sequence` 表示它是第几帧。四个 Buffer 可以不断承载上百帧。

> 30 FPS 不需要申请 30 个 Buffer；它表示硬件大约每 33.3 ms 完成一帧，应用必须及时 DQBUF、处理并 QBUF。

> `STREAMON` 返回成功是启动证据；连续 100 次 DQBUF、稳定 bytesused 和连续 sequence 才是短时间稳定出帧证据。

