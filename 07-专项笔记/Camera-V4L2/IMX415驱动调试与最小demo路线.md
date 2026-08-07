# IMX415驱动调试与最小demo路线

## 你要达成什么

这份笔记只服务一件事：

```text
你自己把 IMX415 的 Linux camera 驱动调出来，再写一个最小 demo，完整走一遍
Sensor -> MIPI -> RKISP -> /dev/video0 -> 用户态抓帧 -> 保存/显示
```

不是先写大而全的 AI demo，也不是先做 C++ 工程化。

## 学习顺序

### 第一步：确认驱动入口

先找清楚这几个东西：

- Sensor 节点在哪里
- IMX415 是不是已经在 `media` 拓扑里注册
- `reset`、`pwdn`、`mclk`、`lane`、`link-frequencies` 有没有配对
- `rkisp` 是否已经创建出主采集通道

你要看的不是“代码写得漂不漂亮”，而是：

```text
内核启动后，IMX415 有没有真的 probe 成功
```

### 第二步：确认板端节点

重点节点：

- `/dev/media0`
- `/dev/video0`
- `/dev/video-camera0`

你要确认：

- `/dev/video0` 是否真的是 `rkisp_mainpath`
- 默认格式是不是 `1280x720 NV12`
- `v4l2-ctl --list-devices` 能不能正确看到拓扑
- `v4l2-ctl -d /dev/video0 --all` 能不能读到格式信息

### 第三步：先做最小抓帧 demo

最小 demo 只做三件事：

1. 打开 `/dev/video0`
2. 抓一帧
3. 保存成文件或直接显示

你先不要一开始就写：

- 多线程
- OpenCV 完整项目
- RKNN 推理
- HLS 推流

### 第四步：再做可复用 demo 骨架

当单帧能稳定跑通后，再拆成最小结构：

- `camera_source`
- `frame_sink`
- `demo_app`

建议 demo 从低到高分三版：

1. `v0`：命令行抓帧脚本
2. `v1`：Python demo
3. `v2`：C++ demo

## 驱动调试清单

### 1. 先看启动日志

```bash
dmesg | rg -i "imx415|rkisp|csi|v4l2|media"
```

你要找的是：

- IMX415 有没有 probe
- RKISP 有没有初始化成功
- 有没有 I2C 读 ID 失败
- 有没有 clock / reset / lane 配置错误

### 2. 再看 media 拓扑

```bash
media-ctl -p
v4l2-ctl --list-devices
```

你要确认链路是：

```text
IMX415 -> CSI -> RKISP -> /dev/video0
```

### 3. 再看视频节点

```bash
v4l2-ctl -d /dev/video0 --all
v4l2-ctl -d /dev/video0 --list-formats-ext
```

重点看：

- 分辨率
- Pixel Format
- 是否是 `Video Capture Multiplanar`
- 是否支持 `NV12`

### 4. 再做单帧抓取

```bash
v4l2-ctl -d /dev/video0 \
  --set-fmt-video=width=1280,height=720,pixelformat=NV12 \
  --stream-mmap=3 \
  --stream-count=1 \
  --stream-to=/tmp/imx415_1frame.yuv
```

验收：

- 文件不是 0 字节
- 文件大小符合 `1280 * 720 * 1.5`
- `ffplay` 能在 Windows 上看出来画面

### 5. 再做连续帧

```bash
v4l2-ctl -d /dev/video0 \
  --set-fmt-video=width=1280,height=720,pixelformat=NV12 \
  --stream-mmap=3 \
  --stream-count=30 \
  --stream-to=/tmp/imx415_30frames.yuv
```

验收：

- 连续采集稳定
- 没有明显掉帧
- 没有 `Device or resource busy`

## 最小 demo 骨架

### Python 版最小 demo

只保留这三步：

```python
1. 打开 /dev/video0
2. 抓一帧或连续抓帧
3. 保存为 yuv / jpg / png
```

如果你要接 OpenCV，就走显式 GStreamer pipeline：

```text
v4l2src device=/dev/video0
! video/x-raw,format=NV12,width=1280,height=720
! videoconvert
! video/x-raw,format=BGR
! appsink drop=1 sync=false
```

### C++ 版最小 demo

先别写完整框架，先拆成三个文件就够：

```text
main.cpp
camera_source.cpp/.h
frame_sink.cpp/.h
```

职责只定义成：

- `camera_source`：打开节点、配置格式、拿帧
- `frame_sink`：保存或显示
- `main`：串起来

## 常见问题

- `Device or resource busy`
  - 说明节点被屏幕 Camera demo 或其他进程占用
- `opened False`
  - 说明 OpenCV 默认打开方式不适配当前节点
- `No such file or directory`
  - 说明节点/拓扑没起来，先回头看驱动和 `media-ctl`
- `画面花屏`
  - 先查分辨率、像素格式、stride、旋转方向

## 入口

- [[V4L2命令行抓帧记录]]
- [[OpenCV读取Camera记录]]
- [[Camera驱动第1章-IMX415-Sensor与驱动]]
- [[Camera驱动求职第1周执行计划]]

#Camera #IMX415 #V4L2 #RKISP #Demo #Linux驱动
