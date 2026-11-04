# Day 2：设置 NV12 格式

本实验只需要认识下面一段：

```c
struct v4l2_format fmt = {0};

fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
fmt.fmt.pix_mp.width = 3840;
fmt.fmt.pix_mp.height = 2160;
fmt.fmt.pix_mp.pixelformat = V4L2_PIX_FMT_NV12;
fmt.fmt.pix_mp.field = V4L2_FIELD_NONE;

ioctl(fd, VIDIOC_S_FMT, &fmt);
```

白话解释：应用先把期望值填入 `fmt`，再把 `fmt` 的地址交给驱动。驱动校验后会把实际接受的结果写回同一个 `fmt`，所以后续代码必须使用回填的宽高、格式、`num_planes`、`bytesperline` 和 `sizeimage`。

`S_FMT` 只完成格式协商，不会申请图像 Buffer，也不会启动 Camera 数据流。
