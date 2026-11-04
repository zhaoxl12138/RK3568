# Day 4：QBUF 与连续取帧

Day3 只是准备好了 Buffer 和用户地址。Day4 第一次让 Camera 真正向这些 Buffer 写入图像。

今天只抓住四个动作：

```text
QBUF
→ 应用把空 Buffer 交给驱动

STREAMON
→ 启动 Capture 队列及上游 Camera 管线

poll + DQBUF
→ 等到一帧完成，并把 DONE Buffer 取回应用

再次 QBUF
→ 应用处理完成后归还 Buffer，让驱动继续写下一帧
```

Buffer 所有权循环：

```text
应用持有 Buffer
      │ QBUF：交给驱动
      ▼
QUEUED → ACTIVE → DONE
                    │ DQBUF：交还应用
                    ▼
               应用读取本帧
                    │ 再次 QBUF
                    └────────────→ 下一轮
```

## 推荐观看顺序

1. 先看 [[05-实验与证据/V4L2用户态取流/Day4-QBUF与连续取帧/Day4-验收记录|Day4 验收记录]] 的“完整控制流”。
2. 再打开 [[05-实验与证据/V4L2用户态取流/Day4-QBUF与连续取帧/capture_10_frames.c|capture_10_frames.c]]，只依次搜索：

```text
queue_one_buffer
→ start_streaming
→ wait_until_frame_ready
→ VIDIOC_DQBUF
→ queue_one_buffer
→ stop_streaming
```

3. 最后再看 `REQBUFS`、`QUERYBUF`、`mmap`，这些是 Day3 已经完成的准备工作。

## 今天的证据边界

连续 `DQBUF`、递增的 `sequence` 和非零 `bytesused`，能够证明驱动持续向 Buffer 交付了帧数据。

但 Day4 还没有保存和查看 NV12，所以仍然不能证明图像亮度、颜色、尺寸和画面内容正确；这属于 Day5。

