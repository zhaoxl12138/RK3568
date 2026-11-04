# Day 5：保存 NV12 并验证图像

Day4 已证明 `DQBUF` 能连续返回完成 Buffer。Day5 第一次读取 mmap 地址中的真实数据并保存文件：

```text
DQBUF
→ buf.index 找到哪一个 mmap Buffer
→ planes[p].bytesused 确定本帧有效长度
→ buffers[index].start[p] 找到用户虚拟地址
→ fwrite 保存 frame_000.nv12
→ FFmpeg 按 NV12 3840×2160 转换成 PNG
```

## 推荐观看顺序

1. 先看 [[05-实验与证据/V4L2用户态取流/Day5-保存NV12并验证图像/图像验证记录|图像验证记录]] 的“地址与长度关系”。
2. 再打开 [[05-实验与证据/V4L2用户态取流/Day5-保存NV12并验证图像/capture_one_frame.c|capture_one_frame.c]]，只搜索：

```text
dequeue_one_frame
→ save_frame
→ buf.index
→ bytesused
→ data_offset
→ fwrite
```

3. 最后直接查看 [[05-实验与证据/V4L2用户态取流/Day5-保存NV12并验证图像/frame_000.png|frame_000.png]]。

今天最重要的一句：

> `length` 是 Buffer 容量，`bytesused` 才是当前帧有效数据长度；保存时不能盲目把整个映射区域全部写入文件。

