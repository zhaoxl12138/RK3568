# AI Camera项目讲解稿

## 一句话介绍

这是一个基于 RK3568 的边缘 AI Camera 项目，完成了从 MIPI摄像头采集、OpenCV预处理、RKNN NPU推理、MIPI屏显示到 RTMP/HLS推流的完整闭环。

## 项目定位

这个项目不是纯算法项目，而是 AI视觉系统工程项目。

重点能力：

- Linux Camera采集链路
- V4L2 / GStreamer / OpenCV多媒体处理
- RKNN模型部署和NPU推理
- 边缘设备上的视频显示和网络推流
- 嵌入式Linux环境下的项目部署和排障

## 当前系统链路

```text
IMX415 MIPI Camera
-> RKISP
-> /dev/video0
-> GStreamer
-> OpenCV BGR frame
-> YOLOv5 RKNN
-> NPU inference
-> postprocess + draw boxes
-> MIPI display
-> FFmpeg RTMP
-> Nginx HLS
-> Windows playback
```

## 关键问题

### Camera读取问题

最开始尝试过 `cv2.VideoCapture(0)`，但在当前板端失败。

原因是 RKISP 暴露的是 V4L2 multiplanar capture设备，OpenCV默认V4L2后端不一定能正确处理。

最终使用显式 GStreamer pipeline，明确指定：

- 设备：`/dev/video0`
- 输入格式：`NV12`
- 分辨率：`1280x720`
- 输出给OpenCV的格式：`BGR`

### RKNN推理问题

先跑通官方最小 `01_lenet`，确认 RKNN runtime、rknn_server、rknn-toolkit-lite2 可用。

之后使用官方 YOLOv5 RKNN模型，完成：

- 单图推理
- Camera单帧推理
- Camera实时推理
- MIPI屏显示
- 推流输出

### 推流问题

板端 GStreamer 有 `rtmpsink`，但缺少 `flvmux`，所以纯GStreamer RTMP推流不可用。

当前采用：

```text
Python OpenCV画框
-> FFmpeg stdin
-> RTMP
-> Nginx
-> HLS
-> Windows播放
```

这个方案可复现、调试成本低，适合当前Python MVP阶段。

## 当前结果

```text
YOLOv5 + MIPI屏实时显示：约3.8 - 4.1 FPS
YOLOv5 + RTMP/HLS输出：约4.9 - 5.0 FPS
```

这些结果说明链路已经跑通，但还不是最终性能。

结果口径：以上 FPS 是当前板端 Python MVP 的实测区间，不是 YOLOv8n 或 C++ 版本指标；复盘时应同时说明输入分辨率、显示/推流路径和测量位置。

## 当前不足

- Python版本不是最终工程实现。
- YOLO后处理仍在CPU上执行。
- 推流通过FFmpeg管道，延迟和资源占用还有优化空间。
- 当前使用RTMP/HLS，后续需要补RTSP。
- 还没有完成采集、推理、显示、推流的多线程拆分。

## 下一步升级

下一阶段会把 Python MVP 升级成 C++工程版本：

- C++17 / CMake项目结构
- CameraSource / Detector / DisplaySink / StreamSink模块拆分
- 采集线程、推理线程、输出线程分离
- RKNN C API接入
- 硬件编码和RTSP输出
- 更完整的README、运行手册和演示截图

## 面试表达重点

这个项目最重要的价值不是“跑了一个YOLO”，而是：

```text
把Camera、Linux多媒体、AI推理、显示和推流这些真实AI Camera组件串成了一个可运行系统。
```

这更接近边缘AI、AI Camera、Linux多媒体岗位的真实工作内容。

事实依据：[[01-实验产物索引|05-实验与证据 / 实验产物索引]]；五分钟版本：[[06-AI-Camera项目五分钟讲解|09-输出沉淀 / AI-Camera项目五分钟讲解]]。
